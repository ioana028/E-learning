import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import DashboardLayout from "../components/DashboardLayout";
import "./Notebook.css"; // asigură-te că există fișierul pentru stil

const Notebook = () => {
  const [notes, setNotes] = useState("");
  const [username, setUsername] = useState("Utilizator");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const user = decoded.username;
      setUsername(user);

      // Încarcă notițele din backend
      axios
        .get(`http://localhost:5000/api/notes/${user}`)
        .then((res) => {
          setNotes(res.data.notes || "");
        })
        .catch((err) => {
          console.error("Eroare la încărcarea notițelor:", err);
        });
    }
  }, []);

  const handleSave = () => {
    axios
      .post("http://localhost:5000/api/notes/save", {
        username,
        content: notes,
      })
      .then(() => {
        alert("✅ Notițele au fost salvate!");
      })
      .catch((err) => {
        console.error("❌ Eroare la salvare:", err);
      });
  };

  return (
    <DashboardLayout>
      <div className="notebook-page">
        <h2>📓 Notițele tale</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scrie-ți notițele aici..."
        />
        <button onClick={handleSave}>💾 Salvează</button>
      </div>
    </DashboardLayout>
  );
};

export default Notebook;
