import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'; // Replace with actual check

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
