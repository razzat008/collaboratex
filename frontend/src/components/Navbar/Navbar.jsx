import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-xl"><a href="/"> Collaboratex</a></div>
        <div className="flex items-center space-x-4">
          <a href="/editorpage" className="text-gray-300 hover:text-white">Editor</a>
          <a href="/features" className="text-gray-300 hover:text-white">Features and Benefits</a>
          <a href="/templates" className="text-gray-300 hover:text-white">Templates</a>

          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"><a href="/login">Login</a></button>
          <button className="bg-transparent hover:bg-gray-700 text-white px-4 py-2 rounded border border-white"><a href="/signup">Sign Up</a></button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;