import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {


  const { isAuthenticated } = useAuth();

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-xl"><a href="/"> Collaboratex</a></div>
        <div className="flex items-center space-x-4">
          <a href="/features" className="text-gray-300 hover:text-white">Features and Benefits</a>
          <a href="/templates" className="text-gray-300 hover:text-white">Templates</a>

          {isAuthenticated ? (
            <a href="/dashboard" className="text-gray-300 hover:text-white">Project Dashboard</a>
          ) : null}

          {isAuthenticated ? (
            <a href="/editorpage" className="text-gray-300 hover:text-white">Editor</a>
          ) : null}


          {isAuthenticated ? (
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Sign Out
            </button>
          ) : (
            <>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2">
                Login
              </button>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;