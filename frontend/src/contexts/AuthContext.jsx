// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

  const [authToken, setAuthToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('admin_key') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Save token to state and localStorage
  const saveAuthToken = (token) => {
    setAuthToken(token);
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  // Save admin key to state and localStorage
  const saveAdminKey = (key) => {
    setAdminKey(key);
    if (key) {
      localStorage.setItem('admin_key', key);
    } else {
      localStorage.removeItem('admin_key');
    }
  };

  // Get authentication headers for API calls
  const getAuthHeaders = (withContentType = false) => {
    const headers = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else if (adminKey) {
      headers['x-admin-key'] = adminKey;
    }
    
    if (withContentType && Object.keys(headers).length > 0) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  };

  // Check if user is authenticated
  const isAuthenticated = () => !!authToken || !!adminKey;

  // Fetch current user data
  const fetchCurrentUser = async () => {
    if (!authToken) {
      setCurrentUser(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { 
        headers: getAuthHeaders() 
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user || data);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      setCurrentUser(null);
      console.error('Failed to fetch user:', error);
    }
  };

  // Login function
// In your AuthContext.jsx - update the login function:
const login = async (email, password) => {
  setLoading(true);
  setMessage('');
  
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    saveAuthToken(data.token);
    setCurrentUser(data.user || null);
    setMessage('Login successful!');
    return { success: true };
  } catch (error) {
    setMessage(error.message);
    return { success: false, error: error.message };
  } finally {
    setLoading(false);
  }
};

  // Logout function
  const logout = () => {
    saveAuthToken('');
    saveAdminKey('');
    setCurrentUser(null);
    setMessage('Logged out successfully');
  };

  // Clear all authentication
  const clearAllAuth = () => {
    logout();
    setMessage('Cleared all authentication data');
  };

  // Fetch current user when token changes
  useEffect(() => {
    if (authToken) {
      fetchCurrentUser();
    } else {
      setCurrentUser(null);
    }
  }, [authToken]);

  const value = {
    authToken,
    adminKey,
    currentUser,
    loading,
    message,
    isAuthenticated: isAuthenticated(),
    saveAuthToken,
    saveAdminKey,
    getAuthHeaders,
    login,
    logout,
    clearAllAuth,
    setMessage,
    setLoading,
    API_BASE
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};