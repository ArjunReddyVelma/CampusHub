import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const ProtectedRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // 1. If authentication state is loading: render LoadingSpinner.
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // 2. If user is not authenticated: redirect to /login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. If user.mustChangePassword === true:
  if (user && user.mustChangePassword) {
    // If current route !== /change-password: redirect to /change-password.
    if (location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
  } else if (user) {
    // 4. Otherwise (user.mustChangePassword === false):
    // If user with mustChangePassword === false visits /change-password, redirect to role dashboard.
    if (location.pathname === '/change-password') {
      const redirectMap = {
        student: '/student/dashboard',
        professor: '/professor/dashboard',
        club_admin: '/club/dashboard',
        judge: '/judge/dashboard',
        admin: '/admin/dashboard'
      };
      const targetPath = redirectMap[user.role] || '/login';
      return <Navigate to={targetPath} replace />;
    }
  }

  // Render protected content
  return <Outlet />;
};

export const RoleRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // 1. If authentication state is loading: render LoadingSpinner.
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // 2. If user is not authenticated: redirect to /login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. If user.mustChangePassword === true: redirect to /change-password.
  if (user && user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  // 4. If role mismatch: redirect to /unauthorized.
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. Otherwise render protected role content
  return <Outlet />;
};
