import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const ProfessorQuizzes = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/quizzes');
      setQuizzes(res.data.data.quizzes || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz and all its questions?')) return;
    setLoading(true);
    try {
      await api.delete(`/quizzes/${id}`);
      alert('Quiz deleted successfully.');
      await fetchQuizzes();
    } catch (err) {
      setError(err.message || 'Failed to delete quiz.');
      setLoading(false);
    }
  };

  const handlePublish = async (id, isPublishedValue) => {
    // Get questions count first
    setLoading(true);
    try {
      if (isPublishedValue) {
        // Fetch quiz details to verify at least one question exists
        const res = await api.get(`/quizzes/${id}`);
        const questionsCount = res.data.data.questions?.length || 0;
        if (questionsCount === 0) {
          setError('Cannot publish a quiz with 0 questions. Please add questions first.');
          setLoading(false);
          return;
        }
      }

      await api.patch(`/quizzes/${id}`, { isPublished: isPublishedValue });
      alert(isPublishedValue ? 'Quiz published successfully!' : 'Quiz unpublished successfully.');
      await fetchQuizzes();
    } catch (err) {
      setError(err.message || 'Failed to update quiz publication state.');
      setLoading(false);
    }
  };

  const now = new Date();
  const getFilteredQuizzes = () => {
    switch (activeTab) {
      case 'drafts':
        return quizzes.filter((q) => !q.isPublished);
      case 'published':
        return quizzes.filter((q) => q.isPublished);
      case 'upcoming':
        return quizzes.filter((q) => q.isPublished && new Date(q.startTime) > now);
      case 'completed':
        return quizzes.filter((q) => q.isPublished && new Date(q.endTime) < now);
      default:
        return quizzes;
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const filtered = getFilteredQuizzes();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Quiz Management</h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Create, configure, publish, and evaluate academic quizzes.
          </p>
        </div>
        <Link
          to="/professor/quizzes/create"
          className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors text-center"
        >
          Create New Quiz
        </Link>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {['all', 'drafts', 'published', 'upcoming', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setError('');
            }}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all capitalize ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 font-semibold">
          No quizzes found matching this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((quiz) => {
            const start = new Date(quiz.startTime);
            const end = new Date(quiz.endTime);
            const isUpcoming = now < start;
            const isExpired = now > end;

            return (
              <div key={quiz._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow text-left">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${
                      quiz.isPublished
                        ? isExpired
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : isUpcoming
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {quiz.isPublished ? (isExpired ? 'Completed' : isUpcoming ? 'Upcoming' : 'Active') : 'Draft'}
                    </span>
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
                    <div>
                      <span className="text-slate-400 block font-medium">Attempts Allowed:</span>
                      {quiz.attemptsAllowed}
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Passing Marks:</span>
                      {quiz.passingMarks} Marks
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-medium">Active Window:</span>
                      {start.toLocaleString()} - {end.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {!quiz.isPublished ? (
                    <>
                      <Button variant="primary" size="sm" onClick={() => handlePublish(quiz._id, true)}>
                        Publish
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/professor/quizzes/${quiz._id}/questions`)}>
                        Questions
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/professor/quizzes/${quiz._id}/edit`)}>
                        Edit Config
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/professor/quizzes/${quiz._id}/preview`)}>
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(quiz._id)}>
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handlePublish(quiz._id, false)}>
                        Unpublish
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/professor/quizzes/${quiz._id}/preview`)}>
                        View
                      </Button>
                      <Button variant="primary" size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={() => navigate(`/professor/quizzes/${quiz._id}/results`)}>
                        View Results
                      </Button>
                      <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(quiz._id)}>
                        Delete
                      </Button>
                    </>
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

export default ProfessorQuizzes;
