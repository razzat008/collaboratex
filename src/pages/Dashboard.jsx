import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('User logged out');
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-700 mb-6">
          Welcome to Your Dashboard
        </h1>
        <p className="text-center text-gray-600 mb-4">
          This is a simple dashboard. You can add more features here as needed.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/profile')}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
          >
            Profile
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-300"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
