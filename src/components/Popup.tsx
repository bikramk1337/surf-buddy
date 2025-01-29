import { useState } from "react"
import Header from "./Header"
import "styles/root.css"
import Config from "./Config" 

export default function Popup() {
  const [showConfig, setShowConfig] = useState(false) 

  return (
    <div>
      {showConfig ? (
        <Config onBack={() => setShowConfig(false)} /> 
      ) : (
        <div>
          <Header />
          
          <button
            id="configure"
            className="button-secondary"
            onClick={() => setShowConfig(true)} 
          >
            Configure Ollama
          </button>
        </div>
      )}
    </div>
  )
}
