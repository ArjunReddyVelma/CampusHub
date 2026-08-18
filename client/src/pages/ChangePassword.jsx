import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';

const ChangePassword = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('CampusHub | Set Secure Password');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('New password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('New password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('New password must contain at least one number');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError('New password must contain at least one special character');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be the same as the current password');
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
      
      // 1. Refresh authenticated user using /auth/me.
      const res = await authService.getCurrentUser();
      
      if (res && res.success && res.data && res.data.user) {
        const loggedUser = res.data.user;
        
        // 2. Confirm mustChangePassword === false.
        if (loggedUser.mustChangePassword === false) {
          setTimeout(() => {
            // Update auth state on context
            refreshUser();
            
            // 3. Navigate to the user's role dashboard using replace: true
            const redirectMap = {
              student: '/student/dashboard',
              professor: '/professor/dashboard',
              club_admin: '/club/dashboard',
              judge: '/judge/dashboard',
              admin: '/admin/dashboard'
            };
            const targetPath = redirectMap[loggedUser.role] || '/login';
            navigate(targetPath, { replace: true });
          }, 1500);
        } else {
          setError('Failed to confirm password change state on security server.');
          setSuccess(false);
        }
      } else {
        setError('Failed to update credentials. Please re-authenticate.');
        setSuccess(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to change password. Please check your current password.');
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-8 relative">
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 mb-4">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              CampusHub
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Set Your Secure Password</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Your university account was created for you by your institution. For security, you must create a new password before continuing.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 text-center font-semibold text-sm">
            ✓ Password updated successfully. Redirecting to your dashboard...
          </div>
        ) : (
          <>
            <ErrorMessage message={error} className="mb-4" onDismiss={() => setError('')} />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="flex flex-col w-full text-left relative">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    name="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    disabled={submitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col w-full text-left relative">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    disabled={submitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col w-full text-left relative">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    disabled={submitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements List */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-xs text-slate-500 space-y-1.5 text-left font-medium">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Password Requirements:</p>
                <div className="flex items-center space-x-1.5">
                  <span className={newPassword.length >= 8 ? "text-emerald-600" : "text-slate-400"}>✓</span>
                  <span>Minimum 8 characters</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={/[A-Z]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}>✓</span>
                  <span>At least one uppercase letter</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={/[a-z]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}>✓</span>
                  <span>At least one lowercase letter</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={/[0-9]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}>✓</span>
                  <span>At least one number</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}>✓</span>
                  <span>At least one special character (!@#$%^&amp;* etc.)</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                loading={submitting}
              >
                Change Password
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
