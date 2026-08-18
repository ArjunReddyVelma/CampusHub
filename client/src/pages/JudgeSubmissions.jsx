import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const JudgeSubmissions = () => {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch assigned hackathons
  useEffect(() => {
    const fetchAssignedHackathons = async () => {
      try {
        const res = await api.get('/hackathons');
        setHackathons(res.data.data.hackathons || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch assigned hackathons.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedHackathons();
  }, []);

  // Fetch submissions for a specific hackathon
  const handleSelectHackathon = async (hackathon) => {
    setSelectedHackathon(hackathon);
    setSubLoading(true);
    setError('');
    try {
      const res = await api.get(`/hackathons/${hackathon._id}/submissions`);
      setSubmissions(res.data.data.submissions || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch submissions.');
      setSubmissions([]);
    } finally {
      setSubLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Assigned Submissions Workspace</h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Choose an assigned hackathon to view and grade student project builds.
          </p>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {hackathons.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
          No hackathons are currently assigned to you for evaluation.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Hackathons List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Assigned Events</h2>
            <div className="space-y-2">
              {hackathons.map((h) => {
                const isSelected = selectedHackathon?._id === h._id;
                return (
                  <button
                    key={h._id}
                    onClick={() => handleSelectHackathon(h)}
                    className={`w-full p-4 rounded-xl border text-left font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/10 text-indigo-800'
                        : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{h.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
                      Deadline: {new Date(h.submissionDeadline).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submissions Table List */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
              {selectedHackathon ? `Submissions for ${selectedHackathon.title}` : 'Select a Hackathon to View Submissions'}
            </h2>

            {subLoading ? (
              <LoadingSpinner size="md" />
            ) : !selectedHackathon ? (
              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
                Please select a hackathon from the left column to view submissions.
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 font-semibold">
                No teams have submitted their projects for this hackathon yet.
              </div>
            ) : (
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs font-bold uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th scope="col" className="px-6 py-4">Team</th>
                        <th scope="col" className="px-6 py-4">Submitted By</th>
                        <th scope="col" className="px-6 py-4">Status</th>
                        <th scope="col" className="px-6 py-4">Score</th>
                        <th scope="col" className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {submissions.map((sub) => (
                        <tr key={sub._id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <span className="text-slate-800 font-bold">{sub.team?.name || 'Unnamed Team'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-slate-800 leading-tight">{sub.submittedBy?.name}</p>
                              <p className="text-xs text-slate-400 font-medium">{sub.submittedBy?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              sub.status === 'evaluated'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-black">
                            {sub.status === 'evaluated' ? `${sub.finalScore?.toFixed(1)}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant={sub.status === 'evaluated' ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => navigate(`/judge/submissions/${sub._id}/evaluate`)}
                            >
                              {sub.status === 'evaluated' ? 'Re-Evaluate' : 'Evaluate'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeSubmissions;
