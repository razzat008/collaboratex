import React, { createContext, useState, useEffect, useContext } from 'react';

// Create AuthContext
const AuthContext = createContext();

const getTokenFromCookie = () => {
  try {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find((cookie) => cookie.trim().startsWith('Authorization='));
    if (authCookie) {
      const rawValue = authCookie.split('=')[1]; // Extract token
      return decodeURIComponent(rawValue.replace('Bearer ', '')); // Remove "Bearer " and decode
    }
    return null;
  } catch (error) {
    console.error('Error extracting token:', error);
    return null;
  }
};

const decodeJWT = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode payload
    return payload.username; // Extract email or username
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);

  // Check Authentication
  const checkAuth = () => {
    const extractedToken = getTokenFromCookie();
    if (extractedToken) {
      setIsAuthenticated(true);
      setToken(extractedToken);
      const extractedUsername = decodeJWT(extractedToken);
      setUsername(extractedUsername);
      console.log('User Authenticated as:', extractedUsername);
    } else {
      setIsAuthenticated(false);
      setToken(null);
      setUsername(null);
      console.warn('No valid token found in Authorization cookie.');
    }
  };

  // Run checkAuth when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, username, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
