import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import "./Lectii.css"; // Importă stilurile externe
import { jwtDecode } from "jwt-decode";

const Lectii = () => {

  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const token = localStorage.getItem("token");
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);

  let username = "Utilizator";
   const [avatarUrl, setAvatarUrl] = useState("/images/default-avatar.jpg");


  if (token) {
    const decoded = jwtDecode(token);
    username = decoded.username;
  }


  const { chapterId } = useParams(); // Get chapterId from URL
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null; // No token means no authenticated user

    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
      return payload.userId; // Extract userId
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Fetch lessons from backend
  useEffect(() => {
    const fetchLessons = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token found, redirecting...");
        return;
      }

      const userId = getUserIdFromToken();
      if (!userId) {
        // Redirect if the token is invalid
        console.log("❌ Invalid token, redirecting...");
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/lectii/${chapterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Response from backend:", response.data); // ✅ Check received data
        if (response.data.success) {
          setLessons(response.data.lessons);
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    };

    fetchLessons();
  }, [chapterId, navigate]);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    const user = decoded.username;

    // Avatar
    const url = `http://localhost:5000/avatars/${user}.jpg`;
    fetch(url)
      .then((res) => res.ok && setAvatarUrl(url))
      .catch(() => {});

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

    <div className="dashboard-container">

<div className="xp-coins-box-exercitii">
    <p><strong>XP:</strong> {xp}</p>
    <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
  <img
    src="/images/coin.png"
    alt="coin"
    style={{ width: "18px", height: "18px" }}
  />: 
  { " "+coins}
</p>


  </div>
      <aside className="sidebar">
        <h2 className="sidebar-title">E-Learning</h2>
        <ul className="sidebar-menu">
          <li onClick={() => navigate("/chapters")}>📖 Capitole</li>
<li onClick={() => navigate("/notebook")}>📓 Notițe</li>
         <li onClick={() => navigate("/dictionary")}>📘 Dicționar</li>
  <li onClick={() => navigate("/ai")} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <img src="/images/bot.png" alt="AI" style={{ width: "33px", height: "30px", marginLeft: "-7px" }} />
              AI
            </li>
          <li>🏆 Clasament</li>
          <li>🛍 Magazin</li>
          <li onClick={() => navigate("/profil")}>⚙️ PROFIL</li>

        </ul>
      </aside>


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

      <main className="dashboard-content">
        <div className="back-bar" onClick={() => navigate(-1)}>
            <span className="back-arrow">←</span>
            <span className="back-text">Înapoi</span>
          </div>
        <div>
          

        
        <div className="progress-container">

          <h1 className="progress-title">Progresul Tău</h1>
          <div className="lesson-list">
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => (
                <div key={lesson.id} className="lesson-wrapper">
                  {index !== 0 && <div className="lesson-connector"></div>}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`lesson-item ${lesson.completed ? "" : "not-completed"}`}
                    onClick={() =>
                      setSelectedLesson(selectedLesson === lesson.id ? null : lesson.id)
                    }
                  >
                    {lesson.completed ? "✔" : "📖"}
                  </motion.button>
                  <p className="lesson-title">{lesson.title}</p>

                  {/* Popover-ul care apare la click */}
                  {selectedLesson === lesson.id && (
                    <motion.div
                      className="lesson-popover"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <h3>{lesson.title}</h3>
                      <p>{`Lecția ${lesson.id} din ${lessons.length}`}</p>
                      <button
                        className="start-button"
                        onClick={() => navigate(`/teorie/${lesson.id}`)}
                      >
                        ÎNCEPE +10XP
                      </button>


                    </motion.div>
                  )}
                </div>
              ))
            ) : (
              <p>Se încarcă lecțiile...</p>
            )}
          </div>
        </div></div>
      </main>
    </div>
  );
};

export default Lectii;