import { useState } from "react"
import sbIcon from "data-base64:../assets/icon.png"
import "styles/popup.css"

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <div>
      <div className="header">
        <img src={sbIcon} alt="SurfBuddy"/>
        <h1>SurfBuddy</h1>
      </div>
      <p>Summarize search results and chat with Ollama models locally.</p>
    </div>
  )
}

export default IndexPopup
