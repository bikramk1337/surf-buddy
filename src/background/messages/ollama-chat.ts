import type { PlasmoMessaging } from "@plasmohq/messaging"

import { type OllamaConfig } from "../../utils"

export interface ChatRequest {
  prompt: string
  config: OllamaConfig
}

export type ResponseBody = string

const handler: PlasmoMessaging.MessageHandler<
  ChatRequest,
  ResponseBody
> = async (req, res) => {
  const { prompt, config } = req.body

  try {
    const response = await fetch(`${config.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        model: config.selectedModel,
        messages: [{ role: "user", content: prompt }],
        stream:false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response:", errorText, "Status code:", response.status) 
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      )
    }

    const data = await response.json()
    console.log("Response data:", data)

    const assistantMessage = data.message?.content || "No message returned"
    res.send(assistantMessage)
  } catch (error) {
    console.error("Error generating response:", error)
    throw error
  }
}

export default handler
