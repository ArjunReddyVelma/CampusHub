import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Access Denied</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
        You are not authorized to view this workspace. Your role does not have the required permissions.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex justify-center px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors focus:outline-none"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default Unauthorized;
