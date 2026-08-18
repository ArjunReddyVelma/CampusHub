import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/professor');
        setData(response.data.data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const stats = data?.statistics || {
    totalQuizzes: 0,
    activeQuizzes: 0,
    upcomingQuizzes: 0,
    completedQuizzes: 0,
    draftQuizzes: 0
  };

  const recentQuizzes = data?.quizzes || [];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md text-left">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Academic Console — Prof. {user?.name}
        </h1>
        <p className="mt-2 text-slate-300 font-medium text-sm md:text-base max-w-xl">
          Coordinate classrooms, manage digital quizzes, randomize questions, and track live student scores.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
          <div className="text-2xl font-black text-slate-800">{stats.totalQuizzes}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Quizzes</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
          <div className="text-2xl font-black text-emerald-600">{stats.activeQuizzes}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
          <div className="text-2xl font-black text-amber-600">{stats.upcomingQuizzes}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Upcoming</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
          <div className="text-2xl font-black text-slate-500">{stats.completedQuizzes}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left col-span-2 md:col-span-1">
          <div className="text-2xl font-black text-slate-400">{stats.draftQuizzes}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Drafts</div>
        </div>
      </div>

      {/* Recent Quizzes List Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Recent Quizzes Workspace</h2>
          <Link to="/professor/quizzes" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            View All Quiz Configurations
          </Link>
        </div>

        {recentQuizzes.length === 0 ? (
          <div className="py-6 text-center text-sm font-semibold text-slate-400">
            No quizzes created yet.{' '}
            <Link to="/professor/quizzes/create" className="text-emerald-600 font-bold hover:underline">
              Create your first quiz!
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentQuizzes.map((quiz) => (
              <div key={quiz._id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm font-semibold">
                <div>
                  <h3 className="text-slate-800 font-bold leading-tight">{quiz.title}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Duration: {quiz.duration} mins | Marks: {quiz.totalMarks} |{' '}
                    {quiz.isPublished ? 'Published' : 'Draft'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={quiz.isPublished ? `/professor/quizzes/${quiz._id}/results` : `/professor/quizzes/${quiz._id}/questions`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all text-center"
                  >
                    {quiz.isPublished ? 'View Results' : 'Manage Questions'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessorDashboard;
