import React from 'react';

const ClubDashboard = () => {

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Club Manager Console
        </h1>
        <p className="mt-2 text-teal-100 font-medium text-sm md:text-base max-w-xl">
          Promote your digital university club, invite student members, launch active hackathons, and evaluate project submissions.
        </p>
      </div>

      <div className="p-8 bg-white border border-slate-100 shadow-sm rounded-xl text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Hackathon Management & Club Profiles</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          We are building the hackathon creator wizard, sponsor/prize tables, and registration moderation lists in the next phase!
        </p>
        <div className="mt-4 inline-block px-3 py-1 bg-teal-50 border border-teal-100 text-teal-600 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">
          Coming Next
        </div>
      </div>
    </div>
  );
};

export default ClubDashboard;
