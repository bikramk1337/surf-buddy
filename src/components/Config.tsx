import { useCallback, useEffect, useState } from "react"

import Header from "./Header"

import "styles/config.css"

import {
  checkConnection,
  DEFAULT_OLLAMA_URL,
  fetchModels,
  loadConfigFromStorage,
  saveConfigToStorage,
  type ConnectionState,
  type OllamaConfig,
  type OllamaModel
} from "../utils"

interface ConfigProps {
  onBack: () => void
  onSave?: (config: OllamaConfig) => void
}

export default function Config({ onBack, onSave }: ConfigProps) {
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL)
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "idle"
  })
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  )

  const isConnectionSuccessful = connectionState.status === "connected"
  const isSaveDisabled = !isConnectionSuccessful || !selectedModel

  // Fetch models function
  const fetchOllamaModels = useCallback(
    async (url: string) => {
      console.log("Fetching models for URL:", url)
      setIsLoading(true)

      try {
        const fetchedModels = await fetchModels(url)
        console.log("Fetched models:", fetchedModels)
        setModels(fetchedModels)

        // Handle model selection
        if (fetchedModels.length > 0) {
          if (
            !selectedModel ||
            !fetchedModels.some(
              (model) => model.name === selectedModel
            )
          ) {
            setSelectedModel(fetchedModels[0].name)
          }
        }
      } catch (error) {
        console.error("Error fetching models:", error)
        setModels([])
        setSelectedModel("")
      } finally {
        setIsLoading(false)
      }
    },
    [selectedModel]
  )

  // Initialize connection and load config
  useEffect(() => {
    const initializeConfig = async () => {
      try {
        console.log("Initializing config...")
        const savedConfig = await loadConfigFromStorage()

        if (savedConfig) {
          console.log("Found saved config:", savedConfig)
          setOllamaUrl(savedConfig.ollamaUrl)
          setSelectedModel(savedConfig.selectedModel)
        }
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }

    initializeConfig()
  }, [])

  // Handle URL changes and connection check
  useEffect(() => {
    if (!ollamaUrl) return

    console.log("Checking connection for URL:", ollamaUrl)
    const checkOllamaConnection = async () => {
      setConnectionState({ status: "connecting" })

      try {
        const isConnected = await checkConnection(ollamaUrl)
        console.log("Connection check result:", isConnected)

        if (isConnected) {
          setConnectionState({ status: "connected" })
          await fetchOllamaModels(ollamaUrl)
        } else {
          setConnectionState({
            status: "failed",
            error: "Could not connect to Ollama server!"
          })
        }
      } catch (error) {
        console.error("Connection error:", error)
        setConnectionState({
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Unknown error occurred"
        })
      }
    }

    const debounceTimer = setTimeout(checkOllamaConnection, 500)
    return () => clearTimeout(debounceTimer)
  }, [ollamaUrl, fetchOllamaModels])

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value.trim()
    console.log("URL changed to:", newUrl)
    setOllamaUrl(newUrl)
    setConnectionState({ status: "idle" })
    setModels([])
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value)
    setSaveStatus("idle")
  }

  const handleRefreshModels = async () => {
    if (isConnectionSuccessful) {
      await fetchOllamaModels(ollamaUrl)
    }
  }

  const handleSave = async () => {
    if (isSaveDisabled) return

    try {
      const config: OllamaConfig = {
        ollamaUrl,
        selectedModel
      }

      await saveConfigToStorage(config)
      setSaveStatus("success")

      if (onSave) {
        onSave(config)
      }

      alert("Configuration saved successfully!")
    } catch (error) {
      setSaveStatus("error")
      console.error("Failed to save configuration:", error)
      alert("Failed to save configuration. Please try again.")
    }
  }

  // Debug logs for state changes
  useEffect(() => {
    console.log("Current state:", {
      ollamaUrl,
      connectionState,
      models: models.length,
      selectedModel,
      isLoading
    })
  }, [ollamaUrl, connectionState, models, selectedModel, isLoading])

  return (
    <div className="config-container">
      <Header />

      <div className="config-section">
        <div className="config-step">
          <label htmlFor="ollama-url">Ollama URL</label>
          <div className="url-container">
            <input
              type="url"
              id="ollama-url"
              placeholder="http://localhost:11434"
              value={ollamaUrl}
              onChange={handleUrlChange}
            />
          </div>
          {connectionState.status === "connecting" && (
            <div className="status status-warning">
              Connecting to Ollama server...
            </div>
          )}
          {connectionState.status === "connected" && (
            <div className="status status-success">
              Connected to Ollama server
            </div>
          )}
          {connectionState.error && (
            <div className="status status-error">
              {connectionState.error}
            </div>
          )}
        </div>

        {isConnectionSuccessful && (
          <div className="config-step" id="model-section">
            <label htmlFor="model-select">Select Model</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={handleModelChange}
              disabled={isLoading}>
              {isLoading ? (
                <option value="">Loading models...</option>
              ) : models.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))
              )}
            </select>
            <button
              className="button-secondary"
              onClick={handleRefreshModels}
              disabled={isLoading || !isConnectionSuccessful}>
              Refresh Models
            </button>
          </div>
        )}
      </div>

      <div className="button-row">
        <button
          id="save-config"
          disabled={isSaveDisabled}
          onClick={handleSave}
          className={
            saveStatus === "success"
              ? "success"
              : saveStatus === "error"
                ? "error"
                : ""
          }>
          Save Configuration
        </button>
        <button
          id="back-button"
          className="button-secondary"
          onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
}
