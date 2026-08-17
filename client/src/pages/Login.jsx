import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';

const Login = () => {
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect straight away to the user's dashboard role area
  if (isAuthenticated && !loading) {
    const redirectMap = {
      student: '/student/dashboard',
      professor: '/professor/dashboard',
      club_admin: '/club/dashboard',
      judge: '/judge/dashboard',
      admin: '/admin/dashboard'
    };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login({ email, password });
      const role = res.data.user.role;
      
      const redirectMap = {
        student: '/student/dashboard',
        professor: '/professor/dashboard',
        club_admin: '/club/dashboard',
        judge: '/judge/dashboard',
        admin: '/admin/dashboard'
      };
      
      navigate(redirectMap[role] || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sign In</h2>
        <p className="text-sm font-semibold text-slate-400 mt-1.5">Consuming your CampusHub workspace</p>
      </div>

      <ErrorMessage message={error} className="mb-4" onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@university.edu"
          required
          disabled={submitting}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={submitting}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          loading={submitting}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm font-semibold text-slate-500">
        New to CampusHub?{' '}
        <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-bold focus:outline-none focus:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default Login;
