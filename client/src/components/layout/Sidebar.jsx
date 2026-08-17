import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const getNavLinks = (role) => {
    switch (role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
          { name: 'Quizzes', path: '/student/quizzes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { name: 'Hackathons', path: '/student/hackathons', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }
        ];
      case 'professor':
        return [
          { name: 'Dashboard', path: '/professor/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
          { name: 'Quizzes', path: '/professor/quizzes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
        ];
      case 'club_admin':
        return [
          { name: 'Dashboard', path: '/club/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
          { name: 'My Club', path: '/club/profile', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { name: 'Hackathons', path: '/club/hackathons', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }
        ];
      case 'judge':
        return [
          { name: 'Dashboard', path: '/judge/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012 2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
          { name: 'Submissions', path: '/judge/submissions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' }
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012 2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
          { name: 'Club Approvals', path: '/admin/approvals', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks(user?.role);

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out border-r border-slate-800 lg:static lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-950">
          <span className="text-xl font-black text-emerald-400 tracking-tight">CampusHub</span>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-slate-800 focus:outline-none lg:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Card info */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-sm uppercase">
              {user?.name?.slice(0, 2) || 'CH'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-200">{user?.name}</p>
              <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <svg
                className="w-5 h-5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
              </svg>
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 rounded-lg transition-colors focus:outline-none"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
