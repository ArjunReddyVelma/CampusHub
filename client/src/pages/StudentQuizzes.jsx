import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const StudentQuizzes = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [quizzesRes, attemptsRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/attempts')
      ]);
      setQuizzes(quizzesRes.data.data.quizzes || []);
      setAttempts(attemptsRes.data.data.attempts || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve assessment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartAttempt = async (quizId) => {
    try {
      const response = await api.post(`/quizzes/${quizId}/attempts`);
      const attempt = response.data.data.attempt;
      navigate(`/student/attempts/${attempt._id}`);
    } catch (err) {
      setError(err.message || 'Failed to initiate quiz session');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Academic Quizzes</h1>
        <p className="text-slate-400 font-medium text-xs mt-1">
          Review, start, or check scores for your class assessments.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {quizzes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 font-semibold">
          No published quizzes are currently registered in your department.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const now = new Date();
            const start = new Date(quiz.startTime);
            const end = new Date(quiz.endTime);
            const isUpcoming = now < start;
            const isExpired = now > end;
            const isRunning = now >= start && now <= end;

            // Find attempts matching this quiz
            const quizAttempts = attempts.filter((att) => att.quiz?._id === quiz._id);
            const hasActive = quizAttempts.some((att) => att.status === 'in_progress');
            const hasSubmitted = quizAttempts.some((att) => att.status === 'submitted' || att.status === 'expired');
            const completedAttempt = quizAttempts.find((att) => att.status === 'submitted' || att.status === 'expired');

            let statusBadge = (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide rounded-full">
                Active
              </span>
            );
            if (isUpcoming) {
              statusBadge = (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold uppercase tracking-wide rounded-full">
                  Upcoming
                </span>
              );
            } else if (isExpired) {
              statusBadge = (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase tracking-wide rounded-full">
                  Closed
                </span>
              );
            }

            return (
              <div key={quiz._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow text-left">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {statusBadge}
                    {hasSubmitted && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wide rounded-full">
                        Graded
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">{quiz.title}</h3>
                    <p className="text-slate-400 text-xs font-semibold mt-1">
                      {quiz.description || 'No description provided.'}
                    </p>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                    <div>
                      <span className="text-slate-400 block font-medium">Duration:</span>
                      {quiz.duration} Minutes
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Total Marks:</span>
                      {quiz.totalMarks} Marks
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-medium">Active Window:</span>
                      {start.toLocaleString()} - {end.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {hasSubmitted && completedAttempt ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/student/results/${completedAttempt._id}`)}
                    >
                      View Scorecard
                    </Button>
                  ) : hasActive ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-sky-600 hover:bg-sky-700"
                      onClick={() => handleStartAttempt(quiz._id)}
                    >
                      Resume Quiz
                    </Button>
                  ) : isRunning ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartAttempt(quiz._id)}
                    >
                      Start Quiz
                    </Button>
                  ) : isUpcoming ? (
                    <span className="text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                      Starts {start.toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      Session Finished
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentQuizzes;
