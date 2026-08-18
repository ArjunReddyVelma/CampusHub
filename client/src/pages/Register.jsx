import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Register = () => {
  const { isAuthenticated, user, refreshUser, loading } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Register');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    universityId: '',
    department: '',
    year: '1',
    officeLocation: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Dynamic Form Validations ---
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.department) {
      setError('Please fill in all required fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password requirements
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Match verification
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.role === 'student' && (!formData.universityId || !formData.year)) {
      setError('Please provide universityId and year');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department
      };

      if (formData.role === 'student') {
        payload.universityId = formData.universityId;
        payload.year = Number(formData.year);
      } else {
        payload.officeLocation = formData.officeLocation;
      }

      await authService.register(payload);
      // Automatically refresh user auth contexts upon registration success
      await refreshUser();
      
      const redirectMap = {
        student: '/student/dashboard',
        professor: '/professor/dashboard'
      };
      navigate(redirectMap[formData.role] || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white border border-slate-100 shadow-xl rounded-2xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Register</h2>
        <p className="text-sm font-semibold text-slate-400 mt-1.5">Join the digital activities center</p>
      </div>

      <ErrorMessage message={error} className="mb-4" onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            disabled={submitting}
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="johndoe@university.edu"
            required
            disabled={submitting}
            autoComplete="email"
          />
        </div>

        {/* Row 2: Role selection */}
        <div className="flex flex-col text-left">
          <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
            Account Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={submitting}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="student">Student</option>
            <option value="professor">Professor</option>
          </select>
        </div>

        {/* Row 3: Password and Confirm Password with eye toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col text-left relative">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={submitting}
                autoComplete="new-password"
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

          <div className="flex flex-col text-left relative">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={submitting}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={submitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
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
        </div>

        <hr className="border-slate-100 my-2" />

        {/* Dynamic fields based on role selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder={formData.role === 'student' ? 'Computer Science' : 'Physics Dept'}
            required
            disabled={submitting}
          />

          {formData.role === 'student' ? (
            <Input
              label="University ID"
              name="universityId"
              value={formData.universityId}
              onChange={handleChange}
              placeholder="STUD12345"
              required
              disabled={submitting}
            />
          ) : (
            <Input
              label="Office Location (Optional)"
              name="officeLocation"
              value={formData.officeLocation}
              onChange={handleChange}
              placeholder="Block B, Room 402"
              disabled={submitting}
            />
          )}
        </div>

        {formData.role === 'student' && (
          <div className="flex flex-col text-left w-1/2">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Year of Study
            </label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-4"
          loading={submitting}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center space-y-2 text-sm font-semibold text-slate-500">
        <div>
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold focus:outline-none focus:underline">
            Sign in
          </Link>
        </div>
        <Link to="/" className="text-slate-400 hover:text-slate-600 focus:outline-none focus:underline">
          Back to Home Page
        </Link>
      </div>
    </div>
  );
};

export default Register;
