import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Profil.css";
import { useEffect } from "react";

const Profil = ({ username = "Utilizator", xp = 0 }) => {
  const navigate = useNavigate();

  
  const [selectedImage, setSelectedImage] = useState(`http://localhost:5000/avatars/${username}.jpg`);

  useEffect(() => {
  const imageUrl = `http://localhost:5000/avatars/${username}.jpg`;

  // verifică dacă imaginea există
  fetch(imageUrl)
    .then((res) => {
      if (res.ok) setSelectedImage(imageUrl);
      else setSelectedImage("/images/default-avatar.jpg");
    })
    .catch(() => setSelectedImage("/images/default-avatar.jpg"));
}, [username]);

  
  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current.click(); // deschide file picker
  };
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("username", username);

  try {
    const response = await axios.post("http://localhost:5000/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const ext = file.name.split('.').pop(); // extrage extensia
    setSelectedImage(`http://localhost:5000/avatars/${username}.${ext}`);
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
          <li onClick={() => navigate("/exersare")}>🎯 EXERSARE</li>
          <li onClick={() => navigate("/clasament")}>🏆 CLASAMENTE</li>
          <li onClick={() => navigate("/magazin")}>🛍 MAGAZIN</li>
          <li onClick={() => navigate("/profil")}>⚙️ PROFIL</li>
        </ul>
      </aside>

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
          <h3>{username}</h3>
          <p>XP acumulat: {xp}</p>
        </div>
      </div>
    </div>
  );
};

export default Profil;
