import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Chapters.css"; // Import stilul separat
import { jwtDecode } from "jwt-decode";
import { askAI } from "./ChatBot";




//import { DotLottieReact } from '@lottiefiles/dotlottie-react';
const chapterImages = {
  1: "/images/snoopy1.png",
  2: "/images/snoopy2.png",
  3: "/images/snoopy3.png",
  4: "/images/snoopy4.png",
  5: "/images/snoopy1.png",
  6: "/images/snoopy3.png",
  7: "/images/snoopy2.png",
};


const Chapters = () => {

  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const token = localStorage.getItem("token");
  const [avatarUrl, setAvatarUrl] = useState("/images/default-avatar.jpg");
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [aiReply, setAiReply] = useState("");
  const askTapped = async () => {
    const resp = await askAI("Explică diferența dintre ...");
    setAiReply(resp);
  };


  let username = "Utilizator";

  if (token) {
    const decoded = jwtDecode(token);
    username = decoded.username;
  }

  // Fetch chapters from backend
  useEffect(() => {
    const fetchChapters = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        return;
      }
      console.log("Token found Sending request to: http://localhost:5000/chapters");
      try {
        const response = await axios.get(`http://localhost:5000/chapters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Response received:", response.data);
        if (response.data.success) {
          setChapters(response.data.chapters);
          console.log("Capitole primite:", response.data.chapters);

        }
      } catch (error) {
        console.error("Error fetching chapters:", error);

      }
    };

    fetchChapters();
  }, [navigate]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const user = decoded.username;

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
    <><div className="top-bar">
      <div className="xp-coins-box">
        <p><strong>XP:</strong> {xp}</p>
        <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
          <img
            src="/images/coin.png"
            alt="coin"
            style={{ width: "18px", height: "18px" }}
          />:
          {" " + coins}
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




      <div className="chapters-container">
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
            <li onClick={() => navigate("/profil")}>⚙️ PROFIL</li>

          </ul>
        </aside>

        <main className="chapters-content">
          <div className="back-bar" onClick={() => navigate(-1)}>
            <span className="back-arrow">←</span>
            <span className="back-text">Înapoi</span>
          </div>


          <div className="chapters-list">
            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`chapter-item ${chapter.completed ? "completed tall" : ""}`}
                >
                  <div className="chapter-left">
                    <h2>{chapter.title}</h2>

                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(chapter.completedLessons / chapter.totalLessons) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {chapter.completedLessons} / {chapter.totalLessons} lecții
                      </span>
                    </div>

                    <button
                      className={`start-button ${chapter.completed ? "replay" : ""}`}
                      onClick={() => navigate(`/lectii/${chapter.id}`)}
                    >
                      {chapter.completed ? "Repetă capitolul" : "Continuă"}
                    </button>
                  </div>

                  <div className="chapter-right">
                    <div className="speech-bubble">
                      <p>{chapter.description}</p>
                    </div>
                    {chapterImages[chapter.id] && (
                      <img
                        src={chapterImages[chapter.id]}
                        alt="animal mascot"
                        className="chapter-image"
                      />
                    )}
                  </div>
                </div>

              ))


            ) : (
              <p>Se încarcă capitolele...</p>
            )}
          </div>
        </main>
      </div>
    </>
  );
};


export default Chapters;
