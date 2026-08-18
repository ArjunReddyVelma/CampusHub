import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const StudentQuizResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResultData = async () => {
      try {
        const attemptRes = await api.get(`/attempts/${id}`);
        const attemptData = attemptRes.data.data.attempt;
        setAttempt(attemptData);

        // Fetch questions metadata only if scorecard outputs are exposed
        if (attemptData.quiz.showResultsImmediately !== false) {
          const quizRes = await api.get(`/quizzes/${attemptData.quiz._id}`);
          setQuestions(quizRes.data.data.questions || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve scorecard details');
      } finally {
        setLoading(false);
      }
    };
    fetchResultData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!attempt) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white border border-slate-100 shadow-xl rounded-xl p-8 text-center">
        <ErrorMessage message={error || 'Could not load result details'} />
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/quizzes')}>
          Return to Quizzes
        </Button>
      </div>
    );
  }

  const quiz = attempt.quiz;
  const isResultsHidden = quiz.showResultsImmediately === false;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Overview Score Card Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center relative overflow-hidden">
        {/* Decorative corner background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-12 -translate-y-12"></div>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
          Quiz Assessment Scorecard
        </span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1 mb-6">
          {quiz.title}
        </h1>

        {isResultsHidden ? (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Answers Logged Safely</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your responses have been successfully submitted and evaluated. The instructor has configured this quiz to release score grades at a later date.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              <div className="text-6xl font-black text-emerald-600 tracking-tight">
                {attempt.score}
                <span className="text-2xl text-slate-400 font-bold">/{quiz.totalMarks}</span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">Final Grade</p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              {attempt.isPassed ? (
                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold uppercase tracking-wider">
                  PASSED
                </span>
              ) : (
                <span className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-sm font-bold uppercase tracking-wider">
                  FAILED
                </span>
              )}
            </div>

            <div className="max-w-xs mx-auto grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
              <div>
                <span className="text-slate-400 block font-medium">Passing Score:</span>
                {quiz.passingMarks} Marks
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status:</span>
                {attempt.status}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center">
          <Link
            to="/student/quizzes"
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus:outline-none"
          >
            Back to Quizzes
          </Link>
        </div>
      </div>

      {/* Answers review section if allowed */}
      {!isResultsHidden && questions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-black text-slate-800 text-left">Questions Review</h2>
          {questions.map((q, idx) => {
            const studentAnswers = attempt.answers?.find((ans) => ans.question === q._id)?.selectedAnswers || [];
            
            // Note: Since student fetched quiz details, correct answers are hidden from the frontend
            // so we cannot show a direct ticks list unless the professor allows it or we fetch completed attempt questions metadata
            // Let's list student choices.
            return (
              <div key={q._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>Question {idx + 1}</span>
                  <span>Marks: {q.marks}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800">{q.text}</h3>

                <div className="space-y-2">
                  {q.options.map((option, optIdx) => {
                    const isSelected = studentAnswers.includes(optIdx);
                    
                    let cardClass = 'border-slate-200 bg-slate-50/20';
                    if (isSelected) {
                      cardClass = 'border-emerald-200 bg-emerald-50/10 text-emerald-800';
                    }

                    return (
                      <div key={optIdx} className={`px-4 py-2.5 border rounded-lg text-xs font-semibold flex items-center ${cardClass}`}>
                        <span className={`h-2 w-2 rounded-full mr-3 ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        {option}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentQuizResult;
