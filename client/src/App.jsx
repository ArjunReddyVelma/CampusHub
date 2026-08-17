import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const response = await axios.get(`${apiUrl}/health`);
        setHealth(response.data);
      } catch (err) {
        console.error('Error fetching health:', err);
        setHealth({ success: false, message: 'Could not connect to API server' });
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full border border-slate-100 text-center">
        <h1 className="text-3xl font-extrabold text-emerald-600 mb-2">CampusHub</h1>
        <p className="text-slate-500 mb-6 font-medium">University Digital Activity & Assessment Platform</p>
        
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Backend Connection Status</div>
          {loading ? (
            <div className="flex items-center text-slate-500 text-sm">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse mr-2"></div>
              Checking backend connection...
            </div>
          ) : health?.success ? (
            <div className="flex items-center text-emerald-600 text-sm font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
              {health.message}
            </div>
          ) : (
            <div className="flex items-center text-rose-600 text-sm font-semibold">
              <div className="w-2 h-2 rounded-full bg-rose-500 mr-2"></div>
              {health?.message || 'Offline'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
