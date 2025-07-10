import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Exercitii.css";
import { jwtDecode } from "jwt-decode";
import FloatingMenuComponent from "./FloatingMenuComponent";
import NotebookOverlay from "./NotebookOverlay";
import DictionaryOverlay from "./DictionaryOverlay";
import ChatBotOverlay from "./ChatBotOverlay";



const Exercitii = () => {

  const navigate = useNavigate();
    const [chapters, setChapters] = useState([]);
    const token = localStorage.getItem("token");
    const [avatarUrl, setAvatarUrl] = useState("/images/default-avatar.jpg");
    let username = "Utilizator";
  
    if (token) {
      const decoded = jwtDecode(token);
      username = decoded.username;
    }

  const { lessonId } = useParams();
  

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
  const [chapterId, setChapterId] = useState(null);

  const [xpGained, setXpGained] = useState(0);
const [coinsGained, setCoinsGained] = useState(0);

const [xp, setXp] = useState(0);
const [coins, setCoins] = useState(0);

const [showNotebook, setShowNotebook] = useState(false);
const [showDictionary, setShowDictionary] = useState(false);
const [showChatBot, setShowChatBot] = useState(false);




  const leftRefs = useMemo(() => ({}), []);
  const rightRefs = useMemo(() => ({}), []);


  const [progressIndex, setProgressIndex] = useState(0);
  const advanceProgress = () => {
  setProgressIndex((prev) => Math.min(prev + 1, exercises.length));
};



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
        const response = await axios.get(`http://localhost:5000/exercitii/${lessonId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

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
    const fetchChapterId = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/lesson/${lessonId}/chapter`);
        if (res.data.success) {
          setChapterId(res.data.chapterId);
        }
      } catch (err) {
        console.error("Eroare la obținerea chapterId:", err);
      }
    };

    fetchChapterId();
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

  const logExerciseError = async (exerciseId, topic, difficulty) => {
    try {
      await axios.post("http://localhost:5000/api/log-error", {
        exerciseId,
        topic,
        difficulty
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
    } catch (error) {
      console.error("❌ Eroare la logarea greșelii:", error);
    }
  };

  const handleCheckAnswer = (correctAnswer) => {
    if (selectedOption) {
      setIsChecked(true);
      if (selectedOption === correctAnswer) {
        setIsCorrect(true);
        setCorrectAnswers(correctAnswers + 1);
      } else {
        setIsCorrect(false);

        // 👇 Logăm greșeala în DB
        const currentExercise = exercises[currentIndex];
        const exerciseId = currentExercise[7];       // LESSON_ID
        const topic = currentExercise[6];            // Topic din coloana 6
        const difficulty = currentExercise[5];       // Dificultate din coloana 5
        logExerciseError(exerciseId, topic, difficulty);
        console.log("+0", currentExercise[0], "+1", currentExercise[1], "+2", currentExercise[2], "+3", currentExercise[3], "+4", currentExercise[4]);
        console.log("+5", currentExercise[5], "+6", currentExercise[6], "+7", currentExercise[7], "+8", currentExercise[8], "+9", currentExercise[9]);
      }
    }
    advanceProgress();
  };


  const handleFinish = async () => {
    setShowResult(true);

      const xpEarned = 10;
  const coinsEarned = 5;
    const passed = correctAnswers > exercises.length / 2;
    if (!passed) return;

    try {


      await axios.post("http://localhost:5000/api/update-progress", {
        chapterId,
        lessonId: parseInt(lessonId)
      },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      await axios.post("http://localhost:5000/api/update-rewards", {
    username,
    xp: xpEarned,
    coins: coinsEarned
  }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  setXpGained(xpEarned);
  setCoinsGained(coinsEarned);
    } catch (error) {
      console.error("Eroare la salvarea progresului sau recompenselor:", error);
    }
  };

  const handleRedirect = () => {
    navigate(`/lectii/${chapterId}`);
  };

  // 👇 Cuvinte amestecate o singură dată per exercițiu de tip 2
  const shuffledWords = useMemo(() => {
    if (exercises.length === 0) return [];
    const currentExercise = exercises[currentIndex];
    const [type, , , options] = currentExercise;
    if (type !== 2) return [];
    return shuffleArray(options.split(","));
  }, [exercises, currentIndex]);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    const user = decoded.username;

    // Avatar
    const url = `http://localhost:5000/avatars/${user}.jpg`;
    fetch(url)
      .then((res) => res.ok && setAvatarUrl(url))
      .catch(() => {});

    // XP și Coins
    axios.get(`http://localhost:5000/api/user-stats/${user}`)
  .then((res) => {
    console.log("📦 Date user-stats:", res.data); // ← Asta vezi în browser
    if (res.data.success) {
      setXp(res.data.XP || res.data.xp || 0);
      setCoins(res.data.COINS || res.data.coins || 0);
    }
  })
  .catch(err => console.log("Eroare la fetch XP/coins:", err));

  }
}, []);


  const renderExercise = (exercise) => {
    const [type, , question, options, answer] = exercise;


    switch (type) {
      case 1:
        return (
          <div className="container-exercitiu">
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
          } else {
            // 🔴 Logare greșeală dacă propoziția este greșită
            const currentExercise = exercises[currentIndex];
            const exerciseId = currentExercise[7];       // LESSON_ID
            const topic = currentExercise[6];            // Topic
            const difficulty = currentExercise[5];       // Difficulty
            logExerciseError(exerciseId, topic, difficulty);
          }

          setFeedbackShown(true);
          advanceProgress();
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
          <div className="container-exercitiu">
            <h3>Tradu propoziția:</h3>
            {/* <button
              onClick={() => speakText(question)}
              style={{ marginBottom: "10px", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
            >
              🔊 Ascultă propoziția
            </button> */}
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
            const matchIndex = userMatches.findIndex(m => m.left === word);
            if (matchIndex !== -1) {
              const updated = [...userMatches];
              updated.splice(matchIndex, 1);
              setUserMatches(updated);
              setSelectedLeft(word); // selectează după ștergere
              return;
            }
            setSelectedLeft(word);
          } else if (selectedLeft) {
            const alreadyMatched = userMatches.some(match => match.left === selectedLeft);
            if (!alreadyMatched) {
              setUserMatches([...userMatches, { left: selectedLeft, right: word }]);
              setSelectedLeft(null);
            }
          } else {
            const matchIndex = userMatches.findIndex(m => m.right === word);
            if (matchIndex !== -1) {
              const pair = userMatches[matchIndex];
              const updated = [...userMatches];
              updated.splice(matchIndex, 1);
              setUserMatches(updated);
              setSelectedLeft(pair.left); // selectează cuvântul stânga după ștergere
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
          } else {
            // 🔴 Dacă nu e totul corect, trimite log
            const currentExercise = exercises[currentIndex];
            const exerciseId = currentExercise[7];
            const topic = currentExercise[6];
            const difficulty = currentExercise[5];
            logExerciseError(exerciseId, topic, difficulty);
          }

          setIsChecked(true)
          advanceProgress();;
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
          <div className="container-exercitiu" style={{ position: "relative" }}>
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
    <div className="dashboard-container">
      
      <div className="user-profile" onClick={() => navigate("/profil")} style={{ cursor: "pointer" }}>
    <img
  src={avatarUrl}
  alt="Profil"
  className="profile-picture"
/>

    <div className="user-info">
      <p className="username">{username}</p>
     
    </div>
  </div>
       <div className="xp-coins-box-exercitii">
    <p><strong>XP:</strong> {xp}</p>
    <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
  <img
    src="/images/coin.png"
    alt="coin"
    style={{ width: "18px", height: "18px" }}
  />: 
  { " "+coins}
</p>


  </div>
      <aside className="sidebar">
        <h2 className="sidebar-title">E-Learning</h2>
        <ul className="sidebar-menu">
           <li onClick={() => navigate("/chapters")}>📖 Capitole</li>
<li onClick={() => navigate("/notebook")}>📓 Notițe</li>
          <li onClick={() => navigate("/dictionary")}>📘 Dicționar</li>
  <li onClick={() => navigate("/ai")} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <img src="/images/bot.png" alt="AI" style={{ width: "33px", height: "30px", marginLeft: "-7px" }} />
              AI
            </li>
          <li onClick={() => navigate("/profil")}>⚙️ PROFIL</li>

        </ul>
      </aside>
      <div className="back-bar-exercises" onClick={() => navigate(-1)}>
            <span className="back-arrow">←</span>
            <span className="back-text">Înapoi</span>
          </div>
      
      <div className="bar_and_exercise">
      <div className="exercise-progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(progressIndex / exercises.length) * 100}%`

                }}
              ></div>
            </div>
      <div className="exercise-page">
        {!showResult && (
          <>
            

            <div className="exercise-card">
              {renderExercise(exercises[currentIndex])}
            </div>

          </>
        )}

       {showResult && (
  <div className="result-container">
    <div className={`result-card ${correctAnswers > exercises.length / 2 ? 'success' : 'fail'}`}>
      <h3>
        {correctAnswers > exercises.length / 2
          ? "🎉 Felicitări! Ai trecut examenul!"
          : "😞 Nu ai trecut examenul. Mai încearcă!"}
      </h3>
      <p>Ai răspuns corect la {correctAnswers} din {exercises.length} exerciții.</p>

      {correctAnswers > exercises.length / 2 && (
        <p style={{ fontWeight: "bold", marginTop: "10px" }}>
          +{xpGained} XP | +{coinsGained} Monede
        </p>
      )}

      <button className="return-button" onClick={handleRedirect}>
        Mergi la lecții
      </button>
    </div>
  </div>
)}


      </div>
      </div>
      <FloatingMenuComponent
  onOpenNotebook={() => setShowNotebook(true)}
  onOpenDictionary={() => setShowDictionary(true)}
  onOpenChatBot={() => setShowChatBot(true)}
/>
{showNotebook && <NotebookOverlay onClose={() => setShowNotebook(false)} />}
{showDictionary && <DictionaryOverlay onClose={() => setShowDictionary(false)} />}
{showChatBot && <ChatBotOverlay onClose={() => setShowChatBot(false)} />}

    </div>
  );
};

export default Exercitii;
