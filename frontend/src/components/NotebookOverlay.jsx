import React, { useEffect, useState } from "react";
import axios from "axios";
import "./NotebookOverlay.css";

const NotebookOverlay = ({ onClose }) => {
  const [notes, setNotes] = useState("");
  const username = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).username;

  useEffect(() => {
    axios.get(`http://localhost:5000/api/notes/${username}`)
      .then(res => setNotes(res.data.notes || ""))

      .catch(err => console.error("Error loading notes:", err));
  }, [username]);

  useEffect(() => {
    const save = setTimeout(() => {
      axios.post("http://localhost:5000/api/notes/save", { username, content: notes });

    }, 1000);
    return () => clearTimeout(save);
  }, [notes]);

  return (
    <div className="notebook-overlay">
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button onClick={onClose}>Închide</button>
    </div>
  );
};

export default NotebookOverlay;
