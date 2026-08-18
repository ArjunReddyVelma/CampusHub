import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

const ClubDashboard = () => {
  const navigate = useNavigate();
  useDocumentTitle('Club Dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/club');
      setData(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve club dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const club = data?.club || null;
  const stats = data?.statistics || null;
  const recentHackathons = data?.hackathons || [];

  // State: No club created yet
  if (!club) {
    return (
      <div className="max-w-xl mx-auto space-y-6 text-left mt-8">
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-2xl p-6 md:p-8 text-white shadow-md">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Club Manager Console</h1>
          <p className="mt-2 text-teal-100 text-sm">Register your club and host hackathons on CampusHub.</p>
        </div>

        <div className="p-8 bg-white border border-slate-100 shadow-sm rounded-xl text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Establish Your Club Profile</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            You must register your club details and obtain administration approval before launching hackathons.
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={() => navigate('/club/profile')}>
              Register Club Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State: Club pending approval
  if (club.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-left">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{club.name}</h1>
            <div className="mt-2 flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold uppercase rounded-full">
                Pending Admin Approval
              </span>
              <span className="text-slate-400 text-xs font-semibold">{club.category}</span>
            </div>
          </div>
          <Link to="/club/profile" className="text-xs font-bold text-slate-400 hover:text-slate-600">
            Edit Profile
          </Link>
        </div>

        <div className="p-8 bg-white border border-amber-100 bg-amber-50/5 shadow-sm rounded-xl text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800">Pending Academic Validation</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Our campus administrators are currently reviewing your club registration request. You will be able to configure and publish hackathons as soon as status becomes approved.
          </p>
        </div>
      </div>
    );
  }

  // State: Club Suspended
  if (club.status === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-left">
        <div className="p-8 bg-white border border-rose-100 bg-rose-50/5 shadow-sm rounded-xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-rose-700">Club Suspended</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your club manager console has been suspended by administration. Please contact faculty coordinators for guidelines.
          </p>
        </div>
      </div>
    );
  }

  // Approved active dashboard
  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-2xl p-6 md:p-8 text-white shadow-md text-left">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{club.name}</h1>
        <p className="mt-2 text-teal-100 text-sm max-w-xl">
          Category: {club.category} | Faculty: {club.facultyCoordinator || 'N/A'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/club/hackathons/create"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all text-center"
          >
            Create Hackathon
          </Link>
          <Link
            to="/club/hackathons"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all text-center"
          >
            Manage Hackathons
          </Link>
          <Link
            to="/club/profile"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all text-center"
          >
            Club Profile
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-800">{stats.totalHackathons}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Hackathons</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
            <div className="text-2xl font-black text-emerald-600">{stats.activeHackathons}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
            <div className="text-2xl font-black text-amber-600">{stats.upcomingHackathons}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Upcoming</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-500">{stats.completedHackathons}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left col-span-2 md:col-span-1">
            <div className="text-2xl font-black text-slate-400">{stats.draftHackathons}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Drafts</div>
          </div>
        </div>
      )}

      {/* Recent Hackathons Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left space-y-4">
        <h2 className="text-base font-bold text-slate-800">Recent Hackathons</h2>
        {recentHackathons.length === 0 ? (
          <div className="py-6 text-center text-sm font-semibold text-slate-400">
            No hackathons created yet.{' '}
            <Link to="/club/hackathons/create" className="text-emerald-600 font-bold hover:underline">
              Create one now!
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentHackathons.map((h) => (
              <div key={h._id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm font-semibold">
                <div>
                  <h3 className="text-slate-800 font-bold leading-tight">{h.title}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Timeline: {new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()} |{' '}
                    {h.isPublished ? 'Published' : 'Draft'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/club/hackathons/${h._id}/edit`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all text-center"
                  >
                    Edit Config
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubDashboard;
