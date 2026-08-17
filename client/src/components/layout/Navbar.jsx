import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
      <div className="flex items-center">
        {/* Mobile sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="p-1 -ml-1 mr-3 rounded-lg hover:bg-slate-100 focus:outline-none lg:hidden"
          aria-label="Open sidebar"
        >
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Dynamic Context Header text */}
        <h2 className="text-lg font-bold text-slate-800 tracking-tight capitalize">
          Workspace
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* User profile quick status */}
        <div className="flex items-center text-left">
          <div className="hidden sm:block mr-3">
            <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
            <div className="text-xs text-slate-400 font-medium">{user?.email}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 uppercase text-xs">
            {user?.name?.slice(0, 2) || 'CH'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
