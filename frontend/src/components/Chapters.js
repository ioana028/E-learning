import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Chapters.css"; // Import stilul separat


const Chapters = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);

  // Fetch chapters from backend
  useEffect(() => {
    const fetchChapters = async () => {
      const token=localStorage.getItem("token");
      if(!token){
        console.log("No token found");
        return;
      }
      console.log("Token found Sending request to: http://localhost:5000/chapters");
      try {
        const response = await axios.get(`http://localhost:5000/chapters`,{
          headers:{Authorization:`Bearer ${token}`}
        });
        console.log("Response received:", response.data);
        if (response.data.success) {
          setChapters(response.data.chapters);
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
        
      }
    };

    fetchChapters();
  }, [navigate]);

  return (
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
        <h1 className="chapters-title">Capitole</h1>
        <div className="chapters-list">
          {chapters.length > 0 ? (
            chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`chapter-item ${chapter.completed ? "completed" : ""}`}
                onClick={() => navigate(`/lectii/${chapter.id}`)}
              >
                <div className="chapter-info">
                  <h2>{chapter.title}</h2>
                  {chapter.completed ? (
                    <span className="status completed">✔ FINALIZAT!</span>
                  ) : (
                    <span className="status pending">⏳ În curs...</span>
                  )}
                </div>
                <button className="start-button" onClick={()=>navigate(`/lectii/${chapter.id}`)}>Continuă</button>
              </div>
            ))
          ) : (
            <p>Se încarcă capitolele...</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chapters;
