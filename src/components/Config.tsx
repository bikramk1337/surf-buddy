import { useCallback, useEffect, useRef, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

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
} from "../utils/utils"

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

  // Track initial value configs to detect change
  const initialConfig = useRef<OllamaConfig | null>(null)

  const isConnectionSuccessful = connectionState.status === "connected"
  const hasChanges =
    initialConfig.current &&
    (initialConfig.current.ollamaUrl !== ollamaUrl ||
      initialConfig.current.selectedModel !== selectedModel)
  const isSaveDisabled =
    !isConnectionSuccessful || !selectedModel || !hasChanges

  const toastShown = useRef(false)

  // Fetch models function
  const fetchOllamaModels = useCallback(async (url: string) => {
    setIsLoading(true)
    try {
      const fetchedModels = await fetchModels(url)
      setModels(fetchedModels)

      if (fetchedModels.length > 0) {
        // Use a functional update to preserve the current selection if possible
        setSelectedModel((prev) =>
          fetchedModels.some((model) => model.name === prev)
            ? prev
            : fetchedModels[0].name
        )
      }
    } catch (error) {
      console.error("Error fetching models:", error)
      setModels([])
      setSelectedModel("")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize connection and load config
  useEffect(() => {
    const initializeConfig = async () => {
      try {
        const savedConfig = await loadConfigFromStorage()

        initialConfig.current = savedConfig || {
          ollamaUrl: DEFAULT_OLLAMA_URL,
          selectedModel: ""
        }

        setOllamaUrl(initialConfig.current.ollamaUrl)
        setSelectedModel(initialConfig.current.selectedModel)
      } catch (error) {
        console.error("Error loading config:", error)
        initialConfig.current = {
          ollamaUrl: DEFAULT_OLLAMA_URL,
          selectedModel: ""
        }
      }
    }
    initializeConfig()
  }, [])

  // Handle URL changes and connection check
  useEffect(() => {
    if (!ollamaUrl) return

    const checkOllamaConnection = async () => {
      setConnectionState({ status: "connecting" })

      try {
        const isConnected = await checkConnection(ollamaUrl)

        if (isConnected) {
          setConnectionState({ status: "connected" })
          if (!toastShown.current) {
            toast.success("Connected to Ollama!", { duration: 2000 })
            toastShown.current = true
          }

          // Only fetch models if not already fetched
          if (models.length === 0) {
            await fetchOllamaModels(ollamaUrl)
          }
        } else {
          setConnectionState({
            status: "failed",
            error: "Could not connect to Ollama server!"
          })
          toast.error("Connection failed!", { duration: 2000 })
        }
      } catch (error) {
        setConnectionState({
          status: "failed",
          error:
            error instanceof Error ? error.message : "Unknown error occurred"
        })
        toast.error("Connection failed!", { duration: 2000 })
      }
    }

    const debounceTimer = setTimeout(checkOllamaConnection, 500)
    return () => clearTimeout(debounceTimer)
  }, [ollamaUrl, fetchOllamaModels, models.length])

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOllamaUrl(e.target.value.trim())
    setConnectionState({ status: "idle" })
    setModels([])
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value)
    setSaveStatus("idle")
  }

  const handleRefreshModels = async () => {
    if (!isConnectionSuccessful) return

    toast.promise(fetchOllamaModels(ollamaUrl), {
      loading: "Refreshing models...",
      success: "Models refreshed successfully!",
      error: "Failed to refresh models."
    })
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
      initialConfig.current = config

      if (onSave) {
        onSave(config)
      }

      toast.success("Configuration saved successfully!", { duration: 2000 })
    } catch (error) {
      setSaveStatus("error")
      console.error("Failed to save configuration:", error)
      toast.error("Failed to save configuration.")
    }
  }

  return (
    <div className="config-container">
      <Toaster position="top-center" reverseOrder={false} />
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
        <button id="back-button" className="button-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
}
