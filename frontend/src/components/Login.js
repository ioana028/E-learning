import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // Importă fișierul CSS separat



const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", { username, password });
      console.log("📢 Login API Response:", response.data);
      if (response.data.success  && response.data.token) {
        localStorage.setItem("token", response.data.token); // ✅ Store token
        console.log("✅ Token saved in localStorage:", response.data.token);
        navigate("/chapters");
      } else {
        console.error("❌ Login failed:", response.data.message);
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred during login");
    }
  };

  return (
    <div className="loginWraper">
    <img className="plant1" src="/images/plant1.png" alt="plant1"></img>
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">E-Learning Login</h2>
        {error && <p className="login-error">{error}</p>}
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Nume utilizator"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="parola"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    </div>
    <img className="plant2" src="/images/plant2.png" alt="plant1"></img>
    </div>
  );
};

export default Login;
