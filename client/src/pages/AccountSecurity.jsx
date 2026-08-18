import React, { useState } from 'react';
import authService from '../services/authService';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';

const AccountSecurity = () => {
  useDocumentTitle('CampusHub | Account Security');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Account Settings</h1>
        <p className="text-sm font-semibold text-slate-400 mt-1">
          Manage your credentials and login security configuration.
        </p>
      </div>

      <div className="max-w-2xl bg-white border border-slate-100 shadow-sm rounded-xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-2">Security Credentials</h2>
        <p className="text-sm font-medium text-slate-500 mb-6">
          Voluntarily update your account password at any time. A strong password helps protect your university profile.
        </p>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 font-semibold text-sm mb-6">
            ✓ Your password was updated successfully.
          </div>
        )}

        <ErrorMessage message={error} className="mb-6" onDismiss={() => setError('')} />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="flex flex-col w-full text-left relative">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* New Password */}
          <div className="flex flex-col w-full text-left relative">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Confirm New Password */}
          <div className="flex flex-col w-full text-left relative">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center">
            <input
              id="show-sec-pass"
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
            />
            <label htmlFor="show-sec-pass" className="ml-2 text-xs font-semibold text-slate-500">
              Show Passwords
            </label>
          </div>

          <Button
            type="submit"
            className="w-48 mt-2"
            loading={submitting}
          >
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AccountSecurity;
