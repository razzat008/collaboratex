
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Templates from './pages/Templates';
import ProtectedRoutes from './components/ProtectedRoutes';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/templates" element={<Templates />} />

        {/* ProtectedRoutes  */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/project/:id" element={<Editor />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router >
  );
};

export default App;
