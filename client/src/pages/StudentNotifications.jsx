import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inbox Notifications</h1>
        <p className="text-slate-400 font-medium text-xs mt-1">
          Stay updated on your quiz status, hackathon scorecards, and invitations.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {notifications.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 font-semibold">
          No notifications found in your inbox.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const isRead = notif.isRead;

            return (
              <div
                key={notif._id}
                className={`bg-white rounded-xl border shadow-sm p-6 text-left hover:shadow-md transition-shadow flex items-start justify-between gap-4 ${
                  isRead ? 'border-slate-100 opacity-75' : 'border-emerald-100 bg-emerald-50/10'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {notif.type?.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{notif.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                {!isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif._id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors focus:outline-none"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
