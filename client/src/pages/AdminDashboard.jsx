import React from 'react';

const AdminDashboard = () => {

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-700 to-rose-800 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Admin Control Center
        </h1>
        <p className="mt-2 text-rose-100 font-medium text-sm md:text-base max-w-xl">
          System Administration panel. Moderate user status, approve new university clubs, manage security alerts, and track system statistics.
        </p>
      </div>

      <div className="p-8 bg-white border border-slate-100 shadow-sm rounded-xl text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">System Controls & Moderation Tools</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          We are building the club moderation list, user status toggle switches, and full-scale analytics widgets in the next phase!
        </p>
        <div className="mt-4 inline-block px-3 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">
          Coming Next
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
