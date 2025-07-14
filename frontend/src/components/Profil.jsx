import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./Profil.css";

const mapEnglishToLabel = (level) => {
  if (!level || typeof level !== "string") return "usor";
  if (level.startsWith("A")) return "usor";
  if (level.startsWith("B")) return "mediu";
  if (level.startsWith("C")) return "avansat";
  return "usor";
};

const mapLevelToLabel = (level) => {
  if (!level) return "-";
  const firstChar = level.charAt(0).toUpperCase();
  if (firstChar === "A") return "Ușor";
  if (firstChar === "B") return "Mediu";
  if (firstChar === "C") return "Avansat";
  return level;
};

const mapLabelToEnglish = {
  usor: "A2",
  mediu: "B2",
  avansat: "C2"
};

const Profil = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("Utilizator");
  const [username, setUsername] = useState("Utilizator");
  const [selectedImage, setSelectedImage] = useState("/images/default-avatar.jpg");
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [email, setEmail] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [level, setLevel] = useState(1);
  const [englishLevel, setEnglishLevel] = useState("A2");
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedLevel, setRecommendedLevel] = useState(null);
  const [rawLevel, setRawLevel] = useState(null);
  const [grades, setGrades] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const user = decoded.username;
      setUsername(user);
      setName(decoded.name || user);

      axios.get(`http://localhost:5000/api/user-profile/${user}`)
        .then((res) => {
          if (res.data.success) {
            setEmail(res.data.email);
            setJoinedAt(new Date(res.data.joinedAt).toLocaleDateString());
            setLevel(res.data.level);
            setEnglishLevel(res.data.english_level || "A2");
          }
        })
        .catch((err) => console.log("Eroare la profil:", err));

      const imageUrl = `http://localhost:5000/avatars/${user}.jpg`;
      fetch(imageUrl)
        .then((res) => {
          if (res.ok) setSelectedImage(imageUrl);
          else setSelectedImage("/images/default-avatar.jpg");
        })
        .catch(() => setSelectedImage("/images/default-avatar.jpg"));

      axios
        .get(`http://localhost:5000/api/user-stats/${user}`)
        .then((res) => {
          if (res.data.success) {
            setXp(res.data.xp);
            setCoins(res.data.coins);
          }
        })
        .catch((err) => console.log("Eroare la fetch XP/coins:", err));

      axios.get("http://localhost:5000/api/grades")
        .then(res => {
          const filtered = res.data.filter(g => g.USERNAME === user);
          setGrades(filtered);
        })
        .catch(err => console.error("Eroare la preluarea notelor:", err));
    }
  }, []);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleResetProgress = async () => {
    if (window.confirm("Sigur vrei să resetezi progresul?")) {
      try {
        await axios.post("http://localhost:5000/api/reset-progress", { username });
        alert("Progresul a fost resetat!");
      } catch (err) {
        console.error("❌ Eroare la reset:", err);
        alert("A apărut o eroare.");
      }
    }
  };

  const handleChangeEnglishLevel = async (label) => {
    const newLevel = mapLabelToEnglish[label];
    try {
      await axios.post("http://localhost:5000/api/update-english-level", {
        username,
        english_level: newLevel,
      });
      setEnglishLevel(newLevel);
      setSelectedLabel(label);
    } catch (err) {
      console.error("❌ Eroare la actualizarea nivelului:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const fetchRecommendedLevel = async () => {
    setIsLoading(true);
    setRecommendedLevel(null);
    setRawLevel(null);

    try {
      const res = await axios.post("http://localhost:5000/api/recommend-level", {
        username: username,
      });

      if (res.data && res.data.level) {
        setRawLevel(res.data.level);
        setRecommendedLevel(mapLevelToLabel(res.data.level));
      } else {
        setRecommendedLevel("N/A");
      }
    } catch (err) {
      console.error("❌ Eroare recomandare:", err);
      setRecommendedLevel("Eroare");
    } finally {
      setIsLoading(false);
    }
  };
  const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await axios.post(
      `http://localhost:5000/upload-avatar?username=${username}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    const filename = response.data.filename;
    setSelectedImage(`http://localhost:5000/avatars/${filename}?t=${Date.now()}`);
  } catch (err) {
    console.error("❌ Eroare la upload:", err);
  }
};


  return (
    <div className="dashboard-container">
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
            <li onClick={() => navigate("/teste")}>📝 Teste</li>
        </ul>
      </aside>

      <div className="back-bar-profile" onClick={() => navigate(-1)}>
        <span className="back-arrow">←</span>
        <span className="back-text">Înapoi</span>
      </div>

      <div className="profil-page">
        <h2>Profilul tău</h2>
        <div className="profil-card">
          <img
            src={selectedImage}
            alt="avatar"
            className="profile-picture-large"
            onClick={handleImageClick}
            style={{ cursor: "pointer" }}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <div className="info-profil">
            <h3 className="nameprofile_in_profile_page">{name}</h3>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Membru din:</strong> {joinedAt}</p>
            <p><strong>XP:</strong> {xp}</p>
            <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              <img src="/images/coin.png" alt="coin" style={{ width: "18px", height: "18px" }} />
              {coins}
            </p>
            <div className="english-level-section">
              <p className="level-label">Alege nivelul de engleză:</p>
              <div className="switch-buttons">
                {['usor', 'mediu', 'avansat'].map(label => (
                  <button
                    key={label}
                    className={`level-btn ${selectedLabel === label ? 'active' : ''}`}
                    onClick={() => handleChangeEnglishLevel(label)}
                  >
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="recomandare-box">
              <button onClick={fetchRecommendedLevel} className="recommend-btn">
                📈 Recomandă nivel
                {isLoading && <span className="loader" />}
              </button>
              {!isLoading && recommendedLevel && (
                <div className="recommended-result">
                  Recomandat: <strong>{recommendedLevel}</strong> {rawLevel && ``}
                </div>
              )}
            </div>
          </div>

          <div className="buttons-reset-edit">
            <button onClick={handleResetProgress} className="reset-button">
              Resetează progresul
            </button>
            
            <button onClick={() => setShowCatalog(!showCatalog)} className="catalog-toggle">
              📑 Vezi catalogul
            </button>
            <button onClick={handleLogout} className="logout-button">
              🚪 Deconectare
            </button>
          </div>

          {showCatalog && grades.length > 0 && (
            <div className="catalog-section">
              <h4>🗂️ Catalogul tău:</h4>
              <ul className="catalog-list">
                {grades.map((g, i) => (
                  <li key={i}>
                    <span>{g.TEST_FILENAME.replace(`${username}_`, "")}</span> — <strong>{g.GRADE}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profil;
