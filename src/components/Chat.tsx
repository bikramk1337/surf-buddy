import sendIcon from "data-base64:../../assets/send-icon.svg"
import React, { useEffect, useState, useRef } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import type {
  ChatRequest,
  ResponseBody
} from "../background/messages/ollama-chat"
import { loadConfigFromStorage, type OllamaConfig } from "../utils"

import "../styles/chat.css"

interface Message {
  type: "user" | "assistant" | "system"
  content: string
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<OllamaConfig | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  useEffect(() => {
    const loadConfig = async () => {
      const savedConfig = await loadConfigFromStorage()
      setConfig(savedConfig)
      addMessage({
        type: "system",
        content: savedConfig
          ? "Hello! I can help you understand these search results better. What would you like to know?"
          : "Please configure Ollama settings first."
      })
    }
    loadConfig()
  }, [])

  // Auto adjust texttarea height
  useEffect(() => {
    const textarea = textAreaRef.current
    if (textarea) {
      textarea.style.height = "12px"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [inputValue])

  const handleSubmit = async () => {
    if (isLoading || !inputValue.trim() || !config) return

    const userMessage = inputValue.trim()
    setInputValue("")
    setIsLoading(true)

    addMessage({ type: "user", content: userMessage })

    try {
      const response = await sendToBackground<ChatRequest, ResponseBody>({
        name: "ollama-chat",
        body: {
          prompt: userMessage,
          config: config
        }
      })

      if (response) {
        addMessage({ type: "assistant", content: response })
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      addMessage({
        type: "system",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      })
    } finally {
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
    <div className="chat-container">
      <div className="chat-header">
        <span className="chat-title">SurfBuddy Chat</span>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message message-${message.type}`}>
            {message.content}
          </div>
        ))}
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
            aria-label="Send message"
            >
            <img src={sendIcon} alt="Send" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
