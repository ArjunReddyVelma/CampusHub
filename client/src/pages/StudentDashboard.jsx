import React from 'react';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header section card welcome */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="mt-2 text-emerald-100 font-medium text-sm md:text-base max-w-xl">
          Here is your digital student center. Ready to check announcements, take scheduled quizzes, or sign up for live hackathons?
        </p>
      </div>

      {/* Overview status containers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">120</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience Points (XP)</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">45</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Coins</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-sky-50 text-sky-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">3</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Achievements</div>
          </div>
        </div>
      </div>

      {/* Main card info area */}
      <div className="p-8 bg-white border border-slate-100 shadow-sm rounded-xl text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Activities & Quizzes Workspace</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          We are building your interactive quiz taking dashboard, live hackathon listing, and team invitation details screen in the next phase!
        </p>
        <div className="mt-4 inline-block px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">
          Coming Next
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
