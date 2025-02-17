import { useState } from 'react';
import axios from 'axios';
import validateEmail from './email_validate.js';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserCircle, Eye, EyeOff } from "lucide-react";

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check email validity
    if (validateEmail(email)) {
      setError('Please enter a valid email address ending with ku.edu.np');
      return;
    }

    // Reset error and prepare data
    setError('');
    const userData = { name, email, password, username };
    // console.log('Submitting data:', userData); // Debugging line

    try {
      await axios.post('http://localhost:5000/signup', userData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).then(response => {
        console.log('Response:', response); // Debugging line
        navigate('/login')
      })

      // console.log('Response:', response); // Debugging line
    } catch (error) {
      // console.error('Error submitting form:', error); // Debugging line
      setError('Error submitting form: ' + (error.response.data));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
              Full Name
            </label>
            <div className='relative mt-4'>
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              id="name"
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              />
            </div>
          </div>
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
              Username
            </label>
            <div className='relative mt-4'>
              <UserCircle className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              id="username"
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              />
              </div>
          </div>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
              Email Address
            </label>
            <div className="relative mt-4">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="email"
              id="email"
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <div className="mb-7">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2">
              Password
            </label>
            <div className="relative mt-4">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="w-full pl-10 pr-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
          >
            Sign Up
          </button>
        </form>
        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
