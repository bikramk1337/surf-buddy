import { ArrowUpFromDot, Maximize2, Minimize2 } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

import { usePort } from "@plasmohq/messaging/hook"

import type { ChatRequest, ResponseBody } from "../background/ports/ollama-chat"
import { loadConfigFromStorage, type OllamaConfig } from "../utils"
import TypingIndicator from "./TypingIndicator"

import "../styles/chat.css"

interface Message {
  type: "user" | "assistant" | "system"
  content: string
  isStreaming?: boolean
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [config, setConfig] = useState<OllamaConfig | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatPort = usePort<ChatRequest, ResponseBody>("ollama-chat")

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const updateLastMessage = (content: string) => {
    setMessages((prev) =>
      prev.length > 0
        ? [
            ...prev.slice(0, -1),
            {
              ...prev[prev.length - 1],
              content: prev[prev.length - 1].content + content
            }
          ]
        : prev
    )
  }

  useEffect(() => {
    loadConfigFromStorage().then((savedConfig) => {
      setConfig(savedConfig)
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          content: savedConfig
            ? "Hello! I can help you understand these search results better. What would you like to know?"
            : "Please configure Ollama settings first."
        }
      ])
    })
  }, [])
  // Auto adjust texttarea height
  useEffect(() => {
    const textarea = textAreaRef.current
    if (textarea) {
      textarea.style.height = "12px"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [inputValue])

  // Scroll to bottom when new message is sent or received
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Set up port message listener
  useEffect(() => {
    const handleMessage = (response: ResponseBody) => {
      setMessages((prev) => {
        if (response.type === "chunk" && response.content) {
          return prev.length > 0
            ? [
                ...prev.slice(0, -1),
                {
                  ...prev[prev.length - 1],
                  content: prev[prev.length - 1].content + response.content
                }
              ]
            : prev
        } else if (response.type === "done") {
          return prev.length > 0
            ? [
                ...prev.slice(0, -1),
                { ...prev[prev.length - 1], isStreaming: false }
              ]
            : prev
        }
        return prev
      })
      if (response.type === "done") {
        setIsLoading(false)
      }
    }

    const { disconnect } = chatPort.listen(handleMessage)
    return () => disconnect()
  }, [chatPort])

  const handleSubmit = async () => {
    if (isLoading || !inputValue.trim() || !config) return

    const userMessage = inputValue.trim()
    setInputValue("")
    setIsLoading(true)

    addMessage({ type: "user", content: userMessage })
    addMessage({ type: "assistant", content: "", isStreaming: true })

    try {
      await chatPort.send({
        prompt: userMessage,
        config: config
      })
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      addMessage({
        type: "system",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      })
      setIsLoading(false)
    }
  }

  // Handle input key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={`chat-container ${isMinimized ? "minimized" : ""}`}>
      <div className="chat-header">
        <span className="chat-title">Surf Buddy</span>
        <button
          className="chat-minimize"
          onClick={() => setIsMinimized(!isMinimized)}>
          {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message message-${message.type} ${message.isStreaming ? "streaming" : ""}`}>
            {message.content || (message.isStreaming && <TypingIndicator />)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={textAreaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="chat-input"
            placeholder="Ask about the search results..."
            disabled={!config}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !config}
            className="chat-send"
            aria-label="Send message">
            <ArrowUpFromDot size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
