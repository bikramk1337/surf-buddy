import { useEffect, useState } from "react"

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

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<OllamaConfig | null>(null)

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  useEffect(() => {
    const loadConfig = async () => {
      const savedConfig = await loadConfigFromStorage()
      setConfig(savedConfig)
      if (savedConfig) {
        addMessage({
          type: "system",
          content:
            "Hello! I can help you understand these search results better. What would you like to know?"
        })
      } else {
        addMessage({
          type: "system",
          content: "Please configure Ollama settings first."
        })
      }
    }
    loadConfig()
  }, [])

  const handleSubmit = async () => {
    if (!inputValue.trim() || !config) return

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

      console.log("Got response:", response)
      addMessage({ type: "assistant", content: response })
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
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="chat-input"
          placeholder="Ask about the search results..."
          disabled={isLoading || !config}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !config}
          className="chat-send">
          Send
        </button>
      </div>
    </div>
  )
}
