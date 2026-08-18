import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';

const ForgotPassword = () => {
  useDocumentTitle('CampusHub | Forgot Password');

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your institutional email');
      return;
    }

    setSubmitting(true);
    try {
      // Direct call to auth endpoint
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to request reset token');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
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
            Enter your institutional email to generate a password reset link.
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 text-center text-sm font-medium">
              ✓ Password reset token generated successfully.
            </div>
            <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-lg p-4 text-xs font-semibold text-center leading-relaxed">
              [DEVELOPMENT ONLY] Check your backend server console to retrieve the password reset link.
            </div>
            <Link to="/login" className="block text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mt-4">
              Return to Login Portal
            </Link>
          </div>
        ) : (
          <>
            <ErrorMessage message={error} className="mb-4" onDismiss={() => setError('')} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Institutional Email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@campushub.test"
                required
                disabled={submitting}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                loading={submitting}
              >
                Send Password Reset Request
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-slate-600">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
