import { useCallback, useEffect, useState } from "react"

import Header from "./Header"

import "styles/config.css"

import {
  checkConnection,
  DEFAULT_OLLAMA_URL,
  fetchModels,
  type ConnectionState,
  type OllamaModel
} from "../utils"

interface ConfigProps {
  onBack: () => void
  onSave?: (config: { ollamaUrl: string; selectedModel: string }) => void
}

export default function Config({ onBack, onSave }: ConfigProps) {
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL)
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "idle"
  })
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const isConnectionSuccessful = connectionState.status === "connected"
  const isSaveDisabled = !isConnectionSuccessful || !selectedModel

  const checkOllamaConnection = useCallback(async () => {
    setConnectionState({ status: "connecting" })
    try {
      const isConnected = await checkConnection(ollamaUrl)
      if (isConnected) {
        setConnectionState({ status: "connected" })
        await fetchOllamaModels()
      } else {
        setConnectionState({
          status: "failed",
          error: "Could not connect to Ollama server"
        })
      }
    } catch (error) {
      setConnectionState({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      })
    }
  }, [ollamaUrl])

  // Fetch available models from Ollama
  const fetchOllamaModels = async () => {
    setIsLoading(true)
    try {
      const fetchedModels = await fetchModels(ollamaUrl)
      setModels(fetchedModels)
      if (fetchedModels.length > 0 && !selectedModel) {
        setSelectedModel(fetchedModels[0].name)
      }
    } catch (error) {
      setConnectionState({
        status: "failed",
        error: "Failed to fetch models"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOllamaUrl(e.target.value)
    setConnectionState({ status: "idle" })
    setModels([])
    setSelectedModel("")
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value)
  }

  const handleSave = () => {
    if (onSave) {
      onSave({ ollamaUrl, selectedModel })
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (ollamaUrl) {
        checkOllamaConnection()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [ollamaUrl, checkOllamaConnection])

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
            <div className="status status-warning">Connecting...</div>
          )}

          {connectionState.error && (
            <div className="status status-error">{connectionState.error}</div>
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
              onClick={fetchOllamaModels}
              disabled={isLoading}>
              Refresh Models
            </button>
          </div>
        )}
      </div>

      <div className="button-row">
        <button id="save-config" disabled={isSaveDisabled} onClick={handleSave}>
          Save Configuration
        </button>
        <button id="back-button" className="button-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
}
