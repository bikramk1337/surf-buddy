import { useState } from "react"
import sbIcon from "data-base64:../../assets/icon.png"
import "styles/root.css"

export default function Header() {
    return (
        <div className="header">
            <img src={sbIcon} alt="SurfBuddy" />
            <h1>SurfBuddy</h1>
            <p>Summarize search results and chat with Ollama models locally.</p>
        </div>
    )
}