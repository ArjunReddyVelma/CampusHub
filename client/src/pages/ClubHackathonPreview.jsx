import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const ClubHackathonPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHackathon = useCallback(async () => {
    try {
      const res = await api.get(`/hackathons/${id}`);
      setHackathon(res.data.data.hackathon);
    } catch (err) {
      setError(err.message || 'Failed to retrieve hackathon details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHackathon();
  }, [fetchHackathon]);

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this hackathon to students?')) return;
    setSubmitting(true);
    try {
      await api.patch(`/hackathons/${id}`, { isPublished: true });
      alert('Hackathon published successfully!');
      navigate('/club/hackathons');
    } catch (err) {
      setError(err.message || 'Failed to publish hackathon.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!hackathon) {
    return <div className="text-center text-slate-500 font-bold mt-8">Hackathon not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Hackathon Preview</h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Status: <span className="text-emerald-600 font-bold">{hackathon.isPublished ? 'Published' : 'Draft'}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!hackathon.isPublished && (
            <Button variant="primary" size="sm" onClick={handlePublish} loading={submitting}>
              Publish Now
            </Button>
          )}
          <Link
            to={`/club/hackathons/${hackathon._id}/edit`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all text-center"
          >
            Back to Edit
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {hackathon.banner && (
          <img src={hackathon.banner} alt={hackathon.title} className="w-full h-56 object-cover border-b border-slate-100" />
        )}

        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{hackathon.title}</h2>
            <p className="text-slate-400 text-sm font-semibold mt-1">
              Organized by <span className="text-emerald-600 font-bold">{hackathon.club?.name || 'Club'}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-semibold text-slate-500">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Timeline</span>
              {new Date(hackathon.startDate).toLocaleDateString()} - {new Date(hackathon.endDate).toLocaleDateString()}
            </div>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Team Size Bounds</span>
              {hackathon.minTeamSize} to {hackathon.maxTeamSize} Members
            </div>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Venue/Location</span>
              <span className="capitalize">{hackathon.locationType}</span> ({hackathon.location})
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
              <p className="text-sm text-slate-700 leading-relaxed mt-1">{hackathon.description}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Problem Statement</h3>
              <p className="text-sm text-slate-700 leading-relaxed mt-1">{hackathon.problemStatement}</p>
            </div>

            {hackathon.rules && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rules</h3>
                <p className="text-sm text-slate-700 leading-relaxed mt-1 whitespace-pre-line">{hackathon.rules}</p>
              </div>
            )}

            {hackathon.eligibility && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eligibility</h3>
                <p className="text-sm text-slate-700 leading-relaxed mt-1">{hackathon.eligibility}</p>
              </div>
            )}

            {hackathon.skillsRequired && hackathon.skillsRequired.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills Required</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hackathon.skillsRequired.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prizes List */}
            {hackathon.prizes && hackathon.prizes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prizes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {hackathon.prizes.map((p, idx) => (
                    <div key={idx} className="p-4 border border-emerald-100 bg-emerald-50/10 rounded-xl">
                      <span className="text-emerald-700 font-extrabold text-xs block">Rank #{p.rank}</span>
                      <p className="text-slate-800 font-bold text-sm mt-1">{p.reward}</p>
                      {p.description && <p className="text-slate-400 text-xs mt-0.5">{p.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubHackathonPreview;
