import browser from 'webextension-polyfill';

export const DEFAULT_OLLAMA_URL = "http://localhost:11434"

export interface OllamaModel {
  name: string
  modelfile?: string
  parameters?: Record<string, unknown>
  template?: string
  size?: number
  digest?: string
}

export interface ConnectionState {
  status: "idle" | "connecting" | "connected" | "failed"
  error?: string
}

export interface OllamaConfig {
  ollamaUrl: string
  selectedModel: string
}

const STORAGE_KEY = "ollama-config"

export const saveConfigToStorage = async (
  config: OllamaConfig
): Promise<void> => {
  try {
      await browser.storage.local.set({ [STORAGE_KEY]: config })
  } catch (error) {
      console.error("Failed to save config to storage:", error)
      throw error
  }
}

export const loadConfigFromStorage = async (): Promise<OllamaConfig | null> => {
  try {
      const result = await browser.storage.local.get(STORAGE_KEY)
      if (!result[STORAGE_KEY]) {
          return null
      }
      return result[STORAGE_KEY] as OllamaConfig
  } catch (error) {
      console.error("Failed to load config from storage:", error)
      return null
  }
}

export const checkConnection = async (ollamaUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Connection failed:", error)
    return false
  }
}

export const fetchModels = async (
  ollamaUrl: string
): Promise<OllamaModel[]> => {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.models || []
  } catch (error) {
    console.error("Failed to fetch models:", error)
    throw error
  }
}