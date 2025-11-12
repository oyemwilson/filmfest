// inside App.js (or a new file AdminRoute.jsx)
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
