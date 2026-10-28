import { lazy, Suspense, useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const DashboardCharts = lazy(() => import('./DashboardCharts'));

const requestStats = async (range = {}) => {
  const params = new URLSearchParams();
  if (range.from) params.append('from', range.from);
  if (range.to) params.append('to', range.to);
  const { data } = await api.get(`/stats?${params.toString()}`);
  return data;
};

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: '', to: '' });
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      setStats(await requestStats(range));
    } catch (err) {
      setError(err.response?.data?.message || 'Stats load fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    let active = true;
    const loadStats = async () => {
      try {
        const data = await requestStats();
        if (active) setStats(data);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Stats load fail');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStats();
    return () => { active = false; };
  }, [user, navigate]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">From</label>
            <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="border p-2 rounded" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To</label>
            <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="border p-2 rounded" />
          </div>
          <button onClick={fetchStats} className="bg-blue-700 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800">Apply Filter</button>
          <button onClick={() => { setRange({ from: '', to: '' }); setTimeout(fetchStats, 50); }} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Reset</button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {loading || !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-white h-28 rounded shadow animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">Total Rooms</p>
                <p className="text-2xl font-bold text-blue-700">{stats.summary.totalRooms}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-green-600">{stats.summary.totalBookings}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">Guests</p>
                <p className="text-2xl font-bold text-purple-600">{stats.summary.totalGuests}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">Revenue</p>
                <p className="text-2xl font-bold text-yellow-600">PKR {stats.summary.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm">Occupancy</p>
                <p className="text-2xl font-bold text-red-600">{stats.summary.occupancyRate}%</p>
              </div>
            </div>

            <Suspense fallback={<div className="text-center py-8">Loading charts...</div>}>
              <DashboardCharts stats={stats} />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}