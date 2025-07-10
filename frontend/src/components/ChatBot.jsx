import React, { useState, useRef } from "react";
import "./ChatBot.css";               // ← styling
import { jwtDecode } from "jwt-decode";
import DashboardLayout from "./DashboardLayout";
export const askAI = async (prompt, abortSignal) => {
  const token = localStorage.getItem("token");
  let username = "Utilizator";

  if (token) {
    const decoded = jwtDecode(token);
    username = decoded.username;
  }
  const API_KEY = process.env.REACT_APP_GEMINI_KEY;
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    "gemini-1.5-flash:generateContent?key=" + API_KEY;
    const promptWithUser = `Utilizator: ${username}. Întrebare: ${prompt}`;

   const res = await fetch(url, {
    method: "POST",
    signal: abortSignal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: promptWithUser }] }],
      generationConfig: { temperature: 0.8 }
    })
  });

  if (!res.ok) throw new Error("Gemini request failed");
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "-- no answer received --"
  );
};

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [controller, setController] = useState(null);
  const bottom = useRef(null);

  const scrollDown = () => bottom.current?.scrollIntoView({ behavior: "smooth" });

  const sendPrompt = async (e) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    // show user prompt
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setInput("");

    // prepare abort controller
    const newCtrl = new AbortController();
    setController(newCtrl);

    try {
      const reply = await askAI(prompt, newCtrl.signal);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch (err) {
      if (err.name !== "AbortError")
        setMessages((m) => [...m, { role: "bot", text: "❌  Eroare la Gemini." }]);
    } finally {
      setController(null);
      scrollDown();
    }
  };

  const stop = () => controller?.abort();

  return (
    <DashboardLayout>
     

    <div className="chatbot-page">
      <img className="bot-icon" src="/images/bot.png" alt="Bot" />
      <h1 className="title">
  
  Gemini Chat
</h1>


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
    placeholder="Scrie întrebarea aici…"
  />
  
  <button type="submit" className="icon-only-btn">
    <img
      src="/images/send_message.png"
      alt="Trimite"
      className="icon-image"
    />
  </button>

  <button
    type="button"
    onClick={stop}
    disabled={!controller}
    className="icon-only-btn"
  >
    <img
      src="/images/stop_generating.png"
      alt="Stop generare"
      className="icon-image"
    />
  </button>
</form>


      <p className="note">⚠️ Gemini poate greși — verifică faptele.</p>
    </div>
    </DashboardLayout>
  );
}
