import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const StudentHackathons = () => {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await api.get('/hackathons');
        setHackathons(res.data.data.hackathons || []);
      } catch (err) {
        setError(err.message || 'Failed to retrieve hackathons data');
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Clubs Hackathons</h1>
        <p className="text-slate-400 font-medium text-xs mt-1">
          Explore published hackathons, form teams, and submit your coding solutions.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {hackathons.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 font-semibold">
          No published hackathons are currently running.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hackathons.map((hackathon) => {
            const now = new Date();
            const regDeadline = new Date(hackathon.registrationDeadline);
            const subDeadline = new Date(hackathon.submissionDeadline);
            const isRegOpen = now <= regDeadline;
            const isSubOpen = now <= subDeadline;

            return (
              <div key={hackathon._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow text-left">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide rounded-full">
                      {hackathon.club?.name || 'Club Event'}
                    </span>
                    {isRegOpen ? (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">
                        Registrations Open
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">
                        Registrations Closed
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-800">{hackathon.title}</h3>
                    <p className="text-slate-400 text-xs font-semibold mt-1.5 leading-relaxed">
                      {hackathon.description}
                    </p>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-xs font-semibold text-slate-600">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                      Problem Statement
                    </div>
                    <p className="text-slate-500 italic font-medium leading-relaxed">
                      "{hackathon.problemStatement}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                    <div>
                      <span className="text-slate-400 block font-medium">Team Limits:</span>
                      {hackathon.minTeamSize} to {hackathon.maxTeamSize} Members
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Location:</span>
                      <span className="capitalize">{hackathon.locationType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Registration Deadline:</span>
                      {regDeadline.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Submission Deadline:</span>
                      {subDeadline.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-3">
                  <Button
                    variant={isRegOpen ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => navigate(`/student/teams?hackathonId=${hackathon._id}`)}
                  >
                    {isRegOpen ? 'Manage Registration / Teams' : 'View Team Details'}
                  </Button>
                  {isSubOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/student/submissions?hackathonId=${hackathon._id}`)}
                    >
                      Submit Project
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentHackathons;
