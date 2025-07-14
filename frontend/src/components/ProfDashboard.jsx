import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ProfDashboard.css";

const ProfDashboard = () => {
  const [userTests, setUserTests] = useState({});
  const [grades, setGrades] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrades();
    fetchUserTests();
  }, []);

  const fetchUserTests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/uploads-all");
      setUserTests(res.data); // format: { username1: [test1.pdf, test2.pdf], username2: [...] }
    } catch (err) {
      console.error("❌ Eroare la fetch uploads-all:", err);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/grades");
      const formatted = {};
      res.data.forEach(({ username, test_filename, grade }) => {
        if (!formatted[username]) formatted[username] = {};
        formatted[username][test_filename] = grade;
      });
      setGrades(formatted);
    } catch (err) {
      console.error("❌ Eroare la fetch grades:", err);
    }
  };

  const handleGradeChange = (username, testFilename, grade) => {
    setGrades((prev) => ({
      ...prev,
      [username]: {
        ...prev[username],
        [testFilename]: grade,
      },
    }));
  };

  const saveGrade = async (username, testFilename) => {
    const grade = grades[username]?.[testFilename];
    try {
      await axios.post("http://localhost:5000/api/save-grade", {
        username,
        testFilename,
        grade,
      });
      alert("✅ Notă salvată cu succes!");
    } catch (err) {
      console.error("❌ Eroare la salvare notă:", err);
      alert("❌ Eroare la salvarea notei.");
    }
  };

  return (
    <div className="prof-dashboard">
      <h2>📊 Panou profesor: Teste utilizatori</h2>
      {Object.keys(userTests).length === 0 ? (
        <p>Nu există teste încărcate.</p>
      ) : (
        Object.entries(userTests).map(([user, files]) => (
          <div className="user-card" key={user}>
            <h3>{user}</h3>
            {files.map((file) => (
              <div className="test-row" key={file}>
                <a
                  href={`http://localhost:5000/uploads/resolved/${file}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  📄 {file}
                </a>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={grades[user]?.[file] || ""}
                  onChange={(e) => handleGradeChange(user, file, e.target.value)}
                  placeholder="Notă"
                />
                <button onClick={() => saveGrade(user, file)}>💾 Salvează</button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default ProfDashboard;
