import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./Profil.css";

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
          }
        })
        .catch((err) => console.log("Eroare la profil:", err));

      // Avatar
      const imageUrl = `http://localhost:5000/avatars/${user}.jpg`;
      fetch(imageUrl)
        .then((res) => {
          if (res.ok) setSelectedImage(imageUrl);
          else setSelectedImage("/images/default-avatar.jpg");
        })
        .catch(() => setSelectedImage("/images/default-avatar.jpg"));

      // XP & Coins
      axios
        .get(`http://localhost:5000/api/user-stats/${user}`)
        .then((res) => {
          if (res.data.success) {
            setXp(res.data.xp);
            setCoins(res.data.coins);
          }
        })
        .catch((err) => console.log("Eroare la fetch XP/coins:", err));
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

  const goToEdit = () => {
    navigate("/editare-profil");
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
          <li onClick={() => navigate("/clasament")}>🏆 CLASAMENTE</li>
          <li onClick={() => navigate("/magazin")}>🛍 MAGAZIN</li>
          <li onClick={() => navigate("/profil")}>⚙️ PROFIL</li>
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
          <p><strong>Level:</strong> {level}</p>

          <p><strong>XP:</strong> {xp}</p>
          <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
            <img
              src="/images/coin.png"
              alt="coin"
              style={{ width: "18px", height: "18px" }}
            />
            {coins}
          </p></div>
          <div class="buttons-reset-edit">
          <button onClick={handleResetProgress} className="reset-button">
             Resetează progresul
          </button>

          <button onClick={goToEdit} className="edit-button">
            ✏️ Editează profil
          </button>
</div>
        </div>
      </div>
    </div>
  );
};

export default Profil;
