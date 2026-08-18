import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const AdminApprovals = () => {
  const [clubs, setClubs] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/clubs?status=${activeTab}`);
      setClubs(res.data.data.clubs || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve clubs.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleUpdateStatus = async (clubId, newStatus) => {
    const actionText = newStatus === 'approved' ? 'approve' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionText} this club?`)) return;

    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/clubs/${clubId}/status`, { status: newStatus });
      alert(`Club ${newStatus === 'approved' ? 'approved' : 'suspended'} successfully!`);
      await fetchClubs();
    } catch (err) {
      setError(err.message || 'Failed to update club status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Club Registrations Control</h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Moderate university student organization registration status.
          </p>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Tabs list */}
      <div className="flex border-b border-slate-100 text-sm font-semibold">
        {['pending', 'approved', 'suspended'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 capitalize border-b-2 transition-all ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-700 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            {tab} List
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : clubs.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
          No clubs found in {activeTab} status category.
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs font-bold uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-4">Club Logo</th>
                  <th scope="col" className="px-6 py-4">Club Name</th>
                  <th scope="col" className="px-6 py-4">Category</th>
                  <th scope="col" className="px-6 py-4">Faculty Coordinator</th>
                  <th scope="col" className="px-6 py-4">Owner / Contact</th>
                  <th scope="col" className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {clubs.map((club) => (
                  <tr key={club._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      {club.logo ? (
                        <img src={club.logo} alt={club.name} className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 font-bold">
                          None
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-slate-800 font-bold block">{club.name}</span>
                        <span className="text-xs text-slate-400 font-medium truncate max-w-xs block mt-0.5">{club.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-650 border border-indigo-100 text-[10px] uppercase font-bold tracking-wide rounded-full">
                        {club.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {club.facultyCoordinator || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-800 leading-tight">{club.owner?.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{club.owner?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {activeTab === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus(club._id, 'approved')}
                            disabled={submitting}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-650 hover:bg-rose-50 border-rose-100"
                            onClick={() => handleUpdateStatus(club._id, 'suspended')}
                            disabled={submitting}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {activeTab === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-rose-650 hover:bg-rose-50 border-rose-100"
                          onClick={() => handleUpdateStatus(club._id, 'suspended')}
                          disabled={submitting}
                        >
                          Suspend
                        </Button>
                      )}
                      {activeTab === 'suspended' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(club._id, 'approved')}
                          disabled={submitting}
                        >
                          Re-Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
