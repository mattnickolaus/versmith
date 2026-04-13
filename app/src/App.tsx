import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login.js';
import SignUp from './components/SignUp.js';
import Home from './components/Home.js';
import Profile from './components/Profile.js';
import Document from './components/Document.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Home />} />
        <Route path="/documents/:id" element={<Document />} />
      </Routes>
    </Router>
  );
}

export default App
