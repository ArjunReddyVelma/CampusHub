import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const ClubHackathons = () => {
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchClubAndHackathons = async () => {
    try {
      // 1. Get my club
      const clubRes = await api.get('/clubs/my-club');
      const myClub = clubRes.data.data.club;
      if (!myClub) {
        setLoading(false);
        return;
      }
      setClub(myClub);

      // 2. Fetch hackathons matching club query parameter
      const hackRes = await api.get(`/hackathons?club=${myClub._id}`);
      setHackathons(hackRes.data.data.hackathons || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve hackathons list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubAndHackathons();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hackathon?')) return;
    setLoading(true);
    try {
      await api.delete(`/hackathons/${id}`);
      alert('Hackathon deleted successfully.');
      await fetchClubAndHackathons();
    } catch (err) {
      setError(err.message || 'Failed to delete hackathon.');
      setLoading(false);
    }
  };

  const handlePublish = async (id, publishValue) => {
    setLoading(true);
    try {
      await api.patch(`/hackathons/${id}`, { isPublished: publishValue });
      alert(publishValue ? 'Hackathon published successfully!' : 'Hackathon unpublished successfully.');
      await fetchClubAndHackathons();
    } catch (err) {
      setError(err.message || 'Failed to update publication status.');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!club) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center mt-8">
        <h2 className="text-xl font-bold text-slate-800">No Club Registered Yet</h2>
        <p className="text-sm text-slate-500">You must register a club profile first.</p>
        <Button variant="primary" onClick={() => navigate('/club/profile')}>
          Register Club Profile
        </Button>
      </div>
    );
  }

  const now = new Date();
  const getFilteredHackathons = () => {
    switch (activeTab) {
      case 'drafts':
        return hackathons.filter((h) => !h.isPublished);
      case 'published':
        return hackathons.filter((h) => h.isPublished);
      case 'upcoming':
        return hackathons.filter((h) => h.isPublished && new Date(h.startDate) > now);
      case 'completed':
        return hackathons.filter((h) => h.isPublished && new Date(h.endDate) < now);
      default:
        return hackathons;
    }
  };

  const filtered = getFilteredHackathons();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Hackathon Management</h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Club: <span className="text-emerald-600 font-bold">{club.name}</span>
          </p>
        </div>
        {club.status === 'approved' && (
          <Link
            to="/club/hackathons/create"
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors text-center"
          >
            Create Hackathon
          </Link>
        )}
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
          No hackathons found matching this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((hack) => {
            const start = new Date(hack.startDate);
            const end = new Date(hack.endDate);
            const isUpcoming = now < start;
            const isExpired = now > end;

            return (
              <div key={hack._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow text-left">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${
                      hack.isPublished
                        ? isExpired
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : isUpcoming
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {hack.isPublished ? (isExpired ? 'Completed' : isUpcoming ? 'Upcoming' : 'Active') : 'Draft'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-800">{hack.title}</h3>
                    <p className="text-slate-400 text-xs font-semibold mt-1">
                      {hack.description || 'No description provided.'}
                    </p>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                    <div>
                      <span className="text-slate-400 block font-medium">Team Size Limits:</span>
                      {hack.minTeamSize} - {hack.maxTeamSize} Members
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Location Type:</span>
                      <span className="capitalize">{hack.locationType}</span> ({hack.location})
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-medium">Event Window:</span>
                      {start.toLocaleDateString()} - {end.toLocaleDateString()}
                    </div>
                    <div className="col-span-2 text-rose-600">
                      <span className="text-slate-400 block font-medium">Registration Deadline:</span>
                      {new Date(hack.registrationDeadline).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {!hack.isPublished ? (
                    <>
                      <Button variant="primary" size="sm" onClick={() => handlePublish(hack._id, true)}>
                        Publish
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/club/hackathons/${hack._id}/edit`)}>
                        Edit Config
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/club/hackathons/${hack._id}/preview`)}>
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(hack._id)}>
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handlePublish(hack._id, false)}>
                        Unpublish
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/club/hackathons/${hack._id}/preview`)}>
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(hack._id)}>
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

export default ClubHackathons;
