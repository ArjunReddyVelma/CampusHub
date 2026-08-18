import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        setAnnouncements(res.data.data.announcements || []);
      } catch (err) {
        setError(err.message || 'Failed to retrieve announcements');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Announcements</h1>
        <p className="text-slate-400 font-medium text-xs mt-1">
          Stay updated with class notifications and club-scoped announcements.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {announcements.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 font-semibold">
          No announcements have been posted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isClub = ann.scope === 'club';
            const isClass = ann.scope === 'class';

            let scopeBadge = (
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase rounded-full">
                Global
              </span>
            );

            if (isClub) {
              scopeBadge = (
                <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold uppercase rounded-full">
                  Club Scoped: {ann.targetClub?.name || 'Club Event'}
                </span>
              );
            } else if (isClass) {
              scopeBadge = (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase rounded-full">
                  Class Scoped
                </span>
              );
            }

            return (
              <div key={ann._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-left hover:shadow-md transition-shadow space-y-3">
                <div className="flex items-center justify-between">
                  {scopeBadge}
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">{ann.title}</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">
                    {ann.content}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Author: {ann.author?.name || 'System Admin'}</span>
                  <span>Role: {ann.author?.role || 'Admin'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
