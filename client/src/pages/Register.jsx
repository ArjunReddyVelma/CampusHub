import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';

const Register = () => {
  const { isAuthenticated, user, refreshUser, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    universityId: '',
    department: '',
    year: '1',
    officeLocation: ''
  });

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

    // Custom validations
    if (!formData.name || !formData.email || !formData.password || !formData.department) {
      setError('Please fill in all required fields');
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
      // Success registers the cookie, we refresh AuthContext state
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            disabled={submitting}
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
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            disabled={submitting}
          />

          <div className="flex flex-col text-left">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Account Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="student">Student</option>
              <option value="professor">Professor</option>
            </select>
          </div>
        </div>

        <hr className="border-slate-100 my-2" />

        {/* Dynamic fields based on role */}
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
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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

      <div className="mt-6 text-center text-sm font-semibold text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold focus:outline-none focus:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
