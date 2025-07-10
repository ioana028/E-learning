import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Teorie.css";
import { jwtDecode } from "jwt-decode";
import FloatingMenuComponent from "./FloatingMenuComponent";
import NotebookOverlay from "./NotebookOverlay";
import DictionaryOverlay from "./DictionaryOverlay";
import ChatBotOverlay from "./ChatBotOverlay";
import ChatBot from "./ChatBot";



const Teorie = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("/images/default-avatar.jpg");
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
   const [showNotebook, setShowNotebook] = useState(false);
const [showDictionary, setShowDictionary] = useState(false);
const [showChat, setShowChat] = useState(false);
const [showChatBot, setShowChatBot] = useState(false);


  
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
    processTeorie(fullText);
  } catch (error) {
    console.warn("❌ Teoria specifică nu a fost găsită, se folosește fallback...");

    try {
      // înlocuiește cu un ID real sau endpoint pentru fallback
      const fallbackResponse = await axios.get(`http://localhost:5000/teorie/default`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fallbackText = fallbackResponse.data.teorie;
      processTeorie(fallbackText);
    } catch (fallbackError) {
      console.error("❌ Eroare și la fallback:", fallbackError);
      setPages([["❌ Teoria nu a fost găsită și nici fallback-ul nu a putut fi încărcat.", ""]]);
    }
  }
};


    fetchTeorie();
  }, [lessonId]);

  const processTeorie = (text) => {
  const rawPages = text.split(/\n\s*\n/);
  const doublePages = [];

  for (let i = 0; i < rawPages.length; i += 2) {
    doublePages.push([rawPages[i] || "", rawPages[i + 1] || ""]);
  }

  setPages(doublePages);
};


  const next = () => {
    if (pageIndex < pages.length - 1) setPageIndex(pageIndex + 1);
  };

  const prev = () => {
    if (pageIndex > 0) setPageIndex(pageIndex - 1);
  };

  const isLastPage = pageIndex === pages.length - 1;

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
          <li onClick={() => navigate("/profil")}>⚙️ PROFIL</li>

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
  <div className="book-text">
    {pages[pageIndex]?.[0]}
  </div>
  {pageIndex > 0 && (
    <button className="nav-arrow left-arrow" onClick={prev}>
      ◀
    </button>
  )}
</div>

<div className="book-page right">
  <div className="book-text">
    {pages[pageIndex]?.[1]}
  </div>
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

   <FloatingMenuComponent
  onOpenNotebook={() => setShowNotebook(true)}
  onOpenDictionary={() => setShowDictionary(true)} // adaugă și asta dacă nu ai
  onOpenChatBot={() => setShowChatBot(true)} 
/>

{showNotebook && (
  <NotebookOverlay onClose={() => setShowNotebook(false)} />
)}

{showDictionary && (
  <DictionaryOverlay onClose={() => setShowDictionary(false)} />
)}

 {showChatBot && <ChatBotOverlay onClose={() => setShowChatBot(false)} />}

 
    
</div>

    </div>
    </div>
  );
  
};


export default Teorie;
