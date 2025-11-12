// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { 
    login, 
    currentUser, 
    logout, 
    message, 
    loading,
    isAuthenticated 
  } = useAuth();

  const navigate = useNavigate();
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Redirect to admin panel if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const result = await login(loginForm.email, loginForm.password);
    
    // If login was successful, redirect to admin panel
    if (result.success) {
      navigate('/admin');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearLoginForm = () => {
    setLoginForm({ email: '', password: '' });
  };

  // If already authenticated, show a redirect message
  if (isAuthenticated) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            Already Logged In
          </h2>
          <p className="text-green-600 mb-4">
            Redirecting to admin panel...
          </p>
          <button 
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Go to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('successful') || message.includes('Login') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-lg font-semibold mb-4">Admin Login</h2>
        
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={loginForm.email}
              onChange={handleInputChange}
              placeholder="admin@example.com"
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={loginForm.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <button
              type="button"
              onClick={clearLoginForm}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}