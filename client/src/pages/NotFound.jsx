import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPath } from '../utils/roleRedirect';

const NotFound = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-3xl font-black text-slate-800 tracking-tight">404</h2>
      <p className="mt-1 text-slate-400 font-bold uppercase tracking-wider text-xs">Page Not Found</p>
      <p className="mt-3 text-sm text-slate-500 max-w-sm mx-auto">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6 flex items-center justify-center space-x-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus:outline-none"
        >
          Go Back
        </button>
        {isAuthenticated ? (
          <Link
            to={getDashboardPath(user.role)}
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors focus:outline-none"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            to="/"
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors focus:outline-none"
          >
            Home
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;
