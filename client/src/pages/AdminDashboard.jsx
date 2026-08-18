import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useDocumentTitle from '../hooks/useDocumentTitle';

const AdminDashboard = () => {
  useDocumentTitle('Admin Dashboard');
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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Single User Create state
  const [createRole, setCreateRole] = useState('student');
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createUniversityId, setCreateUniversityId] = useState('');
  const [createEmployeeId, setCreateEmployeeId] = useState('');
  const [createDepartment, setCreateDepartment] = useState('');
  const [createYear, setCreateYear] = useState('');
  const [createOfficeLocation, setCreateOfficeLocation] = useState('');
  const [createModalError, setCreateModalError] = useState('');
  const [createModalSuccess, setCreateModalSuccess] = useState('');

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvSuccess, setCsvSuccess] = useState('');

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreateModalError('');
    setCreateModalSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        role: createRole,
        name: createName,
        email: createEmail,
        password: createPassword,
        universityId: createRole === 'student' ? createUniversityId : undefined,
        employeeId: createRole === 'professor' ? createEmployeeId : undefined,
        department: ['student', 'professor'].includes(createRole) ? createDepartment : undefined,
        year: createRole === 'student' ? parseInt(createYear) : undefined,
        officeLocation: createRole === 'professor' ? createOfficeLocation : undefined
      };

      await api.post('/admin/users', payload);
      setCreateModalSuccess('User created successfully!');
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateName('');
        setCreateEmail('');
        setCreatePassword('');
        setCreateUniversityId('');
        setCreateEmployeeId('');
        setCreateDepartment('');
        setCreateYear('');
        setCreateOfficeLocation('');
        setCreateModalSuccess('');
        fetchData();
      }, 1500);
    } catch (err) {
      setCreateModalError(err.message || 'Failed to create user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    setCsvErrors([]);
    setCsvSuccess('');
    setSubmitting(true);

    try {
      await api.post('/admin/users/import', { csv: csvText });
      setCsvSuccess('CSV data imported successfully!');
      setTimeout(() => {
        setShowCsvModal(false);
        setCsvText('');
        setCsvSuccess('');
        fetchData();
      }, 1500);
    } catch (err) {
      if (err.data && err.data.errors) {
        setCsvErrors(err.data.errors);
      } else {
        setCsvErrors([err.message || 'Failed to import CSV']);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
              <div className="flex items-center space-x-3">
                <h2 className="text-base font-extrabold text-slate-800">User Directory</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors focus:outline-none"
                >
                  + Create User
                </button>
                <button
                  onClick={() => setShowCsvModal(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md shadow-sm transition-colors focus:outline-none"
                >
                  Import CSV
                </button>
              </div>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-800">Create University Account</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateModalError('');
                  setCreateModalSuccess('');
                }}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                ✕
              </button>
            </div>

            {createModalSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                {createModalSuccess}
              </div>
            )}

            <ErrorMessage message={createModalError} onDismiss={() => setCreateModalError('')} className="mb-4" />

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-855 outline-none"
                  required
                >
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                  <option value="club_admin">Club Admin</option>
                  <option value="judge">Judge</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {createRole === 'admin' && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-[10px] leading-relaxed">
                  ⚠️ Warning: Creating an Administrator account grants full access to all system data, users, and settings. Ensure you trust this user with administrator privileges.
                </div>
              )}

              <Input
                label="Full Name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Arjun Reddy"
                required
                disabled={submitting}
              />

              <Input
                label="University Email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="e.g. arjun@university.edu"
                required
                disabled={submitting}
              />

              <Input
                label="Temporary Password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                disabled={submitting}
              />

              {createRole === 'student' && (
                <>
                  <Input
                    label="University ID"
                    value={createUniversityId}
                    onChange={(e) => setCreateUniversityId(e.target.value)}
                    placeholder="e.g. SPSU2026001"
                    required
                    disabled={submitting}
                  />
                  <Input
                    label="Department"
                    value={createDepartment}
                    onChange={(e) => setCreateDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    required
                    disabled={submitting}
                  />
                  <Input
                    label="Academic Year"
                    type="number"
                    value={createYear}
                    onChange={(e) => setCreateYear(e.target.value)}
                    placeholder="e.g. 3"
                    required
                    disabled={submitting}
                  />
                </>
              )}

              {createRole === 'professor' && (
                <>
                  <Input
                    label="Faculty/Employee ID"
                    value={createEmployeeId}
                    onChange={(e) => setCreateEmployeeId(e.target.value)}
                    placeholder="e.g. FAC102"
                    required
                    disabled={submitting}
                  />
                  <Input
                    label="Department"
                    value={createDepartment}
                    onChange={(e) => setCreateDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    required
                    disabled={submitting}
                  />
                  <Input
                    label="Office Location (Optional)"
                    value={createOfficeLocation}
                    onChange={(e) => setCreateOfficeLocation(e.target.value)}
                    placeholder="e.g. Block A, Office 301"
                    disabled={submitting}
                  />
                </>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <Button type="submit" loading={submitting}>
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-800">Import Users from CSV</h3>
              <button
                onClick={() => {
                  setShowCsvModal(false);
                  setCsvErrors([]);
                  setCsvSuccess('');
                }}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                ✕
              </button>
            </div>

            {csvSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                {csvSuccess}
              </div>
            )}

            {csvErrors.length > 0 && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-[10px] max-h-40 overflow-y-auto space-y-1">
                <p className="font-extrabold uppercase tracking-wider mb-1">Import Errors:</p>
                {csvErrors.map((err, idx) => (
                  <p key={idx}>• {err}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleCsvSubmit} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Paste CSV text block
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  placeholder="name,email,role,universityId,employeeId,department,year&#10;Arjun Reddy,arjun@university.edu,student,SPSU001,,CSE,3&#10;Dr Sharma,sharma@university.edu,professor,,FAC101,CSE,"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  disabled={submitting}
                  required
                  rows="8"
                />
              </div>

              <div className="text-[10px] text-slate-400 leading-normal">
                Note: All successfully parsed users will be provisioned with a temporary password: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">TemporaryPassword123!</code> and forced to change it on their first login.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <Button type="submit" loading={submitting}>
                  Import Users
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
