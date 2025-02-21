import type {
  PlasmoCSConfig,
  PlasmoCSUIJSXContainer,
  PlasmoCSUIProps,
  PlasmoRender
} from "plasmo"
import type { FC } from "react"
import { createRoot } from "react-dom/client"

import Chat from "../components/Chat"

export const config: PlasmoCSConfig = {
  matches: ["https://www.google.com/*", "https://duckduckgo.com/*"]
}

// Reference from examples/with-content-scripts-ui/contents/plasmo-root-container.tsx
// Get root container
export const getRootContainer = () =>
  new Promise<HTMLElement>((resolve) => {
    const checkInterval = setInterval(() => {
      const rootContainerParent = document.body
      if (rootContainerParent) {
        clearInterval(checkInterval)
        const rootContainer = document.createElement("div")
        rootContainer.id = "sb-chat"
        rootContainerParent.appendChild(rootContainer)
        resolve(rootContainer)
      }
    }, 137)
  })

// Chat overlay component
const ChatOverlay: FC<PlasmoCSUIProps> = () => {
  return <Chat />
}

// Render function
export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
  createRootContainer
}) => {
  const rootContainer = await createRootContainer()
  const root = createRoot(rootContainer)
  root.render(<ChatOverlay />)
}

export default ChatOverlay
