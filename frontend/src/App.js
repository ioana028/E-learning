import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login'
import Lectii from './components/Lectii';
import Chapters from './components/Chapters';
import Welcome from './components/Welcome';
import Register from './components/Register';
import Exercitii from './components/Exercitii';
import SetLevel from './components/SetLevel';
import Teorie from './components/Teorie';
import Profil from './components/Profil';
import Notebook from './components/Notebook';
import DashboardLayout from './components/DashboardLayout';
import FloatingMenu from './components/FloatingMenuComponent';
import DefinitionPage from './components/DefinitionPage';
import ChatBot from './components/ChatBot';


const App = () => (
  <Router>
    <Routes>
    <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chapters" element={<Chapters />} />
      <Route path="/lectii/:chapterId" element={<Lectii />} />
      <Route path="/teorie/:lessonId" element={<Teorie />} />
      <Route path="/exercitii/:lessonId" element={<Exercitii />} />
      <Route path="/set-level" element={<SetLevel />} />
      <Route path="/profil" element={<Profil />} />
      <Route path="/notebook" element={<Notebook />} />
      <Route path="/dashboard" element={<DashboardLayout />} />
     <Route path="/dictionary" element={<DefinitionPage />} />
<Route path="/ai" element={<ChatBot />} /> 

    </Routes>
  </Router>
);

export default App;

//in backend rulez  node .\server.js
// infrontend rulez npm start
