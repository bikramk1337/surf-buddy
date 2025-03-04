import type { PlasmoMessaging } from "@plasmohq/messaging"

import { type OllamaConfig } from "../../utils/utils"

export interface ChatRequest {
  prompt: string
  config: OllamaConfig
}

export type ResponseBody = {
  type: "chunk"| "done"
  content?: string
  error?: string
}


const handler: PlasmoMessaging.PortHandler<
  ChatRequest,
  ResponseBody
> = async (req, res) => {
  const { prompt, config } = req.body

  try {
    const response = await fetch(`${config.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.selectedModel,
        messages: [{ role: "user", content: prompt }],
        stream:true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      )
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const {done, value} = await reader.read()

      if (done) {
        res.send({ type: "done" })
        return
      }

      const chunk = decoder.decode(value)
      const lines = chunk.split("\n").filter(line => line.trim())

      for (const line of lines) {
        try{
          const parsed = JSON.parse(line)

          if (parsed.message?.content !== undefined) {
            res.send({
              type: "chunk",
              content: parsed.message.content
            })  
          }

          if (parsed.done) {
            res.send({
              type: "done"
            })
            return
          }
        } catch (error) {
          console.error("Error parsing JSON:", error)
        }
      }
    }
  } catch (error) {
    console.error("Error generating response:", error)
    res.send({
      type: "chunk",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    })
  }
}

export default handler
