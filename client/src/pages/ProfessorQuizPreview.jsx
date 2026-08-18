import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const ProfessorQuizPreview = () => {
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await api.get(`/quizzes/${id}`);
      setQuiz(res.data.data.quiz);
      setQuestions(res.data.data.questions || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve quiz details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Quiz Instructor Preview
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

      {questions.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
          This quiz does not contain any questions. Please add questions to preview.
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Question {idx + 1} ({q.type?.replace('_', ' ')?.toUpperCase()})</span>
                <span>Marks: {q.marks}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-800 leading-snug">{q.text}</h3>

              <div className="space-y-2">
                {q.options.map((option, optIdx) => {
                  const isCorrect = q.correctAnswers?.includes(optIdx);

                  return (
                    <div
                      key={optIdx}
                      className={`px-4 py-2.5 border rounded-lg text-xs font-semibold flex items-center justify-between ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/10 text-emerald-800'
                          : 'border-slate-100 bg-slate-50/20 text-slate-600'
                      }`}
                    >
                      <span className="flex items-center">
                        <span className={`h-2.5 w-2.5 rounded-full mr-3 ${isCorrect ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        {option}
                      </span>
                      {isCorrect && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessorQuizPreview;
