import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />

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
