import { useState, useEffect } from "react";
import "styles/config.css";
import Header from "./Header";
import { checkConnection, fetchModels, DEFAULT_OLLAMA_URL } from "../utils";

export default function Config({ onBack }: { onBack: () => void }) {
    const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL);
    const [connectionStatus, setConnectionStatus] = useState("");
    const [models, setModels] = useState<{ name: string }[]>([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [isModelSectionVisible, setIsModelSectionVisible] = useState(false);
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);

    // Simulate checking connection to Ollama
    const checkOllamaConnection = async () => {
        setConnectionStatus("Connecting...");
        const isConnected = await checkConnection(ollamaUrl);
        if (isConnected) {
        setConnectionStatus("Connected");
        setIsModelSectionVisible(true);
        fetchOllamaModels();
        } else {
        setConnectionStatus("Connection failed");
        }
    };

    // Fetch available models from Ollama
    const fetchOllamaModels = async () => {
        const models = await fetchModels(ollamaUrl);
        setModels(models);
        setIsSaveDisabled(false);
    };

    // Handle URL change
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOllamaUrl(e.target.value);
        setIsModelSectionVisible(false);
        setConnectionStatus("");
    };

    // Handle model selection
    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(e.target.value);
    };

    // Save configuration
    const handleSave = () => {
        console.log("Configuration saved:", { ollamaUrl, selectedModel });
        //TODO: Add logic to save configuration
    };

    // Refresh models
    const handleRefreshModels = () => {
        fetchOllamaModels();
    };

    useEffect(() => {
        if (ollamaUrl) {
        checkOllamaConnection();
        }
    }, [ollamaUrl]);

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
                <div id="connection-status" className="status">
                    {connectionStatus}
                </div>
                </div>

                {isModelSectionVisible && (
                <div className="config-step" id="model-section">
                    <label htmlFor="model-select">Select Model</label>
                    <select
                    id="model-select"
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={models.length === 0}
                    >
                    {models.length === 0 ? (
                        <option value="">Loading models...</option>
                    ) : (
                        models.map((model) => (
                        <option key={model.name} value={model.name}>
                            {model.name}
                        </option>
                        ))
                    )}
                    </select>
                    <button
                    id="refresh-models"
                    className="button-secondary"
                    onClick={handleRefreshModels}
                    >
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
    );
}

