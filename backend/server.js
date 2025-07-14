const express = require('express');
const fs = require("fs");
const path = require("path");
const cors = require('cors');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";
const { exec } = require("child_process");  //pt ml
const multer = require("multer");


require("dotenv").config();




const app = express();
app.use(cors());
app.use(bodyParser.json());

oracledb.initOracleClient({ libDir: 'D:\\instantclient_19_22\\instantclient_23_7' }); //D:\instantclient_19_22\instantclient_23_7
const dbConfig = {
  user: 'ioana',
  password: 'raduioanA123',
  connectString: 'localhost/orclpdb'
};
function mapLevelToDifficulty(level) {
  switch (level) {
    case 'A1':
    case 'A2':
      return 'usor';
    case 'B1':
    case 'B2':
      return 'mediu';
    case 'C1':
    case 'C2':
      return 'greu';
    default:
      return 'usor'; // fallback
  }
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let connection;

  try {
    console.log("Cerere de login primită pentru utilizator:", username);
    connection = await oracledb.getConnection(dbConfig); console.log("Conexiune la Oracle DB realizată");

    const result = await connection.execute(
      `SELECT user_id,password FROM users WHERE username = :username`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      console.log("❌ No user found");
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const userId = user.USER_ID;

    const token = jwt.sign({ userId, username }, SECRET_KEY, { expiresIn: "1h" });
    console.log(`${token}`);

    console.log("Login success! Token generated:", token);
    res.json({ success: true, token });


  } catch (err) {
    console.error("Eroare în timpul autentificării:", err);
    res.status(500).json({ error: 'Database error', details: err.message });

  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Conexiune închisă");
      } catch (err) {
        console.error("Eroare la închiderea conexiunii:", err);
      }
    }
  }
});
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body; // Parola nu va mai fi hash-uită
  let connection;

  try {
    console.log("Cerere de înregistrare primită pentru utilizator:", username);

    connection = await oracledb.getConnection(dbConfig);
    console.log("Conexiune la Oracle DB realizată");

    // 🔹 Verifică dacă utilizatorul există deja
    const checkUser = await connection.execute(
      `SELECT * FROM users WHERE username = :username`,
      [username]
    );

    if (checkUser.rows.length > 0) {
      console.log("Eroare: Username-ul există deja.");
      return res.status(400).json({ success: false, message: "Username-ul este deja folosit!" });
    }

    // 🔹 Initializare LAST_COMPLETED_LESSONS ca JSON (CLOB)
    const lastCompletedLessons = '{"1": 0, "2": 0, "3": 0}'; // Progresul inițializat pentru toate capitolele la lecția 0

    // 🔹 Inserează utilizatorul în baza de date
    let userId;
    const result = await connection.execute(
      `INSERT INTO users (username, email, password, last_completed_chapter, last_completed_lessons) 
   VALUES (:username, :email, :password, 0, :lastCompletedLessons) 
   RETURNING user_id INTO :userId`,
      {
        username,
        email,
        password,
        lastCompletedLessons,
        userId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } // Asigură-te că această variabilă este legată corect
      },
      { autoCommit: true }
    );

    // Verifică rezultatul
    userId = result.outBinds.userId[0];
    console.log("UserId generat:", userId);

    // Obține ID-ul utilizatorului generat
    //const userId = result.outBinds.userId[0];

    // 🔹 Generează un token JWT
    const token = jwt.sign({ userId, username }, SECRET_KEY, { expiresIn: "1h" });
    console.log("Cont creat cu succes! Token generat:", token);

    // Răspuns cu token-ul generat
    res.json({ success: true, message: "Cont creat cu succes!", token });

  } catch (err) {
    console.error("Eroare la înregistrare:", err);
    res.status(500).json({ success: false, message: "Eroare la înregistrare.", details: err.message });

  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Conexiune închisă");
      } catch (err) {
        console.error("Eroare la închiderea conexiunii:", err);
      }
    }
  }
});
app.post("/set-level", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Lipsește tokenul" });

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_KEY);
  } catch {
    return res.status(403).json({ message: "Token invalid" });
  }

  const { level } = req.body;
  const userId = decoded.userId;
  console.log(level);
  console.log(userId);
  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE users SET english_level = :engLevel WHERE user_id = :userId`,
      {
        engLevel: level,
        userId: userId
      }
    );


    await connection.commit();
    await connection.close();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la actualizarea nivelului" });
  }
});
app.post("/api/log-error", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Lipsește tokenul" });

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_KEY);
  } catch {
    return res.status(403).json({ message: "Token invalid" });
  }

  const userId = decoded.userId;
  const { exerciseId, topic, difficulty } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO user_errors (user_id, exercise_id, topic, difficulty) 
       VALUES (:userId, :exerciseId, :topic, :difficulty)`,
      { userId, exerciseId, topic, difficulty }
    );
    await connection.commit();
    await connection.close();

    res.json({ success: true, message: "Eroarea a fost salvată" });
  } catch (err) {
    console.error("❌ Eroare la salvarea greșelii:", err);
    res.status(500).json({ message: "Eroare la salvarea greșelii" });
  }
});
app.get('/chapters', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "your_secret_key");
    const userId = decoded.userId;

    // Fetch user progress (LOB)
    const userResult = await connection.execute(
      `SELECT LAST_COMPLETED_CHAPTER, LAST_COMPLETED_LESSONS FROM USERS WHERE USER_ID = :userId`,
      [userId]
    );

    let lastCompletedChapter = 0;
    let completedLessonsJson = {};

    if (userResult.rows.length > 0) {
      lastCompletedChapter = userResult.rows[0][0] || 0;

      if (userResult.rows[0][1]) {
        const lob = userResult.rows[0][1];
        const lobData = await lob.getData();
        const jsonData = lobData.toString();

        try {
          completedLessonsJson = JSON.parse(jsonData);
        } catch (err) {
          console.error("❌ Eroare la parsarea LAST_COMPLETED_LESSONS:", err);
        }
      }
    }

    const chaptersResult = await connection.execute(
      `SELECT ID, TITLE, DESCRIPTION FROM CHAPTERS ORDER BY ID`
    );

    const chapters = [];

    for (let row of chaptersResult.rows) {
      const chapterId = row[0];

      const lessonResult = await connection.execute(
        `SELECT ID, LESSON_NUMBER FROM LESSONS WHERE CHAPTER_ID = :chapterId ORDER BY LESSON_NUMBER`,
        [chapterId]
      );

      const lessons = lessonResult.rows;
      const totalLessons = lessons.length;

      // comparăm lesson_number <= lastCompletedLessons[chapterId]
      const lastCompleted = completedLessonsJson[chapterId] || 0;

      const completedLessons = lessons.filter(l => l[1] <= lastCompleted).length;

      chapters.push({
        id: chapterId,
        title: row[1],
        description: row[2],
        completed: chapterId <= lastCompletedChapter,
        completedLessons,
        totalLessons
      });
    }

    res.json({ success: true, chapters });

  } catch (error) {
    console.error("❌ Eroare în /chapters:", error);
    res.status(500).json({ success: false, message: "Eroare internă", details: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
app.get('/lectii/:chapterId', async (req, res) => {
  let connection;
  const { chapterId } = req.params;

  try {
    console.log(`📢 Fetching lessons for Chapter ${chapterId}...`);

    // ✅ Extract userId from the JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token
    const decoded = jwt.verify(token, "your_secret_key"); // Verify token
    const userId = decoded.userId;

    connection = await oracledb.getConnection(dbConfig);
    console.log("✅ Connected to Oracle DB");

    // ✅ Fetch lessons for the given chapter
    const lessonsResult = await connection.execute(
      `SELECT ID,LESSON_NUMBER, TITLE FROM LESSONS WHERE CHAPTER_ID = :chapterId ORDER BY ID`,
      [chapterId]
    );

    console.log("Lessons found:", lessonsResult.rows);

    // ✅ Fetch user's last completed lessons
    const userProgressResult = await connection.execute(
      `SELECT LAST_COMPLETED_LESSONS FROM USERS WHERE USER_ID = :userId`,
      [userId]
    );

    let lastCompletedLessons = {}; // Default empty JSON object
    console.log("---------", userProgressResult.rows);
    if (userProgressResult.rows.length > 0 && userProgressResult.rows[0][0]) {
      try {
        // Extrage datele din obiectul Lob
        const lob = userProgressResult.rows[0][0]; // Lob obiect
        const lobData = await lob.getData(); // Extrage datele din Lob

        // Lob data este un buffer, așa că trebuie să o convertești într-un string
        const jsonData = lobData.toString();

        // Parsează JSON-ul
        lastCompletedLessons = JSON.parse(jsonData);
        console.log("Last completed lessons:", lastCompletedLessons);
        //lastCompletedLessons = JSON.parse(userProgressResult.rows[0][0]); // Parse JSON
      } catch (error) {
        console.error("❌ Error parsing LAST_COMPLETED_LESSONS JSON:", error);
      }
    }

    // ✅ Get last completed lesson for the specific chapter
    const lastCompletedLesson = lastCompletedLessons[chapterId] || 0;

    console.log(`🔹 User ${userId} last completed lesson in Chapter ${chapterId}: ${lastCompletedLesson}`);

    // ✅ Transform the result into JSON format
    const lessons = lessonsResult.rows.map(row => ({
      id: row[0],
      title: row[2],
      completed: row[1] <= lastCompletedLesson // ✅ Marks completed lessons
    }));

    console.log("✅ Formatted lessons:", lessons);
    res.json({ success: true, lessons });

  } catch (error) {
    console.error("❌ Database error:", error.message);
    res.status(500).json({ success: false, message: "Error fetching lessons", details: error.message });

  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("✅ Database connection closed.");
      } catch (err) {
        console.error("❌ Error closing connection:", err);
      }
    }
  }
});
app.get("/teorie/:lessonId", async (req, res) => {
  const { lessonId } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: "Token lipsă" });

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_KEY);
  } catch {
    return res.status(403).json({ error: "Token invalid" });
  }

  const userId = decoded.userId;

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT english_level FROM users WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilizatorul nu a fost găsit." });
    }

    const userLevel = result.rows[0].ENGLISH_LEVEL;
    let nivelText;

    switch (userLevel) {
      case "A1":
      case "A2":
        nivelText = "usor";
        break;
      case "B1":
      case "B2":
        nivelText = "mediu";
        break;
      case "C1":
      case "C2":
        nivelText = "avansat";
        break;
      default:
        nivelText = "avansat";
    }

    const filePath = path.join(__dirname, "teorie", lessonId, `${nivelText}.txt`);

    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        console.error(`❌ Eroare la citirea fișierului:`, err);
        return res.status(404).json({ error: "Teoria nu a fost găsită pentru nivelul tău." });
      }
      res.json({ teorie: data });
    });

  } catch (err) {
    console.error("❌ Eroare la preluarea nivelului:", err);
    res.status(500).json({ error: "Eroare server" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("❌ Eroare la închiderea conexiunii:", err);
      }
    }
  }
});
app.get('/exercitii/:lessonId', async (req, res) => {
  let connection;
  const { lessonId } = req.params; // preia lessonId din URL

  console.log("--------Lesson:", lessonId);
  if (!lessonId) {
    return res.status(400).json({ success: false, message: 'Lesson ID is required' });
  }
  console.log("--------Lesson: exista");
  connection = await oracledb.getConnection(dbConfig);
  console.log("✅ -----Connected to Oracle DB");
  try {
    console.log("🔧 A intrat în try");
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    console.log("🔧 A intrat în try2");
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;
    const userLevelResult = await connection.execute(
      `SELECT english_level FROM users WHERE user_id = :userId`,
      { userId }
    );
    console.log("🔧 A intrat în try3");

    const userLevel = userLevelResult.rows[0][0]; // ex: "B1"
    const difficulty = mapLevelToDifficulty(userLevel); // ex: "mediu"
    // 🔍 AICI PUI LOGURILE DE DEBUG
    console.log("🔎 User Level:", userLevel);
    console.log("🔎 Difficulty folosit:", difficulty);
    console.log("🔎 Lesson ID:", lessonId);
    console.log(`======================================🔍 User ${userId} level: ${userLevel}, mapped difficulty: ${difficulty}`);
    // Query pentru a obține exercițiile asociate lecției
    const result = await connection.execute(
      `SELECT TYPE, LESSON_ID, QUESTION, OPTIONS, ANSWER, DIFFICULTY, TOPIC, ID
       FROM exercises
       WHERE lesson_id = :lessonId AND difficulty = :difficulty`,
      {
        lessonId: parseInt(lessonId),
        difficulty
      }
    );
    console.log("--------Exercitiile au fost preluate", result.rows);

    // Dacă există exerciții pentru lecția respectivă
    if (result.rows.length > 0) {
      console.log("------exista exercitii pt lectie in db");
      return res.json({ success: true, exercises: result });
    } else {
      console.log("------ nu exista exercitii pt lectie in db");
      return res.status(404).json({ success: false, message: 'No exercises found for this lesson' });
    }
  } catch (error) {
    console.error("-------Error fetching exercises:", error);
    return res.status(500).json({ success: false, message: 'Server error while fetching exercises' });
  }
});
// app.get('/exercitii/:lessonId', async (req, res) => {
//   let connection;
//   const { lessonId } = req.params;

//   if (!lessonId) {
//     return res.status(400).json({ success: false, message: 'Lesson ID is required' });
//   }

//   try {
//     // 🔐 Token și userId
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       return res.status(401).json({ success: false, message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, SECRET_KEY);
//     const userId = decoded.userId;

//     connection = await oracledb.getConnection(dbConfig);
//     console.log("✅ Connected to Oracle DB");

//     // 🔎 Obține nivelul de engleză al utilizatorului
//     const userLevelResult = await connection.execute(
//       `SELECT english_level FROM users WHERE user_id = :userId`,
//       { userId }
//     );

//     const userLevel = userLevelResult.rows[0][0]; // ex: "B1"
//     const difficulty = mapLevelToDifficulty(userLevel); // ex: "mediu"

//     console.log(`🔍 User ${userId} level: ${userLevel}, mapped difficulty: ${difficulty}`);

//     // 📦 Ia exercițiile corespunzătoare
//     const result = await connection.execute(
//       `SELECT TYPE, LESSON_ID, QUESTION, OPTIONS, ANSWER, DIFFICULTY, TOPIC
//        FROM exercises
//        WHERE lesson_id = :lessonId AND difficulty = :difficulty`,
//       {
//         lessonId: parseInt(lessonId),
//         difficulty
//       }
//     );

//     if (result.rows.length > 0) {
//       return res.json({ success: true, exercises: result });
//     } else {
//       return res.status(404).json({ success: false, message: 'No exercises found for this lesson and difficulty' });
//     }

//   } catch (error) {
//     console.error("❌ Error fetching exercises:", error);
//     return res.status(500).json({ success: false, message: 'Server error while fetching exercises' });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//         console.log("✅ Connection closed");
//       } catch (err) {
//         console.error("❌ Error closing connection:", err);
//       }
//     }
//   }
// });

function streamToString(lob) {
  return new Promise((resolve, reject) => {
    let data = '';
    lob.setEncoding('utf8');

    lob.on('data', chunk => data += chunk);
    lob.on('end', () => resolve(data));
    lob.on('error', err => reject(err));
  });
}


app.post("/api/update-progress", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token lipsa" });

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, "your_secret_key");
  } catch (err) {
    return res.status(403).json({ message: "Token invalid" });
  }

  const userId = decoded.userId;
  const { chapterId, lessonId } = req.body;


  console.log("---VALORI PRIMITE---");
  console.log("userId:", userId);
  console.log("chapterId:", chapterId, typeof chapterId);
  console.log("lessonId:", lessonId, typeof lessonId);

  //LOGICA UPDATE ULTIMA LECTIE COMPLETATA DIN CAPITOLUL CURENT
  try {
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT last_completed_lessons,last_completed_chapter FROM users WHERE user_id=:userId FOR UPDATE`,
      [userId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );


    //let jsonStr= result.rows[0]?.LAST_COMPLETED_LESSONS||"{}";
    let jsonStr = "{}";
    const lob = result.rows[0]?.LAST_COMPLETED_LESSONS;

    if (lob) {
      jsonStr = await streamToString(lob);
    }


    let progress = {};
    console.log("---jsonStr (raw JSON din DB)-----", jsonStr);


    console.log(`---progres----- ${progress}`)
    try {
      progress = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON invalid , resetam....");
      progress = {};
    }
    console.log("---progress (parsare JSON)-----", progress);


    const existing = progress[chapterId.toString()];

    console.log(`---existing pentru capitol ${chapterId} este:`, existing);

    if (!existing || lessonId > existing) {
      progress[chapterId] = lessonId;
    }
    console.log(`----progres2---- ${progress}`);

    await connection.execute(
      `UPDATE users SET last_completed_lessons = :json WHERE user_id = :userId`,
      { json: JSON.stringify(progress), userId }
    );

    console.log("---progres final (după modificare)-----", progress);
    console.log("---json final ce va fi salvat în DB-----", JSON.stringify(progress));

    if (progress[chapterId] >= 11) {
      console.log(`✅ User ${userId} a completat toate lecțiile din capitolul ${chapterId}. Se actualizează last_completed_chapter.`);

      await connection.execute(
        `UPDATE users SET last_completed_chapter = :chapterId WHERE user_id = :userId`,
        { chapterId, userId }
      );
    }


    await connection.commit();
    await connection.close();
    //ml
    // ✅ Rulează modelul ML după fiecare actualizare
    const cmd = `python ./ml/predict_user_level.py ${userId}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Eroare la rularea scriptului ML:", error.message);
      } else {
        console.log("✅ Script ML executat cu succes:", stdout);
      }
    });

    res.json({ success: true, message: "Progres salvat cu succes." });
    //ml

  } catch (err) {
    console.error("Eroare DB:", err);
    res.status(500).json({ success: false, message: "Eroare interna server" });
  }
});

app.get("/api/lesson/:lessonId/chapter", async (req, res) => {
  const { lessonId } = req.params;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT chapter_id FROM lessons WHERE id = :lessonId`,
      [lessonId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }

    res.json({ success: true, chapterId: result.rows[0].CHAPTER_ID });
  } catch (err) {
    console.error("Eroare DB:", err);
    res.status(500).json({ success: false, message: "Eroare server" });
  }
});

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));

// Middleware pt. static files
app.use("/avatars", express.static(path.join(__dirname, "avatars")));

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "avatars/");
  },
  filename: (req, file, cb) => {
    const username = req.query.username; // <-- AICI!
    const ext = path.extname(file.originalname);
    cb(null, `${username}${ext}`);
  },
});


const upload = multer({ storage });
app.post("/upload-avatar", upload.single("image"), (req, res) => {
  console.log("Am primit un fișier:");
  console.log("Fișier:", req.file);
  console.log("Username:", req.body.username);

  res.json({ success: true, filename: req.file.filename });
}


);



// //rewards update
// app.post("/api/update-rewards", async (req, res) => {
//   const { username, xp, coins } = req.body;
//   if (!username || xp == null || coins == null) {
//     return res.status(400).json({ success: false, message: "Lipsesc datele" });
//   }

//   try {
//     await db.execute(
//       `UPDATE users SET xp = xp + :xp, coins = coins + :coins WHERE username = :username`,
//       [xp, coins, username]
//     );

//     res.json({ success: true });
//   } catch (err) {
//     console.error("Eroare la actualizarea XP/coins:", err);
//     res.status(500).json({ success: false, message: "Eroare server" });
//   }
// });

app.post("/api/update-rewards", async (req, res) => {
  const { username, xp, coins } = req.body;

  if (!username || xp == null || coins == null) {
    return res.status(400).json({ success: false, message: "Lipsesc datele" });
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `UPDATE users
       SET xp = xp + :xp,
           coins = coins + :coins
       WHERE username = :username`,
      { xp, coins, username },
      { autoCommit: true }
    );

    await connection.close();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Eroare la actualizarea XP/coins:", err);
    res.status(500).json({ success: false, message: "Eroare server DB" });
  }
});





//const { chapterId } = req.params;
//DE CE PUNEM const {} ???

//destructuring assignment -- req.params este un obiect care contine parametrii din URL-ul cererii
//de exemplu pt ruta /lectii/5  { chapterId: '5' }
//deci { chapterId } este sintaxa de destructurare a obiectului din req.params asociata cheii chapterId


















//ml 
//const { exec } = require("child_process");

app.get("/api/predict-level/:userId", async (req, res) => {
  const userId = req.params.userId;

  // rulează scriptul Python și îi trimite userId ca argument
  const command = `python ./ml/predict_user_level.py ${userId}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Eroare la rularea scriptului: ${error.message}`);
      return res.status(500).json({ success: false, message: "Eroare la script" });
    }

    if (stderr) {
      console.error(`⚠️ STDERR: ${stderr}`);
    }

    console.log("📤 Output din script:", stdout);
    res.json({ success: true, output: stdout });
  });
});


app.get("/api/user-stats/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT xp, coins FROM users WHERE username = :username`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { XP, COINS } = result.rows[0];
res.json({ success: true, xp: XP, coins: COINS });

  } catch (err) {
    console.error("Eroare DB:", err);
    res.status(500).json({ success: false, message: "Eroare server" });
  }
});


app.get("/api/user-profile/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT email, joined_at, user_level, last_completed_lessons FROM users WHERE username = :username`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { EMAIL, JOINED_AT, USER_LEVEL, LAST_COMPLETED_LESSONS } = result.rows[0];

    res.json({
      success: true,
      email: EMAIL,
      joinedAt: JOINED_AT,
      level: USER_LEVEL,
      lastCompleted: LAST_COMPLETED_LESSONS

    });
  } catch (err) {
    console.error("❌ Eroare profil:", err);
    res.status(500).json({ success: false });
  }
});

app.post("/api/reset-progress", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: "Username lipsă" });
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE users SET last_completed_lessons = :resetData WHERE username = :username`,
      [JSON.stringify({ "1": 0, "2": 0, "3": 0 }), username],
      { autoCommit: true }
    );
    await connection.close();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Eroare la reset progres:", err);
    res.status(500).json({ success: false });
  }
});


// GET – returnează notițele
app.get("/api/notes/:username", (req, res) => {
  const { username } = req.params;
  const filePath = path.join(__dirname, "notes", `${username}_notes.txt`);

  if (!fs.existsSync(filePath)) {
    return res.json({ notes: "" });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Eroare la citirea notițelor:", err);
      return res.status(500).json({ success: false });
    }

    res.json({ notes: data });
  });
});

// POST – salvează notițele
app.post("/api/notes/save", (req, res) => {
  const { username, content } = req.body;

  if (!username || content === undefined) {
    return res.status(400).json({ success: false, message: "Date lipsă" });
  }

  const dirPath = path.join(__dirname, "notes");
  const filePath = path.join(dirPath, `${username}_notes.txt`);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error("Eroare la salvare:", err);
      return res.status(500).json({ success: false });
    }

    res.json({ success: true });
  });
});
app.use(express.json());
const axios = require("axios");

app.post("/api/translate", async (req, res) => {
  const { q, source, target } = req.body;

  try {
   const response = await axios.post("https://libretranslate.de/translate", {
      q,
      source,
      target,
      format: "text",
    }, {
      headers: { "Content-Type": "application/json" }
    });
console.log("Răspuns primit de la LibreTranslate:", response.data);

    res.json({ translatedText: response.data.translatedText });
  } catch (err) {
    console.error("Eroare la traducere:", err.message);
    res.status(500).json({ error: "Eroare la traducere" });
  }
});

app.post("/api/update-level", async (req, res) => {
  const { username, level } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    await connection.execute(
      `UPDATE users SET level = :level WHERE username = :username`,
      [level, username],
      { autoCommit: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Eroare DB la update level:", err);
    res.status(500).json({ success: false, message: "DB error" });
  } finally {
    if (connection) await connection.close();
  }
});

app.post("/api/update-english-level", async (req, res) => {
  const { username, english_level } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE users SET english_level = :english_level WHERE username = :username`,
      [english_level, username],
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Eroare la update english_level:", err);
    res.status(500).json({ success: false, message: "Eroare la actualizare." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Eroare la închiderea conexiunii:", err);
      }
    }
  }
});

app.post("/api/recommend-level", async (req, res) => {
  const { username } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT user_id FROM users WHERE username = :username`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const userId = result.rows?.[0]?.USER_ID;
    if (!userId) {
      return res.status(404).json({ error: "Utilizatorul nu a fost găsit." });
    }

    const cmd = `python ./ml/predict_user_level.py ${userId}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Eroare la rularea scriptului ML:", error.message);
        return res.status(500).json({ error: "Eroare la rularea modelului ML" });
      }

      console.log("✅ Output ML:", stdout);

      // Caută nivelul prezis în output
      const match = stdout.toString().match(/Nivel prezis.*?:\s*([A-Z0-9]+)/i);
      const predictedLevel = match?.[1];

      if (!predictedLevel) {
        return res.status(200).json({ message: "Nu s-a putut detecta un nivel recomandat." });
      }

      return res.json({
        success: true,
        level: predictedLevel // ← trimitem doar B1, C2 etc.
      });
    });
  } catch (err) {
    console.error("❌ Eroare în /api/recommend-level:", err);
    res.status(500).json({ error: "Eroare internă server" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("❌ Eroare la închiderea conexiunii:", e);
      }
    }
  }
});

app.get("/teorie/default", (req, res) => {
  const defaultPath = path.join(__dirname, "teorie", "default.txt");

  fs.readFile(defaultPath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Nu s-a putut încărca fallback-ul." });
    res.json({ teorie: data });
  });
});





// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// async function getUserErrors(username) {
//   let connection;

//   try {
//     connection = await oracledb.getConnection(dbConfig);

//     const result = await connection.execute(
//       `
//       SELECT topic, COUNT(*) AS errors
//       FROM user_errors
//       WHERE user_id = (SELECT user_id FROM users WHERE username = :username)
//       GROUP BY topic
//       ORDER BY errors DESC
//       FETCH FIRST 3 ROWS ONLY
//       `,
//       [username],
//       { outFormat: oracledb.OUT_FORMAT_OBJECT }
//     );

//     if (result.rows.length === 0) {
//       return `🔍 Nu am găsit greșeli înregistrate pentru utilizatorul ${username}.`;
//     }

//     const topTopics = result.rows
//       .map(row => `${row.TOPIC} (${row.ERRORS} greșeli)`)
//       .join(", ");

//     return `📊 Cele mai greșite topicuri ale tale sunt: ${topTopics}.`;
//   } catch (err) {
//     console.error("Eroare DB getUserErrors:", err);
//     return "❌ Eroare la accesarea bazei de date.";
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//       } catch (e) {
//         console.error("Eroare la închiderea conexiunii:", e);
//       }
//     }
//   }
// }async function runChatBot(prompt) {
//   const API_KEY = process.env.GEMINI_API_KEY;
//   console.log("🔑 API KEY:", API_KEY?.slice(0, 8)); // Evită să o loghezi complet
//   console.log("📨 Prompt primit:", prompt);

//   if (!API_KEY) {
//     console.error("❗ API KEY lipsește!");
//     return "❌ Cheia API lipsește.";
//   }

//   const isErrorQuery =
//     prompt.toLowerCase().includes("topicuri") &&
//     prompt.toLowerCase().includes("greșit");

//   const userMatch = prompt.match(/Utilizator:\s*([^\.\n]+)/i);
//   const username = userMatch?.[1]?.trim();
//   if (isErrorQuery && username) {
//     console.log("ℹ️ Rulăm getUserErrors pentru:", username);
//     return await getUserErrors(username);
//   }

//   const url = `https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage?key=${API_KEY}`;
//   const payload = {
//     prompt: {
//       messages: [
//         {
//           author: "user",
//           content: prompt,
//         },
//       ],
//     },
//     temperature: 0.7,
//     candidateCount: 1,
//   };

//   try {
//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     console.log("📡 Status răspuns:", res.status);
//     const raw = await res.text();

//     if (!res.ok) {
//       console.error("❌ Eroare API PaLM:", raw);
//       return "❌ Eroare la apelarea PaLM.";
//     }

//     const data = JSON.parse(raw);
//     console.log("✅ Răspuns PaLM:", data);
//     return data?.candidates?.[0]?.content || "-- fără răspuns de la PaLM --";
//   } catch (err) {
//     console.error("💥 Eroare fetch PaLM:", err);
//     return "❌ Eroare la comunicarea cu AI-ul.";
//   }
// }


app.get("/api/user-errors/:username", async (req, res) => {
  const username = req.params.username;
  let connection;

  try {
    console.log(`🔍 Caut erorile pentru user: ${username}`);
    connection = await oracledb.getConnection(dbConfig);
    console.log("✅ Conectat la Oracle DB");

    // Găsește user_id pe baza username-ului
    const userResult = await connection.execute(
      `SELECT user_id FROM users WHERE username = :username`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (userResult.rows.length === 0) {
      console.log("❌ Utilizator inexistent.");
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].USER_ID;
    console.log("🆔 user_id =", userId);

    // Obține topicurile greșite
    const errorsResult = await connection.execute(
      `SELECT topic, COUNT(*) AS count
       FROM user_errors
       WHERE user_id = :userId
       GROUP BY topic
       ORDER BY count DESC`,
      [userId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("📊 Rezultat erori:", errorsResult.rows);

    res.json(errorsResult.rows); // direct [{ topic: ..., count: ... }, ...]
  } catch (err) {
    console.error("❌ Eroare la ruta /api/user-errors/:username:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("🔌 Conexiune închisă");
      } catch (e) {
        console.error("❌ Eroare la închiderea conexiunii:", e);
      }
    }
  }
});

app.get("/api/user-profile/:username", async (req, res) => {
  const { username } = req.params;
  let connection;

  console.log(`📩 [API] Cerere profil pentru user: ${username}`);

  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log("✅ Conexiune DB stabilită");

    const result = await connection.execute(
      `SELECT 
         username, 
         email, 
         joined_at, 
         user_level, 
         english_level, 
         xp, 
         coins 
       FROM users 
       WHERE username = :username`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("📦 Rezultat DB:", result.rows);

    if (result.rows.length === 0) {
      console.log("❌ Utilizator inexistent");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const row = result.rows[0];
    console.log("📤 Trimitem:", row);

    res.json({
      success: true,
      username: row.USERNAME,
      email: row.EMAIL,
      joinedAt: row.JOINED_AT,
      level: row.USER_LEVEL,
      englishLevel: row.ENGLISH_LEVEL,
      xp: row.XP,
      coins: row.COINS
    });
  } catch (err) {
    console.error("❌ Eroare DB:", err);
    res.status(500).json({ success: false, message: "Eroare server" });
  } finally {
    if (connection) {
      await connection.close();
      console.log("🔌 Conexiune DB închisă");
    }
  }
});





///TESTE
app.get("/api/tests", (req, res) => {
  const fs = require("fs");
  const dir = "./uploads/tests/";

  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: "Could not list files" });
    const testList = files.map((filename) => ({
      name: filename.split(".")[0],
      filename,
    }));
    res.json(testList);
  });
});

// const multer = require("multer");
const uploadResolved = multer({ dest: "uploads/resolved/" });

app.post("/api/upload-resolved/:username/:testName", uploadResolved.single("pdf"), (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const { username, testName } = req.params;

  const newFilename = `${username}_${testName}`;
  const dest = path.join("uploads/resolved", newFilename);

  fs.rename(req.file.path, dest, (err) => {
    if (err) return res.status(500).json({ error: "Failed to move file" });
    res.json({ success: true });
  });
});

app.get("/api/uploads/:username", (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const { username } = req.params;

  fs.readdir("uploads/resolved", (err, files) => {
    if (err) return res.status(500).json({ error: "Cannot read resolved folder" });
    const uploaded = {};
    files.forEach((file) => {
      if (file.startsWith(username + "_")) {
        const testName = file.replace(username + "_", "");
        uploaded[testName] = true;
      }
    });
    res.json(uploaded); // ex: { "test1.pdf": true, "test2.pdf": true }
  });
});

app.post("/api/save-grade", async (req, res) => {
  const { username, testFilename, grade } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `MERGE INTO user_test_grades g
       USING DUAL ON (g.username = :username AND g.test_filename = :testFilename)
       WHEN MATCHED THEN
         UPDATE SET grade = :grade, graded_at = SYSDATE
       WHEN NOT MATCHED THEN
         INSERT (username, test_filename, grade)
         VALUES (:username, :testFilename, :grade)`,
      { username, testFilename, grade }
    );
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    console.error("Eroare la salvare notă:", err);

    res.status(500).json({ success: false, message: "Eroare la salvarea notei." });

  } finally {
    if (connection) await connection.close();
  }
});

app.use("/uploads/resolved", express.static(path.join(__dirname, "uploads/resolved")));

app.get("/api/grades", async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT username, test_filename, grade FROM user_test_grades`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la GET grades:", err);
    res.status(500).json({ error: "Eroare la interogare note" });
  }
});


app.get("/api/uploads-all", async (req, res) => {
  const fs = require("fs");
  const path = require("path");

  const dir = path.join(__dirname, "uploads/resolved");
  const grouped = {};

  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: "Eroare la listarea fișierelor" });

    files.forEach((file) => {
      const [username] = file.split("_");
      if (!grouped[username]) grouped[username] = [];
      grouped[username].push(file);
    });

    res.json(grouped);
  });
});

