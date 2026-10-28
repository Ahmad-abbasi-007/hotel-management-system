import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const requestReceptionistData = async () => Promise.all([
  api.get('/bookings'),
  api.get('/rooms')
]);

export default function ReceptionistPanel() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [walkin, setWalkin] = useState({
    guestEmail: '',
    roomId: '',
    checkIn: '',
    checkOut: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, rRes] = await requestReceptionistData();
      setBookings(bRes.data);
      setRooms(rRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !['receptionist', 'admin'].includes(user.role)) {
      navigate('/');
      return;
    }
    let active = true;
    const loadData = async () => {
      try {
        const [bRes, rRes] = await requestReceptionistData();
        if (active) {
          setBookings(bRes.data);
          setRooms(rRes.data);
        }
      } catch (err) {
        if (active) console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, [user, navigate]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      setMessage({ type: 'success', text: `Booking marked as ${status}` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const handleWalkin = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      // If guest email provided, we could create guest - simplified: require logged in as receptionist creating for self
      await api.post('/bookings', {
        roomId: walkin.roomId,
        checkIn: walkin.checkIn,
        checkOut: walkin.checkOut,
        serviceIds: []
      });
      setMessage({ type: 'success', text: 'Walk-in booking created' });
      setWalkin({ guestEmail: '', roomId: '', checkIn: '', checkOut: '' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Walk-in failed' });
    }
  };

  const statusColor = (s) => ({
    Confirmed: 'bg-blue-100 text-blue-700',
    CheckedIn: 'bg-green-100 text-green-700',
    CheckedOut: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700'
  }[s] || 'bg-gray-100');

  const handleLogout = () => { logout(); navigate('/login'); };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>{message.text}</div>
        )}

        {/* Walk-in booking */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Create Walk-in Booking</h2>
          <form onSubmit={handleWalkin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={walkin.roomId}
              onChange={(e) => setWalkin({ ...walkin, roomId: e.target.value })}
              required
              className="border p-2 rounded"
            >
              <option value="">Select Room</option>
              {rooms.filter(r => r.status === 'Available').map(r => (
                <option key={r._id} value={r._id}>
                  Room {r.roomNumber} ({r.type}) — PKR {r.price}
                </option>
              ))}
            </select>
            <input
              type="date" min={today}
              value={walkin.checkIn}
              onChange={(e) => setWalkin({ ...walkin, checkIn: e.target.value })}
              required
              className="border p-2 rounded"
            />
            <input
              type="date" min={walkin.checkIn || today}
              value={walkin.checkOut}
              onChange={(e) => setWalkin({ ...walkin, checkOut: e.target.value })}
              required
              className="border p-2 rounded"
            />
            <button type="submit" className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800">
              Create Booking
            </button>
          </form>
        </div>

        {/* Bookings table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">All Bookings ({bookings.length})</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />)}
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2">Guest</th>
                    <th className="p-2">Room</th>
                    <th className="p-2">Dates</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} className="border-t">
                      <td className="p-2">{b.guest?.name || 'N/A'}</td>
                      <td className="p-2">{b.room?.roomNumber} ({b.room?.type})</td>
                      <td className="p-2 text-xs">
                        {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                      </td>
                      <td className="p-2 font-semibold">PKR {b.totalPrice}</td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-1 rounded ${statusColor(b.status)}`}>{b.status}</span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {b.status === 'Confirmed' && (
                            <button onClick={() => handleStatusChange(b._id, 'CheckedIn')} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Check In</button>
                          )}
                          {b.status === 'CheckedIn' && (
                            <button onClick={() => handleStatusChange(b._id, 'CheckedOut')} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Check Out</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}