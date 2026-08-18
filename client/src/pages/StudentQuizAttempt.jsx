import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const StudentQuizAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: [selectedIndices] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitTriggeredRef = useRef(false);

  // Unified submission helper
  const handleSubmission = useCallback(async (answersMap = selectedAnswers) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answersPayload = Object.keys(answersMap).map((qId) => ({
        question: qId,
        selectedAnswers: answersMap[qId]
      }));

      await api.post(`/attempts/${id}/submit`, { answers: answersPayload });
      navigate(`/student/results/${id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit quiz attempt.');
      setSubmitting(false);
    }
  }, [id, navigate, selectedAnswers, submitting]);

  // 1. Fetch initial attempt and quiz questions data
  useEffect(() => {
    const fetchAttemptData = async () => {
      try {
        const attemptRes = await api.get(`/attempts/${id}`);
        const attemptData = attemptRes.data.data.attempt;
        setAttempt(attemptData);

        const quizRes = await api.get(`/quizzes/${attemptData.quiz._id}`);
        setQuiz(quizRes.data.data.quiz);
        setQuestions(quizRes.data.data.questions || []);

        // Initialize selected answers map if resuming
        const initialAnswers = {};
        if (attemptData.answers && Array.isArray(attemptData.answers)) {
          attemptData.answers.forEach((ans) => {
            initialAnswers[ans.question] = ans.selectedAnswers || [];
          });
        }
        setSelectedAnswers(initialAnswers);

        // Calculate initial time left
        const now = new Date().getTime();
        const started = new Date(attemptData.startedAt).getTime();
        const durationMs = attemptData.quiz.duration * 60 * 1000;
        const elapsed = now - started;
        const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
        setTimeLeft(remaining);
      } catch (err) {
        setError(err.message || 'Failed to retrieve active quiz configuration.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttemptData();
  }, [id]);

  // 2. Countdown timer interval logic
  useEffect(() => {
    if (loading || !attempt || timeLeft <= 0 || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!autoSubmitTriggeredRef.current) {
            autoSubmitTriggeredRef.current = true;
            handleSubmission();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, attempt, timeLeft, submitting, handleSubmission]);

  if (loading) {
    return <LoadingSpinner fullScreen={true} size="lg" />;
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white border border-slate-100 shadow-xl rounded-xl p-8 text-center">
        <ErrorMessage message={error || 'Could not load quiz details'} />
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/quizzes')}>
          Return to Quizzes
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentSelection = selectedAnswers[currentQuestion._id] || [];

  const handleOptionChange = (optionIndex, isCheckbox = false) => {
    setSelectedAnswers((prev) => {
      const currentList = prev[currentQuestion._id] || [];
      let updatedList = [];

      if (isCheckbox) {
        if (currentList.includes(optionIndex)) {
          updatedList = currentList.filter((idx) => idx !== optionIndex);
        } else {
          updatedList = [...currentList, optionIndex].sort((a, b) => a - b);
        }
      } else {
        updatedList = [optionIndex];
      }

      const newMap = {
        ...prev,
        [currentQuestion._id]: updatedList
      };

      return newMap;
    });
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 60; // Less than 1 minute

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main Question Display console */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 text-left">
          <div className="flex items-center justify-between mb-6">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold rounded-full">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Marks: {currentQuestion.marks}
            </span>
          </div>

          <h2 className="text-lg font-black text-slate-800 leading-snug">
            {currentQuestion.text}
          </h2>

          <div className="mt-8 space-y-4">
            {currentQuestion.options.map((option, idx) => {
              const isChecked = currentSelection.includes(idx);
              const isCheckbox = currentQuestion.type === 'multiple_correct';

              return (
                <div
                  key={idx}
                  onClick={() => handleOptionChange(idx, isCheckbox)}
                  className={`flex items-center px-5 py-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type={isCheckbox ? 'checkbox' : 'radio'}
                    name={`q-${currentQuestion._id}`}
                    checked={isChecked}
                    onChange={() => {}} // handled by div click
                    className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                  />
                  <span className="ml-4 text-sm font-semibold text-slate-700">
                    {option}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation bottom bar controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentIndex === 0 || submitting}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
          >
            Previous
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              variant="primary"
              loading={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleSubmission()}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={submitting}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
            >
              Next Question
            </Button>
          )}
        </div>
      </div>

      {/* Sidebar with Timer and Questions Grid tracker */}
      <div className="space-y-6">
        {/* Timer Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Time Remaining
          </div>
          <div
            className={`text-3xl font-black font-mono tracking-tight transition-colors duration-300 ${
              isLowTime ? 'text-rose-600 animate-pulse' : 'text-slate-800'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          {isLowTime && (
            <p className="text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-wide">
              Hurry up! Auto-submitting soon.
            </p>
          )}
        </div>

        {/* Question status grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Questions Navigator
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q._id] && selectedAnswers[q._id].length > 0;
              const isActive = idx === currentIndex;

              let buttonClass = 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100';
              if (isAnswered) {
                buttonClass = 'bg-emerald-600 text-white border border-transparent';
              }
              if (isActive) {
                buttonClass += ' ring-2 ring-emerald-500 ring-offset-2';
              }

              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  disabled={submitting}
                  className={`h-10 w-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all focus:outline-none ${buttonClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center">
              <span className="h-2.5 w-2.5 rounded bg-emerald-600 mr-2"></span>
              Answered
            </span>
            <span className="flex items-center">
              <span className="h-2.5 w-2.5 rounded bg-slate-50 border border-slate-100 mr-2"></span>
              Unanswered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizAttempt;
