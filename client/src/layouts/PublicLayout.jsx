import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Public Navbar header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-emerald-600 tracking-tight">
            CampusHub
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main context layout */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>

      {/* Footer copyright */}
      <footer className="py-6 border-t border-slate-100 bg-white text-center">
        <p className="text-xs font-semibold text-slate-400">
          &copy; {new Date().getFullYear()} CampusHub. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default PublicLayout;
