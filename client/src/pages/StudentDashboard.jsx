import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/student');
        setData(response.data.data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen={false} size="lg" />;
  }

  const profile = data?.profile || { xp: 0, points: 0, badges: [], department: '', year: 1 };
  const activeQuizzes = data?.activeQuizzes || [];
  const upcomingQuizzes = data?.upcomingQuizzes || [];

  return (
    <div className="space-y-6">
      {/* Header section card welcome */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-md text-left">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="mt-2 text-emerald-100 font-medium text-sm md:text-base max-w-xl">
          Here is your digital student center. You are registered in the **{profile.department}** department (Year {profile.year}).
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Overview status containers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-2xl font-black text-slate-800">{profile.xp}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience Points (XP)</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-2xl font-black text-slate-800">{profile.points}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Coins</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-sky-50 text-sky-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-2xl font-black text-slate-800">{profile.badges.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Achievements</div>
          </div>
        </div>
      </div>

      {/* Quizzes overview sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Quizzes */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5 animate-pulse"></span>
            Active Quiz Sessions
          </h2>
          {activeQuizzes.length === 0 ? (
            <p className="text-sm font-semibold text-slate-400">No quizzes are currently running.</p>
          ) : (
            <div className="space-y-4">
              {activeQuizzes.map((quiz) => (
                <div key={quiz._id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{quiz.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Duration: {quiz.duration} mins | Marks: {quiz.totalMarks}</p>
                  </div>
                  <Link
                    to={`/student/quizzes`}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  >
                    Start Attempt
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Quizzes */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2.5"></span>
            Upcoming Academic Quizzes
          </h2>
          {upcomingQuizzes.length === 0 ? (
            <p className="text-sm font-semibold text-slate-400">No upcoming quizzes scheduled.</p>
          ) : (
            <div className="space-y-4">
              {upcomingQuizzes.map((quiz) => (
                <div key={quiz._id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-800">{quiz.title}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Starts: {new Date(quiz.startTime).toLocaleString()} | Duration: {quiz.duration} mins
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
