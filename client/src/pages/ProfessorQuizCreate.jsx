import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ProfessorQuizCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [totalMarks, setTotalMarks] = useState('20');
  const [passingMarks, setPassingMarks] = useState('10');
  const [attemptsAllowed, setAttemptsAllowed] = useState('1');
  
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkPercent, setNegativeMarkPercent] = useState('0');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);

  // Load existing quiz details if in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchQuizDetails = async () => {
      try {
        const res = await api.get(`/quizzes/${id}`);
        const quiz = res.data.data.quiz;

        setTitle(quiz.title || '');
        setDescription(quiz.description || '');
        setDuration(quiz.duration?.toString() || '30');
        setTotalMarks(quiz.totalMarks?.toString() || '20');
        setPassingMarks(quiz.passingMarks?.toString() || '10');
        setAttemptsAllowed(quiz.attemptsAllowed?.toString() || '1');
        setNegativeMarking(!!quiz.negativeMarking);
        setNegativeMarkPercent(quiz.negativeMarkPercent?.toString() || '0');
        setRandomizeQuestions(!!quiz.randomizeQuestions);
        setRandomizeOptions(!!quiz.randomizeOptions);
        setShowResultsImmediately(!!quiz.showResultsImmediately);
        setShowCorrectAnswers(!!quiz.showCorrectAnswers);

        // Format dates to fit input datetime-local tag schema (yyyy-MM-ddThh:mm)
        if (quiz.startTime) {
          setStartTime(new Date(quiz.startTime).toISOString().slice(0, 16));
        }
        if (quiz.endTime) {
          setEndTime(new Date(quiz.endTime).toISOString().slice(0, 16));
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve quiz details.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizDetails();
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Validation Checks ---
    const durNum = Number(duration);
    const totNum = Number(totalMarks);
    const passNum = Number(passingMarks);
    const attNum = Number(attemptsAllowed);
    const negPercentNum = Number(negativeMarkPercent);

    if (!title || !startTime || !endTime) {
      setError('Please fill in all required fields.');
      return;
    }

    if (durNum <= 0) {
      setError('Duration must be at least 1 minute.');
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time.');
      return;
    }

    if (passNum > totNum) {
      setError('Passing marks cannot exceed total marks.');
      return;
    }

    if (attNum < 1) {
      setError('Attempts allowed must be at least 1.');
      return;
    }

    if (negativeMarking && (negPercentNum < 0 || negPercentNum > 100)) {
      setError('Negative mark percent must be between 0 and 100.');
      return;
    }

    setSubmitting(true);
    const payload = {
      title,
      description,
      duration: durNum,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalMarks: totNum,
      passingMarks: passNum,
      attemptsAllowed: attNum,
      negativeMarking,
      negativeMarkPercent: negativeMarking ? negPercentNum : 0,
      randomizeQuestions,
      randomizeOptions,
      showResultsImmediately,
      showCorrectAnswers
    };

    try {
      if (isEditMode) {
        await api.patch(`/quizzes/${id}`, payload);
        alert('Quiz updated successfully.');
      } else {
        await api.post('/quizzes', payload);
        alert('Quiz created successfully.');
      }
      navigate('/professor/quizzes');
    } catch (err) {
      setError(err.message || 'Failed to save quiz configurations.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          {isEditMode ? 'Edit Quiz Config' : 'Create Academic Quiz'}
        </h1>
        <p className="text-slate-400 font-medium text-xs mt-1">
          Configure timings, attempts parameters, and evaluation behaviors.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-4">
          <Input
            label="Quiz Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            required
            placeholder="Introduction to Algorithms - Midterm"
          />

          <div className="flex flex-col text-left">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="Provide basic instructions for the students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows="3"
            />
          </div>

          {/* Times and Durations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={submitting}
                required
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={submitting}
                required
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            <Input
              label="Duration (Minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={submitting}
              required
              min="1"
            />
          </div>

          {/* Marks and Attempts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Total Marks"
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              disabled={submitting}
              required
              min="1"
            />
            <Input
              label="Passing Marks"
              type="number"
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              disabled={submitting}
              required
              min="1"
            />
            <Input
              label="Attempts Allowed"
              type="number"
              value={attemptsAllowed}
              onChange={(e) => setAttemptsAllowed(e.target.value)}
              disabled={submitting}
              required
              min="1"
            />
          </div>

          <hr className="border-slate-100" />

          {/* Negative marking parameters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="negativeMarking"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                disabled={submitting}
                className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="negativeMarking" className="text-sm font-bold text-slate-700 select-none">
                Enable Negative Marking
              </label>
            </div>

            {negativeMarking && (
              <div className="max-w-xs pl-7">
                <Input
                  label="Negative Mark Percentage (%)"
                  type="number"
                  value={negativeMarkPercent}
                  onChange={(e) => setNegativeMarkPercent(e.target.value)}
                  disabled={submitting}
                  min="0"
                  max="100"
                />
              </div>
            )}
          </div>

          {/* Layout and Options Randomizations Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="randomizeQuestions"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
                disabled={submitting}
                className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="randomizeQuestions" className="text-sm font-bold text-slate-700 select-none">
                Randomize Questions Layout
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="randomizeOptions"
                checked={randomizeOptions}
                onChange={(e) => setRandomizeOptions(e.target.checked)}
                disabled={submitting}
                className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="randomizeOptions" className="text-sm font-bold text-slate-700 select-none">
                Randomize Options Layout
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showResultsImmediately"
                checked={showResultsImmediately}
                onChange={(e) => setShowResultsImmediately(e.target.checked)}
                disabled={submitting}
                className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="showResultsImmediately" className="text-sm font-bold text-slate-700 select-none">
                Release Result Scores Immediately
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showCorrectAnswers"
                checked={showCorrectAnswers}
                onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                disabled={submitting}
                className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="showCorrectAnswers" className="text-sm font-bold text-slate-700 select-none">
                Reveal Correct Answers on Review
              </label>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center space-x-2">
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Update Quiz' : 'Create Quiz'}
          </Button>
          <Button variant="outline" disabled={submitting} onClick={() => navigate('/professor/quizzes')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfessorQuizCreate;
