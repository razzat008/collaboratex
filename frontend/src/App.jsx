import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Main from "./components/Main/Main";
import Features from "./pages/Features";
import Templates from "./pages/Templates";

function App() {
  return (
    <Router>
    <div className="App flex flex-col min-h-screen">
    <Navbar />
    <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/features" element={<Features />} />
          <Route path="/templates" element={<Templates />} />
        </Routes>
      
      <Footer />
    </div>
    </Router>
  )
}

export default App


