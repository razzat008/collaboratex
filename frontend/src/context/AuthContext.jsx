import React, { createContext, useState, useEffect, useContext } from 'react';

// Create AuthContext
const AuthContext = createContext();

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);

  // Function to extract token from Authorization cookie
  const getTokenFromCookie = () => {
    try {
      const cookies = document.cookie.split(';'); // Split all cookies
      const authCookie = cookies.find((cookie) => cookie.trim().startsWith('Authorization=')); // Find Authorization cookie
      if (authCookie) {
        const rawValue = authCookie.split('=')[1]; // Get value after "="
        const token = decodeURIComponent(rawValue.replace('Bearer ', '')); // Remove "Bearer " and decode
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error extracting token:', error);
      return null;
    }
  };

  // Check Authentication
  const checkAuth = () => {
    const extractedToken = getTokenFromCookie();
    if (extractedToken) {
      setIsAuthenticated(true);
      setToken(extractedToken);
      console.log('User Authenticated!');
    } else {
      setIsAuthenticated(false);
      setToken(null);
      console.warn('No valid token found in Authorization cookie.');
    }
  };

  // Run checkAuth when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
