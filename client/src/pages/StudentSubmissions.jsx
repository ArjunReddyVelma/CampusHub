import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const StudentSubmissions = () => {
  const [searchParams] = useSearchParams();
  const hackathonId = searchParams.get('hackathonId');

  const [hackathon, setHackathon] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Form Fields
  const [repoUrl, setRepoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissionDetails = useCallback(async () => {
    if (!hackathonId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const hackRes = await api.get(`/hackathons/${hackathonId}`);
      setHackathon(hackRes.data.data.hackathon);

      const subRes = await api.get(`/hackathons/${hackathonId}/submissions/my-submission`);
      const existingSub = subRes.data.data.submission;
      setSubmission(existingSub);

      if (existingSub) {
        setRepoUrl(existingSub.repositoryUrl || '');
        setVideoUrl(existingSub.demoVideoUrl || '');
        setDescription(existingSub.description || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch submission details');
    } finally {
      setLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [fetchSubmissionDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoUrl || !description) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/hackathons/${hackathonId}/submissions`, {
        repositoryUrl: repoUrl,
        demoVideoUrl: videoUrl,
        description
      });
      alert('Project submitted successfully!');
      setEditMode(false);
      await fetchSubmissionDetails();
    } catch (err) {
      setError(err.message || 'Failed to submit project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Project Submissions</h1>
        <p className="text-slate-400 font-medium text-xs mt-1">
          Submit your repository linkages and video walkthrough files for judge reviews.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {hackathonId ? (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Submitting project for: <span className="text-emerald-600">{hackathon?.title}</span>
            </h2>
            <Link to="/student/hackathons" className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Choose Another
            </Link>
          </div>

          {submission && !editMode ? (
            /* Show Existing Submission and Evaluations */
            <div className="space-y-6">
              <div className="border-l-4 border-emerald-500 pl-4 space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Project details submitted</h3>
                <p className="text-xs font-medium text-slate-500">
                  Submitted by: {submission.submittedBy?.name || 'Team member'}
                </p>
                <div className="pt-2 text-xs font-semibold text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400 font-medium">Repository URL: </span>
                    <a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      {submission.repositoryUrl}
                    </a>
                  </div>
                  {submission.demoVideoUrl && (
                    <div>
                      <span className="text-slate-400 font-medium">Demo Video: </span>
                      <a href={submission.demoVideoUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                        {submission.demoVideoUrl}
                      </a>
                    </div>
                  )}
                </div>
                <div className="pt-3 text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded-lg italic">
                  "{submission.description}"
                </div>
              </div>

              {/* Evaluation scorecards */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Evaluation Report</h3>
                {submission.status === 'evaluated' ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl font-black text-emerald-600">
                        {submission.finalScore?.toFixed(1)}
                        <span className="text-xs font-bold text-slate-400">/30</span>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold rounded-lg uppercase">
                        Evaluated
                      </span>
                    </div>

                    {submission.evaluations?.map((evaluation, index) => (
                      <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Judge: {evaluation.judge?.name || 'Anonymous Judge'}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-500">
                          {evaluation.criteriaScores?.map((crit, cIdx) => (
                            <div key={cIdx}>
                              <span className="text-slate-400 block font-medium capitalize">{crit.criteria}:</span>
                              {crit.score} / {crit.maxScore}
                            </div>
                          ))}
                        </div>
                        {evaluation.feedback && (
                          <p className="text-xs italic text-slate-500 pt-1 leading-relaxed">
                            Feedback: "{evaluation.feedback}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-xs font-bold text-amber-700 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Awaiting evaluations from judges panel
                  </div>
                )}
              </div>

              {/* Edit submission button */}
              {new Date() <= new Date(hackathon?.submissionDeadline) && (
                <div className="pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit Submission
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <Input
                label="Repository URL"
                placeholder="https://github.com/your-org/your-project"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={submitting}
                required
              />
              <Input
                label="Demo Video Link (Optional)"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={submitting}
              />
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Project Description
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Explain your technical build, tech-stack components, and design choices..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  required
                  rows="4"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Button type="submit" loading={submitting}>
                  Submit Project
                </Button>
                {editMode && (
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
          Select a hackathon from the{' '}
          <Link to="/student/hackathons" className="text-emerald-600 font-bold hover:underline">
            Hackathons view
          </Link>{' '}
          to submit or edit your project.
        </div>
      )}
    </div>
  );
};

export default StudentSubmissions;
