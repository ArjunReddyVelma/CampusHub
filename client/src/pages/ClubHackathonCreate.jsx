import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ClubHackathonCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [banner, setBanner] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [rules, setRules] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [skillsRequired, setSkillsRequired] = useState(''); // comma-separated
  
  // Timings
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');

  // Location
  const [locationType, setLocationType] = useState('online');
  const [location, setLocation] = useState('Online');

  // Team constraints
  const [minTeamSize, setMinTeamSize] = useState('1');
  const [maxTeamSize, setMaxTeamSize] = useState('4');

  // Prizes
  const [prizes, setPrizes] = useState([
    { rank: 1, reward: '', description: '' },
    { rank: 2, reward: '', description: '' },
    { rank: 3, reward: '', description: '' }
  ]);

  useEffect(() => {
    const fetchClubAndDetails = async () => {
      try {
        const clubRes = await api.get('/clubs/my-club');
        const myClub = clubRes.data.data.club;
        if (!myClub) {
          setError('You must establish a club profile before creating hackathons.');
          setLoading(false);
          return;
        }
        if (myClub.status !== 'approved') {
          setError('Only approved clubs can organize hackathons.');
          setLoading(false);
          return;
        }

        if (isEditMode) {
          const hackRes = await api.get(`/hackathons/${id}`);
          const h = hackRes.data.data.hackathon;

          setTitle(h.title || '');
          setDescription(h.description || '');
          setBanner(h.banner || '');
          setProblemStatement(h.problemStatement || '');
          setRules(h.rules || '');
          setEligibility(h.eligibility || '');
          setSkillsRequired(h.skillsRequired?.join(', ') || '');
          setLocationType(h.locationType || 'online');
          setLocation(h.location || 'Online');
          setMinTeamSize(h.minTeamSize?.toString() || '1');
          setMaxTeamSize(h.maxTeamSize?.toString() || '4');

          if (h.prizes && h.prizes.length > 0) {
            setPrizes(h.prizes.map((p) => ({ rank: p.rank, reward: p.reward, description: p.description })));
          }

          // Format datetime ISO string into input local value
          if (h.startDate) setStartDate(new Date(h.startDate).toISOString().slice(0, 16));
          if (h.endDate) setEndDate(new Date(h.endDate).toISOString().slice(0, 16));
          if (h.registrationDeadline) setRegistrationDeadline(new Date(h.registrationDeadline).toISOString().slice(0, 16));
          if (h.submissionDeadline) setSubmissionDeadline(new Date(h.submissionDeadline).toISOString().slice(0, 16));
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize forms.');
      } finally {
        setLoading(false);
      }
    };

    fetchClubAndDetails();
  }, [id, isEditMode]);

  const handlePrizeChange = (index, field, val) => {
    setPrizes((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const handleAddPrize = () => {
    setPrizes((prev) => [...prev, { rank: prev.length + 1, reward: '', description: '' }]);
  };

  const handleRemovePrize = (index) => {
    setPrizes((prev) => prev.filter((_, i) => i !== index).map((p, idx) => ({ ...p, rank: idx + 1 })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field conversions and checks
    const minSize = Number(minTeamSize);
    const maxSize = Number(maxTeamSize);

    if (!title || !description || !problemStatement || !startDate || !endDate || !registrationDeadline || !submissionDeadline) {
      setError('Please fill in all required fields.');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('Event end date must be after event start date.');
      return;
    }

    if (new Date(registrationDeadline) >= new Date(startDate)) {
      setError('Registration deadline must be before event start date.');
      return;
    }

    const subDead = new Date(submissionDeadline);
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    if (subDead <= startD || subDead > endD) {
      setError('Submission deadline must be between event start date and event end date.');
      return;
    }

    if (minSize < 1 || maxSize < 1) {
      setError('Team size limits must be at least 1.');
      return;
    }

    if (maxSize < minSize) {
      setError('Maximum team size cannot be less than minimum team size.');
      return;
    }

    const filteredPrizes = prizes.filter((p) => p.reward.trim().length > 0);

    const payload = {
      title,
      description,
      banner,
      problemStatement,
      rules,
      eligibility,
      skillsRequired: skillsRequired.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline),
      submissionDeadline: new Date(submissionDeadline),
      locationType,
      location,
      minTeamSize: minSize,
      maxTeamSize: maxSize,
      prizes: filteredPrizes
    };

    setSubmitting(true);
    try {
      if (isEditMode) {
        await api.patch(`/hackathons/${id}`, payload);
        alert('Hackathon updated successfully.');
      } else {
        await api.post('/hackathons', payload);
        alert('Hackathon created successfully (draft mode).');
      }
      navigate('/club/hackathons');
    } catch (err) {
      setError(err.message || 'Failed to save hackathon parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            {isEditMode ? 'Modify Hackathon Config' : 'Create Hackathon'}
          </h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Configure timelines, team bounds, problem statement, rules, and rewards.
          </p>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-4">
          <Input
            label="Hackathon Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            required
            placeholder="Campus Coding League Autumn"
          />

          <div className="flex flex-col text-left">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Provide a general summary of the event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              required
              rows="3"
            />
          </div>

          <div className="flex flex-col text-left">
            <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Problem Statement
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Describe the challenges or tracks students will solve..."
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              disabled={submitting}
              required
              rows="3"
            />
          </div>

          {/* Rules & Eligibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col text-left">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Rules & Regulations
              </label>
              <textarea
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Plagiarism rules, team composition bounds, library usage constraints..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                disabled={submitting}
                rows="3"
              />
            </div>

            <div className="flex flex-col text-left">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Eligibility Criteria
              </label>
              <textarea
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Open to CSE undergrads, first-year only, all departments..."
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                disabled={submitting}
                rows="3"
              />
            </div>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
                required
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={submitting}
                required
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Register Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                disabled={submitting}
                required
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Submission Limit <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                disabled={submitting}
                required
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Location & Team bounds */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col text-left">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Location Type
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <Input
              label="Location/Venue"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={submitting}
              required
            />

            <Input
              label="Min Team Size"
              type="number"
              value={minTeamSize}
              onChange={(e) => setMinTeamSize(e.target.value)}
              disabled={submitting}
              required
              min="1"
            />

            <Input
              label="Max Team Size"
              type="number"
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(e.target.value)}
              disabled={submitting}
              required
              min="1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Banner Image URL"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              disabled={submitting}
              placeholder="https://example.com/banner.jpg"
            />

            <Input
              label="Skills Required (Comma separated)"
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              disabled={submitting}
              placeholder="React, Node.js, MongoDB"
            />
          </div>

          <hr className="border-slate-100" />

          {/* Prizes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prize Structure</h3>
              <button
                type="button"
                onClick={handleAddPrize}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Add Reward Rank
              </button>
            </div>

            {prizes.map((p, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b border-slate-50 pb-3">
                <Input
                  label={`Rank #${p.rank} Reward`}
                  value={p.reward}
                  onChange={(e) => handlePrizeChange(idx, 'reward', e.target.value)}
                  disabled={submitting}
                  placeholder="Cash reward, internship offer, Amazon voucher..."
                />
                <Input
                  label="Description/Details"
                  value={p.description}
                  onChange={(e) => handlePrizeChange(idx, 'description', e.target.value)}
                  disabled={submitting}
                  placeholder="Sponsored by campus incubation team"
                />
                {prizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePrize(idx)}
                    className="h-10 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold px-4"
                  >
                    Delete Rank
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center space-x-2">
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Update Hackathon' : 'Create Hackathon'}
          </Button>
          <Button variant="outline" disabled={submitting} onClick={() => navigate('/club/hackathons')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClubHackathonCreate;
