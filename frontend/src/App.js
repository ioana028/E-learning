import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login'
import Lectii from './components/Lectii';
import Chapters from './components/Chapters';
import Welcome from './components/Welcome';
import Register from './components/Register';


const App = () => (
  <Router>
    <Routes>
    <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chapters" element={<Chapters />} />
      <Route path="/lectii/:chapterId" element={<Lectii />} />
    </Routes>
  </Router>
);

export default App;

//in backend rulez  node .\server.js
// infrontend rulez npm start
