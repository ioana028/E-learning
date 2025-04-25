const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";

const app = express();
app.use(cors());
app.use(bodyParser.json());

oracledb.initOracleClient({ libDir: 'D:\\instantclient_19_22\\instantclient_23_7' }); //D:\instantclient_19_22\instantclient_23_7
const dbConfig = {
  user: 'ioana',
  password: 'raduioanA123',
  connectString: 'localhost/orclpdb'
};

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

    const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: "1h" });
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
    const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: "1h" });
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

// app.get('/chapters', async (req, res) => {
//   let connection;
//   try {
//     console.log("Fetching chapters...");
//     connection = await oracledb.getConnection(dbConfig);
//     console.log("✅ Connected to Oracle DB");

//     // 1️⃣ Get all chapters
//     const result = await connection.execute(`SELECT ID, TITLE, DESCRIPTION FROM CHAPTERS ORDER BY ID`);

//     // 2️⃣ Get `last_completed_chapter` from the logged-in user
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       return res.status(401).json({ success: false, message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1]; // Extract token
//     const decoded = jwt.verify(token, "your_secret_key"); // Verify token
//     const userId = decoded.userId;

//     const userResult = await connection.execute(
//       `SELECT LAST_COMPLETED_CHAPTER FROM USERS WHERE USER_ID = :userId`,
//       [userId]
//     );

//     let lastCompletedChapter = userResult.rows.length > 0 ? userResult.rows[0][0] : 0;

//     console.log(`🔹 User ${userId} last completed chapter:`, lastCompletedChapter);

//     // 3️⃣ Map chapters and mark them as completed
//     const chapters = result.rows.map(row => ({
//       id: row[0],
//       title: row[1],
//       description: row[2],
//       completed: row[0] <= lastCompletedChapter // ✅ Mark completed
//     }));

//     res.json({ success: true, chapters });

//   } catch (error) {
//     console.error("❌ Database error:", error.message);
//     res.status(500).json({ success: false, message: "Eroare la extragerea capitolelor", details: error.message });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//         console.log("✅ Database connection closed.");
//       } catch (err) {
//         console.error("❌ Error closing connection:", err);
//       }
//     }
//   }
// });

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
    // Query pentru a obține exercițiile asociate lecției
    const result = await connection.execute(
      'SELECT TYPE,LESSON_ID,QUESTION,OPTIONS,ANSWER FROM exercises WHERE lesson_id = :lessonId', [lessonId]
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

    res.json({ success: true, message: "Progres salvat cu succes." });
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












//const { chapterId } = req.params;
//DE CE PUNEM const {} ???

//destructuring assignment -- req.params este un obiect care contine parametrii din URL-ul cererii
//de exemplu pt ruta /lectii/5  { chapterId: '5' }
//deci { chapterId } este sintaxa de destructurare a obiectului din req.params asociata cheii chapterId