import { motion } from "framer-motion"
import React from "react"

import "../styles/typing.css"

const TypingIndicator: React.FC = ({}) => {
  return (
    <div className="typing-indicator">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="dot"
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}>
          &#x2022;
        </motion.div>
      ))}
    </div>
  )
}

export default TypingIndicator
