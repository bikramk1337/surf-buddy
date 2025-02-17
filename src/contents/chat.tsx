import type { PlasmoCSConfig } from "plasmo"
import { createRoot } from "react-dom/client"
import Chat from "../components/Chat"

export const config: PlasmoCSConfig = {
  matches: ["https://www.google.com/*", "https://duckduckgo.com/*"]
}

// Create container for the chat component
const container = document.createElement("div")
container.id = "sb-chat"
document.body.appendChild(container)

// Mount React component
const root = createRoot(container)
root.render(<Chat />)