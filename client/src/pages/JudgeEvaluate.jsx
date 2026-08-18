import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

const JudgeEvaluate = () => {
  const { id } = useParams(); // Submission ID
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState(null);
  const [criteriaList, setCriteriaList] = useState([]);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchSubmissionDetails = useCallback(async () => {
    try {
      const res = await api.get(`/submissions/${id}`);
      const sub = res.data.data.submission;
      setSubmission(sub);

      // Determine judging criteria dynamically
      const criteria = sub.hackathon?.judgingCriteria && sub.hackathon.judgingCriteria.length > 0
        ? sub.hackathon.judgingCriteria
        : ['Innovation', 'Technical Execution', 'UI/UX', 'Impact', 'Presentation'];
      
      setCriteriaList(criteria);

      // Look for an existing evaluation by this judge to pre-fill
      const existingEval = sub.evaluations?.find(
        (e) => (e.judge?._id || e.judge) === user?.id
      );

      const initialScores = {};
      criteria.forEach((crit) => {
        const foundScore = existingEval?.criteriaScores?.find(
          (cs) => cs.criteria.toLowerCase() === crit.toLowerCase()
        );
        initialScores[crit] = foundScore ? foundScore.score : 5; // default to 5
      });
      setScores(initialScores);

      if (existingEval) {
        setFeedback(existingEval.feedback || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch submission details.');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [fetchSubmissionDetails]);

  const handleScoreChange = (criteriaName, value) => {
    const numericVal = Math.min(10, Math.max(0, parseFloat(value) || 0));
    setScores((prev) => ({
      ...prev,
      [criteriaName]: numericVal
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Format the payload criteriaScores
    const formattedScores = criteriaList.map((crit) => ({
      criteria: crit,
      score: scores[crit] !== undefined ? scores[crit] : 5,
      maxScore: 10
    }));

    try {
      await api.post(`/submissions/${id}/evaluate`, {
        criteriaScores: formattedScores,
        feedback
      });
      alert('Evaluation submitted successfully!');
      navigate('/judge/submissions');
    } catch (err) {
      setError(err.message || 'Failed to submit evaluation.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!submission) {
    return <div className="text-center text-slate-500 font-bold mt-8">Submission not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Evaluate Submission</h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Grade the project build submitted by <span className="text-indigo-600 font-bold">{submission.team?.name}</span> for <span className="text-indigo-600 font-bold">{submission.hackathon?.title}</span>.
          </p>
        </div>
        <Link to="/judge/submissions" className="text-xs font-bold text-slate-400 hover:text-slate-600">
          Back to Workspace
        </Link>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project details card */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Title / Team</span>
            <h2 className="text-base font-extrabold text-slate-800 leading-tight mt-1">{submission.team?.name}</h2>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-50 text-xs font-semibold text-slate-600">
            <div>
              <span className="text-slate-400 font-medium block">Repository Link:</span>
              <a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                {submission.repositoryUrl}
              </a>
            </div>
            {submission.demoVideoUrl && (
              <div>
                <span className="text-slate-400 font-medium block">Demo Video:</span>
                <a href={submission.demoVideoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                  {submission.demoVideoUrl}
                </a>
              </div>
            )}
            <div>
              <span className="text-slate-400 font-medium block">Submitted By:</span>
              <p className="text-slate-700">{submission.submittedBy?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">{submission.submittedBy?.email}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
            <p className="text-xs text-slate-600 italic leading-relaxed mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-lg">
              "{submission.description}"
            </p>
          </div>
        </div>

        {/* Evaluation Grading Panel */}
        <form onSubmit={handleSubmit} className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-base font-extrabold text-slate-800 border-b border-slate-50 pb-3">Evaluation Rubrics</h2>

          <div className="space-y-5">
            {criteriaList.map((crit) => (
              <div key={crit} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">{crit}</label>
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    {scores[crit] !== undefined ? scores[crit] : 5} / 10
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={scores[crit] !== undefined ? scores[crit] : 5}
                    onChange={(e) => handleScoreChange(crit, e.target.value)}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={scores[crit] !== undefined ? scores[crit] : 5}
                    onChange={(e) => handleScoreChange(crit, e.target.value)}
                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col text-left pt-3 border-t border-slate-50">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Feedback & Comments
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Provide structured feedback regarding code complexity, innovative solutions, or areas of improvement..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={submitting}
              required
              rows="4"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Button type="submit" variant="primary" loading={submitting}>
              Submit Evaluation
            </Button>
            <Link
              to="/judge/submissions"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JudgeEvaluate;
