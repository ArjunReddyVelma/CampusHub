import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        {/* Notifications Placeholder Entry */}
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none relative"
          aria-label="Notifications"
          onClick={() => alert('Notifications feature is coming next!')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        {/* Profile Settings / Security Entry */}
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
          aria-label="Profile Settings"
          onClick={() => navigate('/account/security')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <span className="h-6 w-px bg-slate-200"></span>

        {/* User profile quick status */}
        <div className="flex items-center text-left">
          <div className="hidden sm:block mr-3">
            <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 uppercase text-xs mr-3">
            {user?.name?.slice(0, 2) || 'CH'}
          </div>
        </div>

        {/* Logout Quick Button */}
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
          aria-label="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
