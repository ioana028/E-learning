const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const bcrypt = require("bcrypt");


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
      `SELECT password FROM users WHERE username = :username`,
      [username]
    );

    if (result.rows.length > 0) {
      const hashedPassword = result.rows[0][0];

      // 🔹 Compară parola introdusă cu cea din baza de date
      const match = await bcrypt.compare(password, hashedPassword);

      if (match) {
        console.log("Autentificare reușită");
        return res.json({ success: true });
      }
    }

    console.log("Autentificare eșuată: utilizator sau parolă greșită");
    res.json({ success: false, message: "Username sau parolă incorectă!" });

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
  const { username, email, password } = req.body;
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

    // 🔹 Criptează parola înainte de a o salva
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Inserează utilizatorul în baza de date
    await connection.execute(
      `INSERT INTO users (username, email, password, last_completed_chapter, last_completed_lesson) VALUES (:username, :email, :password, 0, 0)`,
      [username, email, hashedPassword],
      { autoCommit: true }
    );

    console.log("Utilizator înregistrat cu succes!");
    res.json({ success: true, message: "Cont creat cu succes!" });

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

app.get('/chapters', async (req, res) => {
  let connection;
  try {
    console.log("Fetching chapters...");
    connection = await oracledb.getConnection(dbConfig); console.log("Connected to Oracle DB");
    const result = await connection.execute(`SELECT * FROM CHAPTERS ORDER BY ID`); console.log("Chapters fetched:", result.rows);
    const chapters = result.rows.map(row => ({
      id: row[0],
      title: row[1],
      description: row[2]
    }));
    res.json({ success: true, chapters });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, message: "Eroare la extragerea capitolelor", details: error.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Database connection closed.");
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
});

app.get('/chapters/:userId', async (req, res) => {
  let connection;
  const userId = req.params.userId;

  try {
    console.log(`Fetching chapters for user ${userId}...`);
    connection = await oracledb.getConnection(dbConfig);  console.log("Connected to Oracle DB");

    // Fetch all chapters
    const chaptersResult = await connection.execute(
      `SELECT ID, TITLE, DESCRIPTION FROM CHAPTERS ORDER BY ID`
    );   //console.log("Raw chapter data:", chaptersResult.rows);

    // Fetch user's last completed chapter
    const userProgressResult = await connection.execute(
      `SELECT LAST_COMPLETED_CHAPTER FROM USERS WHERE USER_ID = :userId`,
      [userId]
    );

    // If no result, set progress to 0
    const lastCompletedChapter = userProgressResult.rows.length > 0
      ? Number(userProgressResult.rows[0][0]) || 0
      : 0;  // console.log(`User ${userId} last completed chapter: ${lastCompletedChapter}`);

    // Transform the result into JSON format
    const chapters = chaptersResult.rows.map(row => ({
      id: row[0],
      title: row[1],
      description: row[2],
      completed: row[0] <= lastCompletedChapter  
    })); //console.log("Formatted chapters:", chapters);
    
    res.json({ success: true, chapters });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, message: "Eroare la extragerea capitolelor.", details: error.message });

  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Database connection closed.");
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
});

app.get('/lectii/:chapterId/:userId', async (req, res) => {
  let connection;
  const { chapterId, userId } = req.params;

  try {
    console.log(`Fetching lessons for Chapter ${chapterId} and User ${userId}...`);

    connection = await oracledb.getConnection(dbConfig);
    console.log("Connected to Oracle DB");

    // Fetch lessons for the given chapter
    const lessonsResult = await connection.execute(
      `SELECT ID, TITLE FROM LESSONS WHERE CHAPTER_ID = :chapterId ORDER BY ID`,
      [chapterId]
    );

    console.log("Lessons found:", lessonsResult.rows);

    // Fetch user's last completed lesson
    const userProgressResult = await connection.execute(
      `SELECT LAST_COMPLETED_LESSON FROM USERS WHERE USER_ID = :userId`,
      [userId]
    );

    // If no result, set progress to 0
    const lastCompletedLesson = userProgressResult.rows.length > 0
      ? Number(userProgressResult.rows[0][0]) || 0
      : 0;

    console.log(`User ${userId} last completed lesson: ${lastCompletedLesson}`);

    // Transform the result into JSON format
    const lessons = lessonsResult.rows.map(row => ({
      id: row[0],
      title: row[1],
      completed: row[0] <= lastCompletedLesson // ✅ Marks completed lessons
    }));

    console.log("Formatted lessons:", lessons);

    res.json({ success: true, lessons });

  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, message: "Eroare la extragerea lecțiilor.", details: error.message });

  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Database connection closed.");
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
});








app.listen(5000, () => console.log('Backend running on http://localhost:5000'));
