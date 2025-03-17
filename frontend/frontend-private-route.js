// frontend/src/components/auth/PrivateRoute.js
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useContext(AuthContext);
  
  if (loading) {
    return <Spinner />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
    return <Navigate to="/" replace />;
  }
  
  return children ? children : <Outlet />;
};

export default PrivateRoute;
