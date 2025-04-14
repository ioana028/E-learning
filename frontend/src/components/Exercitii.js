import React, { useEffect, useState, useMemo } from "react";
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
  const [showResult, setShowResult] = useState(false);
  const [userSentence, setUserSentence] = useState([]);
  const [feedbackShown, setFeedbackShown] = useState(false);

  const [matchedPairs, setMatchedPairs] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);

  const [userMatches, setUserMatches] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [rightWords, setRightWords] = useState([]);

  const leftRefs = useMemo(() => ({}), []);
const rightRefs = useMemo(() => ({}), []);

  

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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

  useEffect(() => {
    const currentExercise = exercises[currentIndex];
    if (currentExercise && currentExercise[0] === 3) {
      const pairs = currentExercise[3].split(",").map(pair => pair.split(":"));
      const shuffled = shuffleArray(pairs.map(p => p[1]));
      setRightWords(shuffled);
      setUserMatches([]);
      setMatchResults([]);
      setSelectedLeft(null);
      setIsChecked(false);
    }
  }, [currentIndex, exercises]);

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      const currentExercise = exercises[currentIndex];
      const pairs = currentExercise[3].split(",").map(pair => {
        const [left, right] = pair.split(":");
        return { left, right };
      });
      const correct = pairs.find(p => p.left === selectedLeft && p.right === selectedRight);
      if (correct) {
        setMatchedPairs([...matchedPairs, correct]);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }, [selectedLeft, selectedRight]);

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsChecked(false);
      setIsCorrect(null);
      setUserSentence([]);
      setFeedbackShown(false);
      setUserMatches([]);
      setMatchResults([]);
      setSelectedLeft(null);
      setUserSentence([]);
      setFeedbackShown(false);
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
    setShowResult(true);
  };

  const handleRedirect = () => {
    navigate(`/lectii/${lessonId}`);
  };

  // 👇 Cuvinte amestecate o singură dată per exercițiu de tip 2
  const shuffledWords = useMemo(() => {
    if (exercises.length === 0) return [];
    const currentExercise = exercises[currentIndex];
    const [type, , , options] = currentExercise;
    if (type !== 2) return [];
    return shuffleArray(options.split(","));
  }, [exercises, currentIndex]);

  const renderExercise = (exercise) => {
    const [type, , question, options, answer] = exercise;

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

      case 2:
        const words = shuffledWords;

        const handleWordClick = (word) => {
          setUserSentence([...userSentence, word]);
        };

        const handleCheckSentence = () => {
          const userAnswer = userSentence.join(" ");
          setIsChecked(true);
          const isCorrectAnswer = userAnswer.trim().toLowerCase() === answer.trim().toLowerCase();
          setIsCorrect(isCorrectAnswer);
          if (isCorrectAnswer) {
            setCorrectAnswers(correctAnswers + 1);
          }
          setFeedbackShown(true);
        };

        const handleResetSentence = () => {
          setUserSentence([]);
          setIsChecked(false);
          setIsCorrect(null);
          setFeedbackShown(false);
        };

        const speakText = (text) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "en-US";
          speechSynthesis.speak(utterance);
        };

        const handleRemoveWord = (indexToRemove) => {
          setUserSentence(userSentence.filter((_, i) => i !== indexToRemove));
        };



        return (
          <div>
            <h3>Tradu propoziția:</h3>
            <button
              onClick={() => speakText(question)}
              style={{ marginBottom: "10px", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
            >
              🔊 Ascultă propoziția
            </button>
            <div style={{ fontStyle: "italic", marginBottom: "10px" }}>{question}</div>

            <div
              style={{
                minHeight: "60px",
                border: "2px dashed #999",
                padding: "12px",
                marginBottom: "16px",
                borderRadius: "12px",
                fontSize: "18px",
                backgroundColor: "#f9f9f9"
              }}
            >
              {userSentence.length === 0
                ? <span style={{ color: "#aaa" }}>Click pe cuvinte pentru a forma propoziția...</span>
                : userSentence.map((word, index) => (
                  <span
                    key={index}
                    onClick={() => handleRemoveWord(index)}
                    style={{
                      marginRight: "8px",
                      padding: "4px 8px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                    title="Click pentru a șterge"
                  >
                    {word}
                  </span>
                ))

              }
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: "16px" }}>
              {words.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => handleWordClick(word)}
                  style={{
                    margin: "6px",
                    padding: "10px 14px",
                    borderRadius: "20px",
                    border: "1px solid #007bff",
                    backgroundColor: "#e6f0ff",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                >
                  {word}
                </button>
              ))}
            </div>

            {!isChecked && (
              <button onClick={handleCheckSentence} disabled={userSentence.length === 0}>
                Verifică traducerea
              </button>
            )}

            {feedbackShown && (
              <>
                <div style={{ marginTop: "14px", color: isCorrect ? "green" : "red" }}>
                  {isCorrect ? "✔ Traducere corectă!" : `❌ Traducere greșită! Răspunsul corect era: ${answer}`}
                </div>

                <div style={{ marginTop: "10px" }}>
                  <button onClick={handleResetSentence} style={{ marginRight: "10px" }}>
                    Încearcă din nou
                  </button>

                  {currentIndex < exercises.length - 1 && (
                    <button onClick={handleNext}>Următorul</button>
                  )}

                  {currentIndex === exercises.length - 1 && (
                    <button onClick={handleFinish}>Încheie și vezi rezultatele</button>
                  )}
                </div>
              </>
            )}
          </div>
        );
        case 3:
  const pairs = options.split(",").map(pair => {
    const [left, right] = pair.split(":");
    return { left, right };
  });
  const leftWords = pairs.map(p => p.left);

  


  const handleSelect = (side, word) => {
    if (side === "left") {
      setSelectedLeft(word);
    } else if (selectedLeft) {
      const alreadyMatched = userMatches.some(match => match.left === selectedLeft);
      if (!alreadyMatched) {
        setUserMatches([...userMatches, { left: selectedLeft, right: word }]);
        setSelectedLeft(null);
      }
    }
  };

  const handleVerify = () => {
    const results = userMatches.map(pair => {
      const found = pairs.find(p => p.left === pair.left && p.right === pair.right);
      return { ...pair, correct: !!found };
    });
    setMatchResults(results);
    const correctCount = results.filter(r => r.correct).length;
    if (correctCount === pairs.length) {
      setCorrectAnswers(correctAnswers + 1);
    }
    setIsChecked(true);
  };

  const getResultFor = (left, right) => {
    const result = matchResults.find(r => r.left === left && r.right === right);
    return result ? result.correct : null;
  };

  const handleResetMatches = () => {
    setUserMatches([]);
    setMatchResults([]);
    setSelectedLeft(null);
    setIsChecked(false);
  };

  const drawLines = () => {
    return userMatches.map((match, index) => {
      const leftEl = leftRefs[match.left]?.current;
      const rightEl = rightRefs[match.right]?.current;

      if (!leftEl || !rightEl) return null;

      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();

      const svgRect = document.getElementById("match-svg").getBoundingClientRect();

      const x1 = leftRect.right - svgRect.left;
      const y1 = leftRect.top + leftRect.height / 2 - svgRect.top;
      const x2 = rightRect.left - svgRect.left;
      const y2 = rightRect.top + rightRect.height / 2 - svgRect.top;

      const color = getResultFor(match.left, match.right) === false ? "red" : "green";

      return (
        <line
          key={index}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="2"
        />
      );
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <h3>{question}</h3>

      <div style={{ display: "flex", gap: "40px", position: "relative" }}>
        <div>
          <h4>Engleză</h4>
          {leftWords.map((word, idx) => {
            if (!leftRefs[word]) leftRefs[word] = React.createRef();
            return (
              <div
                ref={leftRefs[word]}
                key={idx}
                onClick={() => handleSelect("left", word)}
                style={{
                  padding: "10px",
                  margin: "5px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: selectedLeft === word ? "#d1ecf1" : "#fff",
                  cursor: "pointer"
                }}
              >
                {word}
              </div>
            );
          })}
        </div>

        <svg
          id="match-svg"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0
          }}
        >
          {drawLines()}
        </svg>

        <div>
          <h4>Română</h4>
          {rightWords.map((word, idx) => {
            if (!rightRefs[word]) rightRefs[word] = React.createRef();
            const match = userMatches.find(m => m.right === word);
            const leftWord = match ? match.left : null;
            const result = getResultFor(leftWord, word);

            return (
              <div
                ref={rightRefs[word]}
                key={idx}
                onClick={() => handleSelect("right", word)}
                style={{
                  padding: "10px",
                  margin: "5px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: result === true ? "#d4edda" : result === false ? "#f8d7da" : "#fff",
                  cursor: "pointer"
                }}
              >
                {word}
              </div>
            );
          })}
        </div>
      </div>

      {!isChecked && (
        <button onClick={handleVerify} disabled={userMatches.length < pairs.length} style={{ marginTop: "20px" }}>
          Verifică răspunsurile
        </button>
      )}
      {isChecked && (
        <>
          <div style={{ marginTop: "10px", color: matchResults.every(r => r.correct) ? "green" : "red" }}>
            {matchResults.every(r => r.correct)
              ? "✔ Ai potrivit toate cuvintele corect!"
              : "❌ Unele potriviri sunt greșite."}
          </div>
          <button onClick={handleResetMatches} style={{ marginTop: "10px" }}>Încearcă din nou</button>
          {currentIndex < exercises.length - 1 && (
            <button onClick={handleNext} style={{ marginLeft: "10px" }}>Următorul</button>
          )}
          {currentIndex === exercises.length - 1 && (
            <button onClick={handleFinish} style={{ marginLeft: "10px" }}>Final</button>
          )}
        </>
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
      {!showResult && (
        <>
          <h2>Exercițiu {currentIndex + 1} din {exercises.length}</h2>
          {renderExercise(exercises[currentIndex])}
        </>
      )}

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
            </>
          ) : (
            <>
              <h3>Nu ai trecut examenul. Mai încearcă! 😞</h3>
              <p>Ai răspuns corect la {correctAnswers} din {exercises.length} exerciții.</p>
            </>
          )}
          <button onClick={handleRedirect} style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#28a745", color: "white", borderRadius: "5px" }}>
            Mergi la lecții
          </button>
        </div>
      )}
    </div>
  );
};

export default Exercitii;
