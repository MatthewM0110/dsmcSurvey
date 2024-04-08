import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import React, {  useEffect } from 'react';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    // User is not logged in
    return <Navigate to="/login" />;
  } else if (roles && !roles.includes(user.role)) {
    // User does not have the required role
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
