// src/components/SetLevel.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SetLevel.css";

const SetLevel = () => {
  const [level, setLevel] = useState("");
  const navigate = useNavigate();
  const levels = [
    { code: "A1 ", desc: "-- Știu o bază" },
    { code: "A2 ", desc: "-- Pot înțelege lucruri simple" },
    { code: "B1 ", desc: "-- Mă descurc în conversații obișnuite" },
    { code: "B2 ", desc: "-- Mă descurc destul de bine" },
    { code: "C1 ", desc: "-- Mă exprim fluent în majoritatea situațiilor" },
    { code: "C2 ", desc: "-- Am un nivel aproape nativ" }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.post("http://localhost:5000/set-level", { level }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/login"); // după salvare, redirect la capitole
    } catch (err) {
      console.error("Eroare la salvarea nivelului:", err);
    }
  };

  return (
    <div className="set-level-container">
      <form onSubmit={handleSubmit} className="set-level-form">
  <h2>Alege nivelul tău de engleză</h2>

  <div className="level-options">
  {levels.map((lvl) => (
    <label key={lvl.code} className={`level-option ${level === lvl.code ? "selected" : ""}`}>
      <input
        type="radio"
        value={lvl.code}
        checked={level === lvl.code}
        onChange={() => setLevel(lvl.code)}
      />
      <span className="level-code">{lvl.code}</span>
      <span className="level-desc">{lvl.desc}</span>
    </label>
  ))}
</div>


  <button type="submit" disabled={!level}>Salvează</button>
</form>

    </div>
  );
};

export default SetLevel;
