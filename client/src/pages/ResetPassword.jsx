import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';

const ResetPassword = () => {
  useDocumentTitle('CampusHub | Reset Password');
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired password reset token.');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-8 relative">
        <div className="text-center mb-6">
          <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            CampusHub
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-3">Reset Account Password</h2>
          <p className="text-sm font-semibold text-slate-400 mt-1.5">
            Configure your new secure account password below.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 text-center text-sm font-semibold">
            ✓ Password reset successfully! Redirecting to Login...
          </div>
        ) : (
          <>
            <ErrorMessage message={error} className="mb-4" onDismiss={() => setError('')} />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="flex flex-col w-full text-left relative">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col w-full text-left relative">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="show-passwords"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={submitting}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="show-passwords" className="ml-2 text-xs font-semibold text-slate-500">
                  Show Passwords
                </label>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                loading={submitting}
              >
                Save New Password
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-slate-600">
                Cancel and return to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
