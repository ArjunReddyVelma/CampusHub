import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Announcement Form Fields
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');

  // User list search/filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users')
      ]);
      setMetrics(metricsRes.data.data);
      setUsers(usersRes.data.data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve administrative data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      alert('User role updated successfully!');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    const action = isActive ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/admin/users/${userId}/status`);
      alert(`User account ${isActive ? 'suspended' : 'activated'} successfully!`);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadcastAnnouncement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setAnnouncementSuccess('');

    try {
      await api.post('/announcements', {
        title: announcementTitle,
        content: announcementContent,
        scope: 'global'
      });
      setAnnouncementSuccess('Global site announcement broadcast successfully!');
      setAnnouncementTitle('');
      setAnnouncementContent('');
    } catch (err) {
      setError(err.message || 'Failed to broadcast announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  // Filtering users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesStatus =
      statusFilter !== ''
        ? statusFilter === 'active'
          ? u.isActive
          : !u.isActive
        : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-905 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Admin Control Center</h1>
        <p className="mt-2 text-indigo-100 font-medium text-sm max-w-xl">
          Track system metrics, moderate user accounts, update roles, and dispatch global site announcements.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Metrics Widgets */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Users</span>
            <span className="text-3xl font-black text-slate-850 mt-1 block">{metrics.users?.total}</span>
            <div className="mt-2 text-[10px] font-bold text-slate-500 space-x-2">
              <span>Std: {metrics.users?.students}</span>
              <span>Prof: {metrics.users?.professors}</span>
              <span>Judge: {metrics.users?.judges}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clubs Overview</span>
            <span className="text-3xl font-black text-slate-850 mt-1 block">{metrics.clubs?.total}</span>
            <div className="mt-2 text-[10px] font-bold text-slate-500 space-x-2">
              <span className="text-emerald-600">Appr: {metrics.clubs?.approved}</span>
              <span className="text-amber-600">Pend: {metrics.clubs?.pending}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hackathons</span>
            <span className="text-3xl font-black text-slate-850 mt-1 block">{metrics.hackathons?.total}</span>
            <div className="mt-2 text-[10px] font-bold text-slate-500 space-x-2">
              <span>Pub: {metrics.hackathons?.published}</span>
              <span>Draft: {metrics.hackathons?.drafts}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Quizzes</span>
            <span className="text-3xl font-black text-slate-850 mt-1 block">{metrics.quizzesCount}</span>
            <p className="text-[10px] text-slate-400 font-medium mt-2">Active academic evaluation sets</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* User Management Roster */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-4">
              <h2 className="text-base font-extrabold text-slate-800">User Directory</h2>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <input
                  type="text"
                  placeholder="Search name/email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 outline-none focus:bg-white"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                  <option value="club_admin">Club Admin</option>
                  <option value="judge">Judge</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="text-[10px] font-bold uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-slate-800 font-bold">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={submitting}
                          className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-800 outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="professor">Professor</option>
                          <option value="club_admin">Club Admin</option>
                          <option value="judge">Judge</option>
                          {u.role === 'admin' && <option value="admin">Admin</option>}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(u._id, u.isActive)}
                          disabled={submitting}
                          className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                            u.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Global Announcement Broadcaster */}
        <div className="space-y-6">
          <form onSubmit={handleBroadcastAnnouncement} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-800 border-b border-slate-50 pb-3">Global Broadcast</h2>
            
            {announcementSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                {announcementSuccess}
              </div>
            )}

            <Input
              label="Broadcast Title"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              disabled={submitting}
              required
              placeholder="e.g. Server Maintenance Notice"
            />

            <div className="flex flex-col text-left">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Broadcast Content
                  </label>
              <textarea
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Type the global broadcast contents here..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                disabled={submitting}
                required
                rows="4"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" loading={submitting}>
              Broadcast Global Notice
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
