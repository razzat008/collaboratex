import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import Main from "./pages/Main/Main";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Templates from "./pages/Templates";
import Login from "./pages/Login/Login";
import Signup from "./pages/Login/Signup";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/EditorPage/EditorPage";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App flex flex-col min-h-screen h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/editorpage" element={<EditorPage />} />
            <Route path="/features" element={<Features />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App


