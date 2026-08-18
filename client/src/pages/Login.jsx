import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPath } from '../utils/roleRedirect';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Login = () => {
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect straight away to the user's dashboard role area
  if (isAuthenticated && !loading) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please provide your email and password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login({ email, password });
      const role = res.data.user.role;
      navigate(getDashboardPath(role), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-8 relative">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">CampusHub</h2>
        <p className="text-sm font-semibold text-slate-400 mt-1.5 font-sans">Use your university credentials to sign in.</p>
      </div>

      <ErrorMessage message={error} className="mb-4" onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="University Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@university.edu"
          required
          disabled={submitting}
          autoComplete="email"
        />

        {/* Password input with show/hide toggle */}
        <div className="flex flex-col w-full text-left relative">
          <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={submitting}
              autoComplete="current-password"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={submitting}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
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

        <Button
          type="submit"
          className="w-full mt-2"
          loading={submitting}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center space-y-2 text-sm font-semibold text-slate-500 text-center">
        <div>
          Don't have an account?{' '}
          <span className="text-slate-400 font-bold block md:inline">
            Contact your university administrator.
          </span>
        </div>
        <Link to="/" className="text-slate-400 hover:text-slate-600 focus:outline-none focus:underline mt-2 block">
          Back to Home Page
        </Link>
      </div>
    </div>
  );
};

export default Login;
