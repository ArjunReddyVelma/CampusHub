import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';

const StudentHackathonDetail = () => {
  const { id } = useParams(); // Hackathon ID
  const { user } = useAuth();

  const [hackathon, setHackathon] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Register Team fields
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // Invite member field
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchDetails = useCallback(async () => {
    try {
      const [hackRes, teamRes] = await Promise.all([
        api.get(`/hackathons/${id}`),
        api.get(`/teams/my-team?hackathonId=${id}`).catch(() => ({ data: { data: { team: null } } }))
      ]);
      setHackathon(hackRes.data.data.hackathon);
      setTeam(teamRes.data.data.team);
    } catch (err) {
      setError(err.message || 'Failed to retrieve hackathon details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    setError('');
    if (!teamName.trim()) {
      setError('Please provide a team name.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/hackathons/${id}/teams`, {
        name: teamName,
        description: teamDesc
      });
      alert('Registered & team created successfully!');
      setTeamName('');
      setTeamDesc('');
      await fetchDetails();
    } catch (err) {
      setError(err.message || 'Failed to register team.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteEmail.trim()) {
      setInviteError('Please provide an email.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/teams/${team._id}/invite`, { inviteeEmail: inviteEmail });
      setInviteSuccess(`Invitation successfully sent to ${inviteEmail}.`);
      setInviteEmail('');
      await fetchDetails();
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!hackathon) {
    return <div className="text-center text-slate-500 font-bold mt-8">Hackathon not found.</div>;
  }

  const now = new Date();
  const deadline = new Date(hackathon.registrationDeadline);
  const isDeadlinePassed = now > deadline;
  const isLeader = team && team.leader?._id === user?.id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
      {/* Hackathon Details Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Hackathon Details</h1>
            <p className="text-slate-400 font-medium text-xs mt-1">
              Organized by <span className="text-emerald-600 font-bold">{hackathon.club?.name || 'Club'}</span>
            </p>
          </div>
          <Link to="/student/hackathons" className="text-xs font-bold text-slate-400 hover:text-slate-600">
            Back to Catalog
          </Link>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {hackathon.banner && (
            <img src={hackathon.banner} alt={hackathon.title} className="w-full h-56 object-cover border-b border-slate-100" />
          )}

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-800">{hackathon.title}</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                Venue: <span className="capitalize">{hackathon.locationType}</span> ({hackathon.location})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Start Date:</span>
                {new Date(hackathon.startDate).toLocaleDateString()}
              </div>
              <div>
                <span className="text-slate-400 block font-medium">End Date:</span>
                {new Date(hackathon.endDate).toLocaleDateString()}
              </div>
              <div className="col-span-2 text-rose-600">
                <span className="text-slate-400 block font-medium">Registration Deadline:</span>
                {deadline.toLocaleString()}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed mt-1">{hackathon.description}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Problem Statement</h3>
                <p className="text-sm text-slate-700 leading-relaxed mt-1">{hackathon.problemStatement}</p>
              </div>

              {hackathon.rules && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rules</h3>
                  <p className="text-sm text-slate-700 leading-relaxed mt-1 whitespace-pre-line">{hackathon.rules}</p>
                </div>
              )}

              {hackathon.eligibility && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eligibility</h3>
                  <p className="text-sm text-slate-700 leading-relaxed mt-1">{hackathon.eligibility}</p>
                </div>
              )}

              {hackathon.skillsRequired && hackathon.skillsRequired.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills Required</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hackathon.skillsRequired.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hackathon.prizes && hackathon.prizes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prizes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {hackathon.prizes.map((p, idx) => (
                      <div key={idx} className="p-4 border border-emerald-100 bg-emerald-50/10 rounded-xl">
                        <span className="text-emerald-700 font-extrabold text-xs block">Rank #{p.rank}</span>
                        <p className="text-slate-800 font-bold text-sm mt-1">{p.reward}</p>
                        {p.description && <p className="text-slate-400 text-xs mt-0.5">{p.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Registration & Invitations Side Panel */}
      <div className="space-y-6">
        {/* State: Student not registered in any team yet */}
        {!team ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800">Registration</h2>
            
            {isDeadlinePassed ? (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-bold">
                Registration deadline has passed.
              </div>
            ) : (
              <form onSubmit={handleRegisterTeam} className="space-y-4">
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Note: Registering for the hackathon requires creating a team. If you wish to compete solo, please create a single-member team.
                </p>

                <Input
                  label="Team Name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={submitting}
                  required
                  placeholder="e.g. Gryffindor Coders"
                />

                <div className="flex flex-col text-left">
                  <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Team Description
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Briefly summarize your team structure..."
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    disabled={submitting}
                    rows="2"
                  />
                </div>

                <div className="pt-2 text-xs font-semibold text-slate-500">
                  Team size bounds for this event: <span className="text-slate-800 font-bold">{hackathon.minTeamSize} to {hackathon.maxTeamSize}</span> members.
                </div>

                <Button type="submit" variant="primary" className="w-full" loading={submitting}>
                  Create Team & Register
                </Button>
              </form>
            )}
          </div>
        ) : (
          /* State: Registered in team */
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Registered Team</span>
              <h2 className="text-base font-bold text-slate-800 leading-tight mt-1">{team.name}</h2>
              {team.description && <p className="text-xs text-slate-400 mt-1 font-semibold">{team.description}</p>}
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-t border-b border-slate-50 py-2.5">
              <span>Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                team.status === 'complete'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                {team.status}
              </span>
            </div>

            {/* Members List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team Members</h3>
              <div className="space-y-2">
                {team.members?.map((m) => {
                  const isLeaderMem = team.leader?._id === m._id;
                  return (
                    <div key={m._id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between text-xs font-semibold">
                      <div>
                        <p className="text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{m.email}</p>
                      </div>
                      {isLeaderMem && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Leader
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invite members section (Only leader can invite, and only in forming state) */}
            {isLeader && team.status === 'forming' && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Invite Member</h3>
                
                {team.members?.length >= hackathon.maxTeamSize ? (
                  <div className="p-3 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">
                    Team size limit of {hackathon.maxTeamSize} reached.
                  </div>
                ) : (
                  <form onSubmit={handleInvite} className="space-y-3">
                    <ErrorMessage message={inviteError} onDismiss={() => setInviteError('')} />
                    {inviteSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                        {inviteSuccess}
                      </div>
                    )}
                    
                    <Input
                      label="Student Email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={submitting}
                      required
                      placeholder="ron@hogwarts.edu"
                    />

                    <Button type="submit" variant="primary" className="w-full" loading={submitting}>
                      Send Invitation
                    </Button>
                  </form>
                )}
              </div>
            )}

            {!isLeader && team.status === 'forming' && (
              <div className="text-xs font-semibold text-slate-400 text-center py-2 border-t border-slate-100">
                Only the team leader can invite members.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHackathonDetail;
