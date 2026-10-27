import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = {
    guest: [
      { to: '/rooms', label: '🛏️ Browse Rooms', color: 'bg-blue-500' },
      { to: '/my-bookings', label: '📅 My Bookings', color: 'bg-green-500' }
    ],
    receptionist: [
      { to: '/receptionist', label: '🛎️ Receptionist Panel', color: 'bg-green-500' },
      { to: '/rooms', label: '🛏️ All Rooms', color: 'bg-blue-500' }
    ],
    admin: [
      { to: '/dashboard', label: '📊 Admin Dashboard', color: 'bg-purple-600' },
      { to: '/admin', label: '🏨 Manage Rooms', color: 'bg-blue-500' },
      { to: '/services', label: '🧺 Services', color: 'bg-yellow-500' },
      { to: '/receptionist', label: '🛎️ Receptionist', color: 'bg-green-500' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow">
        <h1 className="font-bold text-xl">🏨 Zenvio Hotel Management</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">{user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-sm font-semibold hover:bg-red-600">Logout</button>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">Welcome, {user?.name}!</h2>
        <p className="text-blue-100 max-w-xl mx-auto">Your hotel management workspace.</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(links[user?.role] || []).map((l, i) => (
            <Link key={i} to={l.to} className={`${l.color} text-white p-6 rounded-lg shadow hover:shadow-lg transition text-center text-lg font-semibold`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}