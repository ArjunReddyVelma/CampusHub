import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPath } from '../utils/roleRedirect';

const Welcome = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // If already authenticated, redirect straight to their dashboard
  if (isAuthenticated && !loading) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  const features = [
    {
      title: 'University Quizzes',
      desc: 'Participate in assessments conducted by professors with automatic grading, strict durations, and negative marking check parameters.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
    },
    {
      title: 'Hackathons & Competitions',
      desc: 'Compete in club-hosted hackathons, solve real-world problems, pitch solutions, and win exciting prizes.',
      color: 'bg-teal-50 text-teal-600 border-teal-100',
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
    },
    {
      title: 'Student Teams',
      desc: 'Form teams, invite peers, manage pending invitations, and collaborate securely on submission builds.',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    {
      title: 'Project Submissions',
      desc: 'Submit repository URLs and video presentations. Get scored against Innovation, Technical, UI/UX, and Impact rubrics by assigned judges.',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
    },
    {
      title: 'Announcements',
      desc: 'Stay informed with real-time global announcements, department news, or notifications scoped specifically to your clubs.',
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
    },
    {
      title: 'Achievements',
      desc: 'Track experience points (XP) metrics, collect badges for completing assignments, and top the university leaderboards.',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
    }
  ];

  return (
    <div className="max-w-5xl w-full text-center space-y-12 py-10">
      {/* Hero Header */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
          Centralized University Activities & Assessments
        </h1>
        <p className="text-slate-500 font-medium text-base md:text-lg">
          Connect with clubs, take online assessments, build projects in hackathons, and monitor grading metrics in one cohesive platform.
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

      {/* Feature Showcase Grid - 6 Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat) => (
          <div key={feat.title} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 ${feat.color}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feat.icon} />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">{feat.title}</h3>
            <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Welcome;
