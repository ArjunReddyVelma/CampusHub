import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const StudentTeams = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const hackathonId = searchParams.get('hackathonId');

  const [team, setTeam] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeamAndInvites = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [invitesRes] = await Promise.all([
        api.get('/team-invitations')
      ]);
      setInvitations(invitesRes.data.data.invitations || []);

      if (hackathonId) {
        // Fetch hackathon details
        const hackathonRes = await api.get(`/hackathons/${hackathonId}`);
        setHackathon(hackathonRes.data.data.hackathon);

        // Fetch user's active team for this hackathon
        try {
          const teamRes = await api.get(`/teams/my-team?hackathonId=${hackathonId}`);
          setTeam(teamRes.data.data.team || null);
        } catch {
          // It's fine if no team is found (404/400)
          setTeam(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchTeamAndInvites();
  }, [fetchTeamAndInvites]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/hackathons/${hackathonId}/teams`, {
        name: teamName,
        description: teamDesc
      });
      setTeamName('');
      setTeamDesc('');
      await fetchTeamAndInvites();
    } catch (err) {
      setError(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/teams/${team._id}/invite`, { inviteeEmail: inviteEmail });
      setInviteEmail('');
      alert('Invitation sent successfully!');
      await fetchTeamAndInvites();
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    setError('');
    try {
      await api.post(`/teams/${team._id}/members/${memberId}/remove`);
      await fetchTeamAndInvites();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    setError('');
    try {
      await api.post(`/teams/${team._id}/leave`);
      await fetchTeamAndInvites();
    } catch (err) {
      setError(err.message || 'Failed to leave team');
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    setError('');
    try {
      await api.post(`/team-invitations/${inviteId}/accept`);
      alert('Invitation accepted!');
      await fetchTeamAndInvites();
    } catch (err) {
      setError(err.message || 'Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (inviteId) => {
    setError('');
    try {
      await api.post(`/team-invitations/${inviteId}/reject`);
      alert('Invitation declined!');
      await fetchTeamAndInvites();
    } catch (err) {
      setError(err.message || 'Failed to decline invitation');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const isLeader = team && team.leader?._id === user?._id;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Team Management</h1>
        <p className="text-slate-400 font-medium text-xs mt-1">
          Create hackathon teams, manage members, or respond to pending invitations.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* 1. Context Specific Team Section */}
      {hackathonId ? (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Registration for: <span className="text-emerald-600">{hackathon?.title}</span>
            </h2>
            <Link to="/student/hackathons" className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Change Hackathon
            </Link>
          </div>

          {team ? (
            /* User is already in a team for this hackathon */
            <div className="space-y-6">
              <div className="border-l-4 border-emerald-500 pl-4 space-y-1">
                <h3 className="text-base font-black text-slate-800">{team.name}</h3>
                <p className="text-sm text-slate-500 font-medium">{team.description}</p>
                <div className="pt-1 flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase rounded">
                    Status: {team.status}
                  </span>
                  {isLeader && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase rounded">
                      You are Leader
                    </span>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team Members</h4>
                <div className="divide-y divide-slate-100">
                  {team.members.map((member) => (
                    <div key={member._id} className="py-3 flex items-center justify-between text-sm font-semibold">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-600 font-bold uppercase">
                          {member.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-slate-800 leading-tight">{member.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{member.email}</p>
                        </div>
                      </div>
                      <div>
                        {member._id === team.leader?._id ? (
                          <span className="text-xs text-slate-400 font-bold">Leader</span>
                        ) : isLeader ? (
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leader Invites Panel */}
              {isLeader && (
                <form onSubmit={handleInviteMember} className="pt-4 border-t border-slate-100 max-w-md space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invite Member by Email</h4>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="peer@university.edu"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={submitting}
                        required
                      />
                    </div>
                    <Button type="submit" loading={submitting}>
                      Invite
                    </Button>
                  </div>
                </form>
              )}

              {/* Leave Team (Non-leaders) */}
              {!isLeader && (
                <div className="pt-4 border-t border-slate-100">
                  <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={handleLeaveTeam}>
                    Leave Team
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* User does not have a team: Render Form */
            <form onSubmit={handleCreateTeam} className="space-y-4 max-w-md">
              <h3 className="text-sm font-bold text-slate-800">You don't have a team yet. Create one!</h3>
              <Input
                label="Team Name"
                placeholder="Gryffindor Coders"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={submitting}
                required
              />
              <div className="flex flex-col text-left">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Pitch details or technical components of your group..."
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  disabled={submitting}
                  rows="3"
                />
              </div>
              <Button type="submit" loading={submitting}>
                Create & Join Team
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold">
          Select a hackathon from the{' '}
          <Link to="/student/hackathons" className="text-emerald-600 font-bold hover:underline">
            Hackathons view
          </Link>{' '}
          to manage or create your team.
        </div>
      )}

      {/* 2. Received Invitations Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
          Received Team Invitations
        </h2>

        {invitations.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400">No pending team invitations received.</p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invite) => (
              <div key={invite._id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Team: <span className="text-indigo-600">{invite.team?.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Event: {invite.team?.hackathon?.title} | Invited by: {invite.inviter?.name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcceptInvite(invite._id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite._id)}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTeams;
