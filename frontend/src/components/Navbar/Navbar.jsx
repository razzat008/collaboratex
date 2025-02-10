import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Navbar() {


  const { isAuthenticated, username, profilePic, checkAuth } = useAuth();
  const navigate = useNavigate(); 

  const handleLogout = () => {
    // Clear the Authorization cookie by setting an expired date
    document.cookie = "Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Re-run authentication check
    checkAuth();
    navigate('/');
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-xl"><a href="/"> Collaboratex</a></div>
        <div className="flex items-center space-x-4">

          {!isAuthenticated ? (
            <a href="/features" className="text-gray-300 hover:text-white">Features and Benefits</a>
          ) : null}

          
          <a href="/templates" className="text-gray-300 hover:text-white">Templates</a>

          {isAuthenticated ? (
            <a href="/dashboard" className="text-gray-300 hover:text-white">Project Dashboard</a>
          ) : null}

          {isAuthenticated ? (
            <a href="/editorpage" className="text-gray-300 hover:text-white">Editor</a>
          ) : null}


          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
            <img
              src="src/assets/avataaars.png"
              alt="Profile"
              className="w-10 h-11"
            />
              <span className="text-gray-300 hover:text-white">{username}</span>
          
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded" onClick={handleLogout}>
              Sign Out
              </button>
              </div>
          ) : (
            <>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2">
                <a href="/login">Login</a>
              </button>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                <a href="/signup">Sign Up</a>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;