import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Teorie.css";
import { jwtDecode } from "jwt-decode";


const Teorie = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);

  
    const [chapters, setChapters] = useState([]);
    const token = localStorage.getItem("token");
    let username = "Utilizator";
  
    if (token) {
      const decoded = jwtDecode(token);
      username = decoded.username;
    }

  useEffect(() => {
    const fetchTeorie = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/teorie/${lessonId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fullText = response.data.teorie;

        // Rupe teoria în "paragrafe"
        const rawPages = fullText.split(/\n\s*\n/); // separare după paragrafe goale

        // Împachetează-le câte 2
        const doublePages = [];
        for (let i = 0; i < rawPages.length; i += 2) {
          doublePages.push([rawPages[i] || "", rawPages[i + 1] || ""]);
        }

        setPages(doublePages);
      } catch (error) {
        console.error("Eroare la încărcarea teoriei:", error);
        setPages([["❌ Teoria nu a fost găsită.", ""]]);
      }
    };

    fetchTeorie();
  }, [lessonId]);

  const next = () => {
    if (pageIndex < pages.length - 1) setPageIndex(pageIndex + 1);
  };

  const prev = () => {
    if (pageIndex > 0) setPageIndex(pageIndex - 1);
  };

  const isLastPage = pageIndex === pages.length - 1;

  return (
    <div className="dashboard-container">
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
      <aside className="sidebar">
        <h2 className="sidebar-title">E-Learning</h2>
        <ul className="sidebar-menu">
           <li onClick={() => navigate("/chapters")}>📖 Capitole</li>
          <li>🎯 Exersare</li>
          <li>🏆 Clasament</li>
          <li>🛍 Magazin</li>
          <li>⚙️ Setări</li>
        </ul>
      </aside>
      
      <div className="top-bar">
  <div className="back-bar" onClick={() => navigate(-1)}>
    <span className="back-arrow">←</span>
    <span className="back-text">Înapoi</span>
  </div>
</div>
    <div className="book-container">
      
      <h2 className="teorie-title">Lecția {lessonId}</h2>

      <div className="book-pages">
  <div className="book-page left">
    {pages[pageIndex]?.[0]}
    {pageIndex > 0 && (
      <button className="nav-arrow left-arrow" onClick={prev}>
        ◀
      </button>
    )}
  </div>
  <div className="book-page right">
    {pages[pageIndex]?.[1]}
    {!isLastPage ? (
      <button className="nav-arrow right-arrow" onClick={next}>
        ▶
      </button>
    ) : (
      <button className="nav-arrow finish-arrow" onClick={() => navigate(`/exercitii/${lessonId}`)}>
        Verifica ce ai invatat 
      </button>
    )}
  </div>
</div>

    </div>
    </div>
  );
};


export default Teorie;
