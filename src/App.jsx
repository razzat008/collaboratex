import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Main from "./components/Main/Main";

import Features from "./pages/Features";
import Templates from "./pages/Templates";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <Router>
    <div className="App flex flex-col min-h-screen">
    <Navbar />
    <div className="flex-grow">
    <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/features" element={<Features />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
    </div>
      <Footer />
    </div>
    </Router>
  )
}

export default App


