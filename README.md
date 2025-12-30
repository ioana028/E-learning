# E-Learning Language Application (Duolingo-style)

This project is an e-learning platform designed to help users learn a foreign language, similar to Duolingo.  
It includes adaptive learning using basic machine learning logic to adjust difficulty based on the user's progress.

---

## 🎈​ Features
- Interactive language learning exercises (Duolingo-style)
- Machine-learning-based adaptation to user level
- User authentication and authorization using JWT
- Backend API built with Node.js & Express
- Frontend built using React (JavaScript)
- Oracle SQL database used to store user accounts, progress, and lesson data

---

## 📲​ Project Structure 
- **Frontend:** React (JavaScript)
- **Backend:** Node.js + Express
- **Database:** Oracle SQL (script included inside this repository)

---

## 🔐 Important Notice (Security)
This project previously contained exposed Google API keys.  
Those keys **have been revoked and are no longer valid** for security reasons.  
If you want to use or test this application, you must:
1️⃣ Generate your own Google API keys in Google Cloud  
2️⃣ Replace the keys found in the codebase with your own versions  

Environment variables were **not** used in the original implementation, so keys may appear directly in the code.

---

## 🗄️ Database Information
The repository contains an `.sql` script used to create and populate the Oracle database.  
To set up the backend properly, you must:

1. Install Oracle DB or use an Oracle-compatible cloud instance  
2. Execute the provided SQL script to create the required tables and insert initial data  
3. Update the database connection information in the backend code:
   - host / IP
   - port
   - username
   - password
   - database/service name

Example (inside Node.js backend):

```javascript
// Example only — update values with your own
const dbConfig = {
  user: "your_username",
  password: "your_password",
  connectString: "host:port/database_service"
};
```

🏗️ Running the Application (General Idea)

Because this project was developed some time ago, exact commands may vary, but typically the setup is as follows:

1️⃣ Backend
npm install
npm start

2️⃣ Frontend
cd client
npm install
npm start


You will need to update:
database credentials in backend
Google API keys (generate new ones)
any other secret values hard-coded in the project


Note: When this project was originally created I was just beginning to learn backend security practices.  
As a result, some sensitive values (API keys, database credentials) were hard-coded in the code at that time.  
They have been removed or revoked, but please be aware that the project reflects an early stage of my learning process.



-----------------------------------------------------------------Have fun exploring the code, and thank you for taking a look!---------------------------------------------------------------------------
