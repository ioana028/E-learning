// src/components/DashboardLayout.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./DashboardLayout.css"; // nou css pentru layout general

const DashboardLayout = ({ children, showBack = true }) => {
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState("/images/default-avatar.jpg");
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [username, setUsername] = useState("Utilizator");


  useEffect(() => {



    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const user = decoded.username;
      setUsername(user);

      // Avatar
      const url = `http://localhost:5000/avatars/${user}.jpg`;
      fetch(url)
        .then((res) => res.ok && setAvatarUrl(url))
        .catch(() => { });

      // XP și Coins
      axios.get(`http://localhost:5000/api/user-stats/${user}`)
        .then((res) => {
          console.log("📦 Date user-stats:", res.data); // ← Asta vezi în browser
          if (res.data.success) {
            setXp(res.data.XP || res.data.xp || 0);
            setCoins(res.data.COINS || res.data.coins || 0);
          }
        })
        .catch(err => console.log("Eroare la fetch XP/coins:", err));

    }
  }, []);


  return (
    <div className="dashboard-container-dashboard">



      {/* top bar */}
      <div className="top-bar">
        {/* back bar */}
        {showBack && (
          <div className="back-bar-dashboard" onClick={() => navigate(-1)}>
            <span className="back-arrow-dashboard">←</span>
            <span className="back-text-dashboard">Înapoi</span>
          </div>
        )}
        <div className="xp-coins-box-d">
          <p><strong>XP:</strong> {xp}</p>
          <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
            <img
              src="/images/coin.png"
              alt="coin"
              style={{ width: "18px", height: "18px" }}
            />
            {coins}
          </p>
        </div>

        <div className="user-profile" onClick={() => navigate("/profil")} style={{ cursor: "pointer" }}>
          <img
            src={avatarUrl}
            alt="Profil"
            className="profile-picture"
          />
          <div className="user-info">
            <p className="username">{username}</p>
          </div>
        </div>

      </div>

      {/* sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">E-Learning</h2>
        <ul className="sidebar-menu">
          <li onClick={() => navigate("/chapters")}>📖 Capitole</li>
          <li onClick={() => navigate("/notebook")}>📓 Notițe</li>
          <li onClick={() => navigate("/dictionary")}>📘 Dicționar</li> {/* înlocuiește Exersare */}
          <li onClick={() => navigate("/ai")} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <img src="/images/bot.png" alt="AI" style={{ width: "33px", height: "30px", marginLeft: "-7px" }} />
            AI
          </li>
          <li onClick={() => navigate("/profil")}>⚙️ Profil</li>
        </ul>

      </aside>



      {/* page content */}
      <main className="page-content-dashboard">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
