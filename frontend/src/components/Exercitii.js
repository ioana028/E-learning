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
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false); // State pentru a arăta rezultatul final

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
        setCorrectAnswers(correctAnswers + 1);
      } else {
        setIsCorrect(false);
      }
    }
  };

  const handleFinish = () => {
    const totalQuestions = exercises.length;
    const passingMark = totalQuestions / 2;

    if (correctAnswers > passingMark) {
      setShowResult(true);
    } else {
      setShowResult(true);
    }
  };

  const handleRedirect = () => {
    navigate(`/lectii/${lessonId}`); // Redirecționăm utilizatorul către lecții
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
      {/* Afișăm doar exercițiile până la final */}
      {!showResult && (
        <>
          <h2>Exercițiu {currentIndex + 1} din {exercises.length}</h2>
          {renderExercise(exercises[currentIndex])}
        </>
      )}

      {/* Afișăm doar mesajul de felicitare sau încercare după finalizarea exercițiilor */}
      {showResult && (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            marginTop: "20px",
            borderRadius: "8px",
            backgroundColor: correctAnswers > exercises.length / 2 ? "#d4edda" : "#f8d7da",
            color: correctAnswers > exercises.length / 2 ? "#155724" : "#721c24",
          }}
        >
          {correctAnswers > exercises.length / 2 ? (
            <>
              <h3>Felicitări! Ai trecut examenul! 🎉</h3>
              <p>Ai răspuns corect la {correctAnswers} din {exercises.length} exerciții.</p>
              <span role="img" aria-label="green-check">✅</span>
            </>
          ) : (
            <>
              <h3>Nu ai trecut examenul. Mai încearcă! 😞</h3>
              <p>Ai răspuns corect la {correctAnswers} din {exercises.length} exerciții.</p>
              <span role="img" aria-label="red-cross">❌</span>
            </>
          )}

          {/* Butonul pentru redirecționare */}
          <button onClick={handleRedirect} style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#28a745", color: "white", borderRadius: "5px" }}>
            Mergi la lecții
          </button>
        </div>
      )}
    </div>
  );
};

export default Exercitii;
