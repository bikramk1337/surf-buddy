export const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export const checkConnection = async (ollamaUrl: string) => {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, { mode: 'no-cors' });
    return response.ok;
  } catch (error) {
    console.error("Connection failed:", error);
    return false;
  }
};

export const fetchModels = async (ollamaUrl: string) => {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    const data = await response.json();
    return data.models;
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return [];
  }
};