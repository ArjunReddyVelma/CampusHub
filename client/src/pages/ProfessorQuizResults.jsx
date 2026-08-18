import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const ProfessorQuizResults = () => {
  const { id } = useParams(); // Quiz ID

  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResults = useCallback(async () => {
    try {
      const [quizRes, attemptsRes] = await Promise.all([
        api.get(`/quizzes/${id}`),
        api.get(`/quizzes/${id}/attempts`)
      ]);
      setQuiz(quizRes.data.data.quiz);
      setAttempts(attemptsRes.data.data.attempts || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve quiz attempts.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Quiz Submissions & Attempts
          </h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Quiz: <span className="text-emerald-600 font-bold">{quiz?.title}</span>
          </p>
        </div>
        <Link to="/professor/quizzes" className="text-xs font-bold text-slate-400 hover:text-slate-600">
          Back to Quizzes
        </Link>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {attempts.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 font-semibold">
          No students have attempted this quiz yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-bold uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-4">Student</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Score</th>
                  <th scope="col" className="px-6 py-4">Percentage</th>
                  <th scope="col" className="px-6 py-4">Verdict</th>
                  <th scope="col" className="px-6 py-4">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {attempts.map((att) => {
                  const percent = quiz?.totalMarks > 0 ? ((att.score / quiz.totalMarks) * 100).toFixed(1) : '0';
                  
                  return (
                    <tr key={att._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-slate-800 leading-tight">{att.student?.name || 'Unknown Student'}</p>
                          <p className="text-xs text-slate-400 font-medium">{att.student?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          att.status === 'submitted'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : att.status === 'expired'
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-800">
                        {att.score} / {quiz?.totalMarks}
                      </td>
                      <td className="px-6 py-4 text-slate-800">
                        {percent}%
                      </td>
                      <td className="px-6 py-4">
                        {att.isPassed ? (
                          <span className="text-xs text-emerald-600 font-bold uppercase">Pass</span>
                        ) : (
                          <span className="text-xs text-rose-600 font-bold uppercase">Fail</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-semibold">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'In Progress'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorQuizResults;
