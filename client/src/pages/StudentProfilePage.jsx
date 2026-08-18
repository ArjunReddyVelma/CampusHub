import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const StudentProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Stats / Profile State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile Edit fields
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Change Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/dashboard/student');
      const profileData = res.data.data.profile;
      setProfile(profileData);

      if (profileData) {
        setBio(profileData.bio || '');
        setGithubUrl(profileData.githubUrl || '');
        setLinkedinUrl(profileData.linkedinUrl || '');
        setSkillsStr(profileData.skills?.join(', ') || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setError('');
    setSuccess('');
    try {
      const skillsArray = skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await api.put('/auth/profile', {
        bio,
        githubUrl,
        linkedinUrl,
        skills: skillsArray
      });
      setSuccess('Profile updated successfully!');
      await fetchProfileData();
    } catch (err) {
      setError(err.message || 'Failed to update profile settings');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSubmittingPassword(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const badges = profile?.badges || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 uppercase text-2xl">
            {user?.name?.slice(0, 2) || 'CH'}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{user?.name}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{user?.role}</p>
            <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
          </div>
        </div>

        <div className="flex space-x-6 text-center text-xs font-semibold text-slate-500">
          <div>
            <span className="text-slate-400 block font-medium">XP</span>
            <span className="text-emerald-600 font-bold text-lg">{profile?.xp || 0}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Coins</span>
            <span className="text-emerald-600 font-bold text-lg">{profile?.points || 0}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Department</span>
            <span className="text-slate-800 font-bold">{profile?.department}</span>
          </div>
        </div>
      </div>

      {/* Tabs list controls */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => {
            setActiveTab('profile');
            setError('');
            setSuccess('');
          }}
          className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Edit Profile Settings
        </button>
        <button
          onClick={() => {
            setActiveTab('security');
            setError('');
            setSuccess('');
          }}
          className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Password & Security
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-lg text-left">
          {success}
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Left / Main form details */}
          <form onSubmit={handleUpdateProfile} className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 mb-2">Portfolio Information</h2>

            <div className="flex flex-col text-left">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Biography (Bio)
              </label>
              <textarea
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Write a brief profile description..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={submittingProfile}
                rows="3"
              />
            </div>

            <Input
              label="Technical Skills (Comma separated)"
              placeholder="React, Node.js, Python, MongoDB"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              disabled={submittingProfile}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="GitHub Link"
                placeholder="https://github.com/your-username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={submittingProfile}
              />
              <Input
                label="LinkedIn Link"
                placeholder="https://linkedin.com/in/your-username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                disabled={submittingProfile}
              />
            </div>

            <Button type="submit" loading={submittingProfile} className="mt-4">
              Save Profile changes
            </Button>
          </form>

          {/* Right sidebar: Badges & accomplishments */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800">Earned Badges</h2>
            {badges.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400">Complete quizzes and hackathons to earn badges.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center space-y-2">
                    <div className="text-2xl">🏆</div>
                    <div className="text-[10px] font-bold text-slate-700 capitalize">{badge}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Password & Security form */
        <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 text-left max-w-md">
          <h2 className="text-base font-bold text-slate-800 mb-2">Update Credentials</h2>

          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={submittingPassword}
            required
            autoComplete="current-password"
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={submittingPassword}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submittingPassword}
            required
            autoComplete="new-password"
          />

          <Button type="submit" loading={submittingPassword} className="mt-4">
            Change Password
          </Button>
        </form>
      )}
    </div>
  );
};

export default StudentProfilePage;
