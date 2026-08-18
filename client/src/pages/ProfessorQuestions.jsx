import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ProfessorQuestions = () => {
  const { id } = useParams(); // Quiz ID

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State for Adding/Editing a question
  const [editingQuestionId, setEditingQuestionId] = useState(null); // null means "Add Mode"
  const [text, setText] = useState('');
  const [type, setType] = useState('mcq');
  const [marks, setMarks] = useState('2');
  
  // MCQ options fields
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']); // start with 4 empty options
  const [mcqCorrect, setMcqCorrect] = useState('0'); // index string

  // True/False correct field
  const [tfCorrect, setTfCorrect] = useState('0'); // "0" (True), "1" (False)

  const fetchQuizAndQuestions = useCallback(async () => {
    try {
      const res = await api.get(`/quizzes/${id}`);
      setQuiz(res.data.data.quiz);
      setQuestions(res.data.data.questions || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve questions.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [fetchQuizAndQuestions]);

  const handleEditClick = (q) => {
    setEditingQuestionId(q._id);
    setText(q.text);
    setType(q.type);
    setMarks(q.marks?.toString() || '2');

    if (q.type === 'mcq' || q.type === 'multiple_correct') {
      setMcqOptions([...q.options]);
      setMcqCorrect(q.correctAnswers[0]?.toString() || '0');
    } else if (q.type === 'true_false') {
      setTfCorrect(q.correctAnswers[0]?.toString() || '0');
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setText('');
    setType('mcq');
    setMarks('2');
    setMcqOptions(['', '', '', '']);
    setMcqCorrect('0');
    setTfCorrect('0');
  };

  const handleDelete = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    setLoading(true);
    try {
      await api.delete(`/questions/${qId}`);
      alert('Question deleted successfully.');
      await fetchQuizAndQuestions();
    } catch (err) {
      setError(err.message || 'Failed to delete question.');
      setLoading(false);
    }
  };

  const handleOptionChange = (idx, value) => {
    setMcqOptions((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const handleAddOptionField = () => {
    setMcqOptions((prev) => [...prev, '']);
  };

  const handleRemoveOptionField = (idx) => {
    if (mcqOptions.length <= 2) {
      setError('An MCQ question must have at least 2 options.');
      return;
    }
    setMcqOptions((prev) => prev.filter((_, i) => i !== idx));
    if (Number(mcqCorrect) >= mcqOptions.length - 1) {
      setMcqCorrect('0');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const marksNum = Number(marks);
    if (!text) {
      setError('Please provide question text.');
      return;
    }
    if (marksNum < 1) {
      setError('Marks must be at least 1.');
      return;
    }

    let payload = {
      type,
      text,
      marks: marksNum
    };

    if (type === 'mcq') {
      // Validate options are filled
      const filteredOptions = mcqOptions.map((o) => o.trim()).filter((o) => o.length > 0);
      if (filteredOptions.length < 2) {
        setError('Please provide at least 2 non-empty options.');
        return;
      }
      payload.options = filteredOptions;
      payload.correctAnswers = [Number(mcqCorrect)];
    } else if (type === 'true_false') {
      payload.options = ['True', 'False'];
      payload.correctAnswers = [Number(tfCorrect)];
    }

    setSubmitting(true);
    try {
      if (editingQuestionId) {
        // Update question
        await api.patch(`/questions/${editingQuestionId}`, payload);
        alert('Question updated successfully.');
      } else {
        // Add question
        await api.post(`/quizzes/${id}/questions`, payload);
        alert('Question added successfully.');
      }
      handleCancelEdit();
      await fetchQuizAndQuestions();
    } catch (err) {
      setError(err.message || 'Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
      {/* List of existing questions */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Manage Questions
            </h1>
            <p className="text-slate-400 font-medium text-xs mt-1">
              Quiz: <span className="text-emerald-600 font-bold">{quiz?.title}</span>
            </p>
          </div>
          <Link to="/professor/quizzes" className="text-xs font-bold text-slate-400 hover:text-slate-600">
            Back to Quizzes
          </Link>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
            No questions created yet. Use the editor on the right to add some questions!
          </div>
        ) : (
          <div className="space-y-4">
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
                        className={`px-4 py-2 border rounded-lg text-xs font-semibold flex items-center justify-between ${
                          isCorrect
                            ? 'border-emerald-200 bg-emerald-50/10 text-emerald-800'
                            : 'border-slate-100 bg-slate-50/20 text-slate-600'
                        }`}
                      >
                        <span>{option}</span>
                        {isCorrect && (
                          <span className="text-[10px] uppercase font-bold text-emerald-600">Correct Choice</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center space-x-2">
                  <button
                    onClick={() => handleEditClick(q)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor sidebar: Add/Edit Question */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
          {editingQuestionId ? 'Edit Question' : 'Add Question'}
        </h2>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col text-left">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Question Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="true_false">True / False</option>
            </select>
          </div>

          <div className="flex flex-col text-left">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Question Text
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="What is the time complexity of binary search?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={submitting}
              required
              rows="3"
            />
          </div>

          <Input
            label="Marks"
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            disabled={submitting}
            required
            min="1"
          />

          <hr className="border-slate-100" />

          {/* Type: MCQ Options list */}
          {type === 'mcq' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Answer Options
              </label>
              {mcqOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-bold">{idx + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    disabled={submitting}
                    required
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {mcqOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionField(idx)}
                      className="text-xs font-bold text-rose-500"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddOptionField}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Add Option Field
              </button>

              <div className="flex flex-col text-left pt-2">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Correct Option Index
                </label>
                <select
                  value={mcqCorrect}
                  onChange={(e) => setMcqCorrect(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                >
                  {mcqOptions.map((_, idx) => (
                    <option key={idx} value={idx}>
                      Option {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Type: True/False choice */}
          {type === 'true_false' && (
            <div className="flex flex-col text-left">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Correct Answer
              </label>
              <select
                value={tfCorrect}
                onChange={(e) => setTfCorrect(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none"
              >
                <option value="0">True</option>
                <option value="1">False</option>
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Button type="submit" loading={submitting}>
              {editingQuestionId ? 'Update Question' : 'Add Question'}
            </Button>
            {editingQuestionId && (
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfessorQuestions;
