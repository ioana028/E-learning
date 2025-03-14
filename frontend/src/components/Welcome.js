import React from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css"; // Stiluri externe
import background from "../assets/images/background4.jpg";

//background-size: cover; style={{ backgroundImage: `url(${background})`}}

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container" >
      <div className="welcome-content">
        <h1 className="welcome-title">Bine ai venit la E-Learning!</h1>
        <p className="welcome-text">
          Îmbunătățește-ți abilitățile cu lecții interactive. Alege-ți propriul ritm și începe călătoria de învățare!
        </p>
        <img src="/images/computer2.png" alt="Learning" className="welcome-image"  />
        <div className="button-container">
          <button className="go-to-login-button" onClick={() => navigate("/login")}>Conectare</button>
          <button className="go-to-register-button" onClick={() => navigate("/register")}>Înregistrare</button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
