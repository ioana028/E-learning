import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Exercitii = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0); // Urmărim câte răspunsuri sunt corecte

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/exercitii/${lessonId}`);
        if (response.data.success) {
          setExercises(response.data.exercises.rows);
        }
      } catch (error) {
        console.error("Eroare la preluarea exercițiilor:", error);
      }
    };

    fetchExercises();
  }, [lessonId]);

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsChecked(false);
      setIsCorrect(null);
    }
  };

  const handleSelectOption = (option) => {
    setSelectedOption(option);
  };

  const handleCheckAnswer = (correctAnswer) => {
    if (selectedOption) {
      setIsChecked(true);
      if (selectedOption === correctAnswer) {
        setIsCorrect(true);
        setCorrectAnswers(correctAnswers + 1); // Incrementăm răspunsurile corecte
      } else {
        setIsCorrect(false);
      }
    }
  };

  const handleFinish = () => {
    const totalQuestions = exercises.length;
    const passingMark = totalQuestions / 2;

    if (correctAnswers > passingMark) {
      alert("Felicitări! Ai trecut!");
    } else {
      alert("Ai nevoie de mai multă practică. Încearcă din nou!");
    }
    // Redirect to lessons page
    navigate(`/lectii/${lessonId}`);
  };

  const renderExercise = (exercise) => {
    const [type, lessonId, question, options, answer] = exercise;

    switch (type) {
      case 1:
        return (
          <div>
            <h3>{question}</h3>
            <ul>
              {options.split(",").map((opt, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: selectedOption === opt ? "#d4edda" : "",
                    border: selectedOption === opt ? "2px solid #28a745" : "1px solid #ccc",
                    padding: "10px",
                    margin: "5px 0",
                    borderRadius: "8px",
                  }}
                >
                  {opt}
                </li>
              ))}
            </ul>
            <button onClick={() => handleCheckAnswer(answer)} disabled={selectedOption === null}>
              Verifică răspunsul
            </button>
            {isChecked && (
              <div style={{ marginTop: "10px", color: isCorrect ? "green" : "red" }}>
                {isCorrect ? "✔ Răspuns corect!" : "❌ Răspuns greșit!"}
              </div>
            )}
            {isChecked && currentIndex === exercises.length - 1 && (
              <button onClick={handleFinish} style={{ marginTop: "10px" }}>
                Încheie și vezi rezultatele
              </button>
            )}
            {isChecked && currentIndex < exercises.length - 1 && (
              <button onClick={handleNext} style={{ marginTop: "10px" }}>
                Next
              </button>
            )}
          </div>
        );
      default:
        return <p>Tip necunoscut de exercițiu.</p>;
    }
  };

  if (exercises.length === 0) return <p>Se încarcă exercițiile...</p>;

  return (
    <div className="exercise-page">
      <h2>Exercițiu {currentIndex + 1} din {exercises.length}</h2>
      {renderExercise(exercises[currentIndex])}
    </div>
  );
};

export default Exercitii;
