import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Chapters.css"; // Import stilul separat
import {jwtDecode} from "jwt-decode";


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

  return (
<><div className="top-bar">
  <div className="user-profile">
    <img
      src="/images/default-avatar.jpg"
      alt="Profil"
      className="profile-picture"
    />
    <div className="user-info">
      <p className="username">{username}</p>
      <p className="xp">XP: 0</p>
    </div>
  </div>
</div>

    
    <div className="chapters-container">
      <aside className="sidebar">
        <h2 className="sidebar-title">E-Learning</h2>
        <ul className="sidebar-menu">
          <li>📚 ÎNVAȚĂ</li>
          <li>🎯 EXERSARE</li>
          <li>🏆 CLASAMENTE</li>
          <li>🛍 MAGAZIN</li>
          <li>⚙️ PROFIL</li>
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

                  {/* <div className={`status ${chapter.completed ? "completed" : "pending"}`}>
                    {chapter.completed ? "✔ FINALIZAT!" : "⏳ În curs..."}
                  </div> */}

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
