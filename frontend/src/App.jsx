import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Main from "./components/Main/Main";

import Features from "./pages/Features";
import Templates from "./pages/Templates";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/EditorPage";
import { Edit } from "lucide-react";

function App() {
  return (
    <Router>
    <div className="App flex flex-col min-h-screen">
    <Navbar />
    <div className="flex-grow">
    <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          
          <Route path="/editorpage" element={<PrivateRoute><EditorPage /></PrivateRoute>} /> {/*makind dashboard and editorpage private*/}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

          <Route path="/features" element={<Features />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/*catching all the route to redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
    </div>
      <Footer />
    </div>
    </Router>
  )
}

export default App


