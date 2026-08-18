import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/roleRedirect';

const PublicNavbar = () => {
  const { isAuthenticated, user, loading } = useAuth();

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-emerald-600 tracking-tight flex items-center">
          <svg className="w-8 h-8 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          CampusHub
        </Link>
        <nav className="flex items-center space-x-6">
          <Link
            to="/"
            className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
          >
            Home
          </Link>
          {!loading && isAuthenticated ? (
            <Link
              to={getDashboardPath(user.role)}
              className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default PublicNavbar;
