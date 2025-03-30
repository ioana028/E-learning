import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css"; // Import stiluri externe

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); 
  
    try {
      console.log("Trimit datele către server...");
  
      const response = await axios.post("http://localhost:5000/register", {
        username,
        email,
        password,
      });
  
      console.log("Răspuns întreg de la server:", response); // Vezi structura răspunsului
      console.log("Răspuns JSON:", response.data); // Vezi ce trimite backend-ul
  
      if (response.data.success) {
        console.log("Înregistrare reușită! Redirecționez către login...");
        navigate("/login");
      } else {
        setError(response.data.message || "Înregistrare eșuată.");
      }
    } catch (err) {
      console.error("Eroare la request:", err);
      setError("Eroare la înregistrare. Încercați din nou.");
    }
  };
  
  

  return (
    <div className="registerWraper">
    <img className="register-climbing-plant2" src="/images/climbing-plant2.png" alt="plant1"></img>
    <div className="register-container">
      <form onSubmit={handleRegister} className="register-card">
        <h2 className="register-title">Creează un cont</h2>
        {error && <p className="register-error">{error}</p>}
        <input
          type="text"
          placeholder="Nume utilizator"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="register-input"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="register-input"
          required
        />
        <input
          type="password"
          placeholder="Parolă"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="register-input"
          required
        />
        <button type="submit" className="register-button">Înregistrare</button>
        <p className="register-login-text">
          Ai deja cont? <span onClick={() => navigate("/login")} className="login-link">Conectează-te</span>
        </p>
      </form>
    </div>
    <img className="register-plant2" src="/images/plant2.png" alt="plant1"></img>

    </div>
  );
};

export default Register;
