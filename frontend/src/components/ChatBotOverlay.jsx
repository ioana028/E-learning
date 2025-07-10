// src/components/ChatBotOverlay.jsx
import React, { useState, useRef } from "react";
import "./ChatBotOverlay.css";
import { askAI } from "./ChatBot"; // dacă e exportat acolo

const ChatBotOverlay = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [controller, setController] = useState(null);
  const bottom = useRef(null);

  const scrollDown = () => bottom.current?.scrollIntoView({ behavior: "smooth" });

  const sendPrompt = async (e) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setInput("");

    const newCtrl = new AbortController();
    setController(newCtrl);

    try {
      const reply = await askAI(prompt, newCtrl.signal);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((m) => [...m, { role: "bot", text: "❌ Eroare la Gemini." }]);
      }
    } finally {
      setController(null);
      scrollDown();
    }
  };

  return (
    <div className="chatbot-overlay">
      <div className="header">
        <h4 style={{ display: "flex", alignItems: "center", gap: "8px" }}><img src="/images/bot.png" alt="AI" style={{ width: "33px", height: "30px", marginLeft: "-7px" }} />  AI Chat</h4>
        <button onClick={onClose}>✖</button>
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      <form className="bar" onSubmit={sendPrompt}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrie întrebarea aici..."
        />
         <button type="submit" className="icon-only-btn">
    <img
      src="/images/send_message.png"
      alt="Trimite"
      className="icon-image"
    />
  </button>

  
      </form>
    </div>
  );
};

export default ChatBotOverlay;
