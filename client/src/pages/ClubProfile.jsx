import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ClubProfile = () => {
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [facultyCoordinator, setFacultyCoordinator] = useState('');
  const [logo, setLogo] = useState('');

  // Social Links
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  const fetchClub = async () => {
    try {
      const res = await api.get('/clubs/my-club');
      const foundClub = res.data.data.club;
      if (foundClub) {
        setClub(foundClub);
        setName(foundClub.name || '');
        setDescription(foundClub.description || '');
        setCategory(foundClub.category || '');
        setContactInfo(foundClub.contactInfo || '');
        setFacultyCoordinator(foundClub.facultyCoordinator || '');
        setLogo(foundClub.logo || '');
        setGithub(foundClub.socialLinks?.github || '');
        setLinkedin(foundClub.socialLinks?.linkedin || '');
        setWebsite(foundClub.socialLinks?.website || '');
      }
    } catch {
      // It's fine if no club is found
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name || !description || !category) {
      setError('Name, Description, and Category are required fields.');
      return;
    }

    const payload = {
      name,
      description,
      category,
      contactInfo,
      facultyCoordinator,
      logo,
      socialLinks: {
        github,
        linkedin,
        website
      }
    };

    setSubmitting(true);
    try {
      if (club) {
        // Update club
        const res = await api.patch(`/clubs/${club._id}`, payload);
        setSuccessMsg('Club profile updated successfully.');
        setClub(res.data.data.club);
      } else {
        // Register new club
        const res = await api.post('/clubs', payload);
        setSuccessMsg('Club registered successfully and is pending approval.');
        setClub(res.data.data.club);
      }
    } catch (err) {
      setError(err.message || 'Failed to save club configurations.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            {club ? 'Club Profile Settings' : 'Register New Club'}
          </h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            {club
              ? 'Modify details and update contact information.'
              : 'Register a digital club to host university hackathons.'}
          </p>
        </div>
        {club && (
          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${
            club.status === 'approved'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {club.status}
          </span>
        )}
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-4">
          <Input
            label="Club Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting || !!club}
            required
            placeholder="Coding Club Hogwarts"
          />

          <div className="flex flex-col text-left">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="Explain the purpose, projects, and activities of the club..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              required
              rows="3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
              required
              placeholder="Technology / Cultural / Sports"
            />

            <Input
              label="Faculty Advisor/Coordinator"
              value={facultyCoordinator}
              onChange={(e) => setFacultyCoordinator(e.target.value)}
              disabled={submitting}
              placeholder="Professor McGonagall"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Info"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              disabled={submitting}
              placeholder="contact@hogwartscoding.org"
            />

            <Input
              label="Club Logo URL"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              disabled={submitting}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <hr className="border-slate-100" />

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Social Links</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="GitHub Link"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                disabled={submitting}
                placeholder="https://github.com/club"
              />
              <Input
                label="LinkedIn Link"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                disabled={submitting}
                placeholder="https://linkedin.com/company/club"
              />
              <Input
                label="Website URL"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={submitting}
                placeholder="https://club.com"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center space-x-2">
          <Button type="submit" loading={submitting}>
            {club ? 'Save Profile' : 'Register Club'}
          </Button>
          <Button variant="outline" disabled={submitting} onClick={() => navigate('/club/dashboard')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClubProfile;
