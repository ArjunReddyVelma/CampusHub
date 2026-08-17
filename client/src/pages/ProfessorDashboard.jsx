import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProfessorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Academic Console — Prof. {user?.name}
        </h1>
        <p className="mt-2 text-slate-300 font-medium text-sm md:text-base max-w-xl">
          Coordinate your academic classrooms, create digital quizzes, edit assessment parameters, and evaluate student submission results.
        </p>
      </div>

      <div className="p-8 bg-white border border-slate-100 shadow-sm rounded-xl text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Quiz Creation & Student Analytics</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          We are building the quiz builder form, dynamic question creation tools, and class statistics dashboard interface in the next phase!
        </p>
        <div className="mt-4 inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">
          Coming Next
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
