import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Welcome = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // If already authenticated, redirect straight to their dashboard
  if (isAuthenticated && !loading) {
    const redirectMap = {
      student: '/student/dashboard',
      professor: '/professor/dashboard',
      club_admin: '/club/dashboard',
      judge: '/judge/dashboard',
      admin: '/admin/dashboard'
    };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  return (
    <div className="max-w-4xl w-full text-center space-y-12 py-10">
      {/* Hero Header */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none">
          Centralized University Activities & Assessments
        </h1>
        <p className="text-slate-500 font-medium text-base md:text-lg">
          Connect with clubs, take online assessments, build projects in hackathons, and monitor grading metrics in real-time.
        </p>
        <div className="pt-4 flex items-center justify-center space-x-4">
          <Link
            to="/login"
            className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors"
          >
            Sign In to Workspace
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
          >
            Register Student/Prof
          </Link>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">Academic Quizzes</h3>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Take online quizzes conducted by university professors. Automatic evaluation, scores, and real-time timers.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left">
          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">Club Hackathons</h3>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Register and create code development teams, submit repositories, showcase project video demos, and compete with peers.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 112-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">Peer Evaluations</h3>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Panel judging scoring system evaluating Innovation, Technical complexities, presentation video, and code clarity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
