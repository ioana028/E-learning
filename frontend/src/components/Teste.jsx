import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "./Teste.css";
import DashboardLayout from "./DashboardLayout";

const Teste = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [uploaded, setUploaded] = useState({});
  const [username, setUsername] = useState("");
  const [recommendedLevel, setRecommendedLevel] = useState(null);
  const [filteredLevel, setFilteredLevel] = useState("");
  const [uploading, setUploading] = useState(null);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setUsername(decoded.username);
      fetchTests(decoded.username);
    }
  }, []);

  const fetchTests = async (currentUser) => {
    try {
      const res = await axios.get("http://localhost:5000/api/tests");
      setTests(res.data);

      const uploadRes = await axios.get(`http://localhost:5000/api/uploads/${currentUser}`);
      setUploaded(uploadRes.data);

      const gradeRes = await axios.get("http://localhost:5000/api/grades");
      const gradesMap = {};

      gradeRes.data.forEach(({ username: u, test_filename, grade }) => {
        if (u === currentUser) {
          gradesMap[test_filename] = grade; // păstrează cheia exactă
        }
      });

      setGrades(gradesMap);
    } catch (err) {
      console.error("Eroare la fetch testele:", err);
    }
  };

  const handleUpload = async (event, testName) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);
    setUploading(testName);

    try {
      await axios.post(
        `http://localhost:5000/api/upload-resolved/${username}/${testName}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("✅ Rezolvare încărcată cu succes!");
      fetchTests(username);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("❌ Eroare la upload.");
    } finally {
      setUploading(null);
    }
  };

  const fetchRecommendedLevel = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/recommend-level", { username });
      if (res.data.level) {
        setRecommendedLevel(res.data.level);
        setFilteredLevel(res.data.level);
      }
    } catch (err) {
      console.error("❌ Eroare recomandare nivel:", err);
    }
  };

  const filteredTests = filteredLevel
    ? tests.filter((test) => test.name.toUpperCase().includes(filteredLevel.toUpperCase()))
    : tests;

  return (
    <DashboardLayout>
      <div className="dashboard-container">
        <div className="profil-page-teste">
          <h2>Teste disponibile</h2>

          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <button onClick={fetchRecommendedLevel} className="recommend-btn">
              📈 Estimează nivelul
            </button>
            {recommendedLevel && (
              <span style={{ fontWeight: "bold" }}>
                Nivel recomandat: {recommendedLevel}
              </span>
            )}
            <select
              value={filteredLevel}
              onChange={(e) => setFilteredLevel(e.target.value)}
            >
              <option value="">Toate nivelurile</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>

          <div className="test-list">
            {filteredTests.map((test, index) => {
              // Caută cheia care se termină cu numele fișierului testului
              const testKey = Object.keys(grades).find((key) =>
                key.endsWith(test.filename)
              );

              return (
                <div className="test-item" key={index}>
                  <div className="test-left">
                    <p>
                      <strong>{test.name}</strong>
                    </p>
                    <a href={`http://localhost:5000/tests/${test.filename}`} download>
                      📄 Descarcă testul
                    </a>
                  </div>
                  <div className="test-right">
                    {uploaded[test.filename] ? (
                      testKey && grades[testKey] ? (
                        <span className="uploaded-tag">
                          📘 Notă: {grades[testKey]}
                        </span>
                      ) : (
                        <span className="uploaded-tag">✅ Completat</span>
                      )
                    ) : uploading === test.filename ? (
                      <div className="loading-spinner" />
                    ) : (
                      <label className="upload-btn">
                        🡅 Încarcă rezolvarea
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handleUpload(e, test.filename)}
                          style={{ display: "none" }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Teste;
