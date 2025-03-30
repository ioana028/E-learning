import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import "./Lectii.css"; // Importă stilurile externe

const Lectii = () => {
  const { chapterId } = useParams(); // Get chapterId from URL
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null; // No token means no authenticated user

    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
      return payload.userId; // Extract userId
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Fetch lessons from backend
  useEffect(() => {
    const fetchLessons = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token found, redirecting...");
        return;
      }

      const userId = getUserIdFromToken();
      if (!userId) {
        // Redirect if the token is invalid
        console.log("❌ Invalid token, redirecting...");
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/lectii/${chapterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Response from backend:", response.data); // ✅ Check received data
        if (response.data.success) {
          setLessons(response.data.lessons);
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    };

    fetchLessons();
  }, [chapterId, navigate]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="sidebar-title">E-Learning</h2>
        <ul className="sidebar-menu">
          <li>📚 Lecții</li>
          <li>🎯 Exersare</li>
          <li>🏆 Clasament</li>
          <li>🛍 Magazin</li>
          <li>⚙️ Setări</li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="progress-container">
          <h1 className="progress-title">Progresul Tău</h1>
          <div className="lesson-list">
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => (
                <div key={lesson.id} className="lesson-wrapper">
                  {index !== 0 && <div className="lesson-connector"></div>}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`lesson-item ${lesson.completed ? "" : "not-completed"}`}
                    onClick={() =>
                      setSelectedLesson(selectedLesson === lesson.id ? null : lesson.id)
                    }
                  >
                    {lesson.completed ? "✔" : "📖"}
                  </motion.button>
                  <p className="lesson-title">{lesson.title}</p>

                  {/* Popover-ul care apare la click */}
                  {selectedLesson === lesson.id && (
                    <motion.div
                      className="lesson-popover"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <h3>{lesson.title}</h3>
                      <p>{`Lecția ${lesson.id} din ${lessons.length}`}</p>
                      <button
                        className="start-button"
                        onClick={() => navigate(`/exercitii/${lesson.id}`)}
                      >
                        ÎNCEPE +10XP
                      </button>

                    </motion.div>
                  )}
                </div>
              ))
            ) : (
              <p>Se încarcă lecțiile...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Lectii;