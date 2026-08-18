import React from 'react';
import { useAuth } from '../hooks/useAuth';
import useDocumentTitle from '../hooks/useDocumentTitle';

const JudgeDashboard = () => {
  const { user } = useAuth();
  useDocumentTitle('Judge Dashboard');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Judging Portal — {user?.name}
        </h1>
        <p className="mt-2 text-blue-100 font-medium text-sm md:text-base max-w-xl">
          Review hackathon project submissions assigned to you. Evaluate them on Innovation, Technical Execution, UI/UX, Impact, and Presentation criteria.
        </p>
      </div>

      <div className="p-8 bg-white border border-slate-100 shadow-sm rounded-xl text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Project Evaluation Desk</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          We are building the project details view, score sliders, and overall leaderboard ranking screens in the next phase!
        </p>
        <div className="mt-4 inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">
          Coming Next
        </div>
      </div>
    </div>
  );
};

export default JudgeDashboard;
