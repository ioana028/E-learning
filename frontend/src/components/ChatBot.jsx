import React, { useState, useRef } from "react";
import "./ChatBot.css";               // ← styling
import { jwtDecode } from "jwt-decode";
import DashboardLayout from "./DashboardLayout";
export const askAI = async (prompt, abortSignal) => {
  const token = localStorage.getItem("token");
  let username = "Utilizator";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.username;
    } catch (e) {
      console.error("Eroare la decodarea tokenului:", e);
    }
  }

  console.log("Prompt primit:", prompt);

  // 🔣 Normalizează textul
  const normalizeText = (text) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const normalizedPrompt = normalizeText(prompt.trim());
  console.log("Prompt normalizat:", normalizedPrompt);

  // 🔍 Întrebare: la ce topicuri am greșit?
  const isErrorTopicQuestion =
    normalizedPrompt === "la ce topicuri am gresit?" ||
    (normalizedPrompt.includes("topic") && normalizedPrompt.includes("gresit"));

  if (isErrorTopicQuestion) {
    console.log("📌 Detectată întrebare despre topicuri greșite");

    try {
      const res = await fetch(`http://localhost:5000/api/user-errors/${username}`, {
        signal: abortSignal,
      });

      if (!res.ok) {
        console.error("Eroare la fetch user-errors:", res.status);
        throw new Error("Eroare la preluarea datelor din baza de date.");
      }

      const data = await res.json();
      console.log("📊 Date returnate:", data);

      if (!data || data.length === 0) {
        return "Nu ai greșit la niciun topic până acum! 🥳";
      }

      const reply =
        "Ai greșit cel mai mult la următoarele topicuri:\n" +
        data
          .map(({ TOPIC, topic, COUNT, count }) =>
            `• ${TOPIC || topic} (${COUNT || count} greșeli)`
          )
          .join("\n");

      return reply;
    } catch (error) {
      console.error("Eroare la preluarea topicurilor greșite:", error);
      return "❌ Nu am putut prelua datele despre greșeli din baza de date.";
    }
  }

  // 🔁 Întrebare: ce ar trebui să repet?
  const isRepeatQuestion =
    normalizedPrompt.includes("ar trebui sa repet") ||
    normalizedPrompt.includes("ce sa repet") ||
    normalizedPrompt.includes("repet") ||
    normalizedPrompt.includes("ce ar trebui sa invat");

  if (isRepeatQuestion) {
    console.log("🔁 Detectată întrebare despre ce să repeți");

    try {
      const res = await fetch(`http://localhost:5000/api/user-errors/${username}`, {
        signal: abortSignal,
      });

      if (!res.ok) {
        console.error("Eroare la fetch user-errors:", res.status);
        throw new Error("Eroare la preluarea datelor din baza de date.");
      }

      const data = await res.json();
      console.log("📊 Date pentru recomandare repetare:", data);

      if (!data || data.length === 0) {
        return "🎉 Nu e nevoie să repeți nimic acum — nicio greșeală detectată!";
      }

      const top = data[0];
      const topic = top.TOPIC || top.topic;
      const count = top.COUNT || top.count;

      return `🔁 Ar fi bine să repeți topicul **"${topic}"** – ai avut ${count} greșeli acolo.`;
    } catch (error) {
      console.error("Eroare la recomandarea topicului de repetat:", error);
      return "❌ Nu am putut determina ce ar trebui să repeți.";
    }
  }

  // 📧 Întrebare: ce email am?
  const isEmailQuestion =
    normalizedPrompt === "ce email am" || normalizedPrompt.includes("email");

  if (isEmailQuestion) {
    console.log("📧 Detectată întrebare despre email");

    try {
      const res = await fetch(`http://localhost:5000/api/user-profile/${username}`, {
        signal: abortSignal,
      });

      if (!res.ok) throw new Error("Eroare la fetch profil.");

      const data = await res.json();
      console.log("📬 Email din API:", data.email);

      return data.email
        ? `📧 Emailul tău este: ${data.email}`
        : "❌ Nu am găsit emailul tău în profil.";
    } catch (err) {
      console.error("❌ Eroare la obținerea emailului:", err);
      return "❌ Nu am putut prelua emailul din profil.";
    }
  }

  // 🤖 Altfel, trimite promptul la Gemini
  try {
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
        generationConfig: { temperature: 0.8 },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API a răspuns cu eroare:", res.status);
      throw new Error("Gemini request failed");
    }

    const data = await res.json();
    console.log("Răspuns Gemini:", data);

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "-- no answer received --"
    );
  } catch (err) {
    console.error("Eroare la trimiterea către Gemini:", err);
    throw err;
  }
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
