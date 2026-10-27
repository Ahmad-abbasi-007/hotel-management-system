import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    selectedServices: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomRes, serviceRes] = await Promise.all([
          api.get(`/rooms/${id}`),
          api.get('/services')
        ]);
        setRoom(roomRes.data);
        setServices(serviceRes.data);
      } catch (err) {
        setError('Room load nahi ho saka');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Price calculation (live preview)
  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;
  const subtotal = nights * (room?.price || 0);
  const servicesTotal = form.selectedServices.reduce((sum, sid) => {
    const s = services.find(x => x._id === sid);
    return sum + (s?.price || 0);
  }, 0);
  const tax = Math.round((subtotal + servicesTotal) * 0.1);
  const total = subtotal + servicesTotal + tax;

  const toggleService = (sid) => {
    setForm(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(sid)
        ? prev.selectedServices.filter(x => x !== sid)
        : [...prev.selectedServices, sid]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.checkIn || !form.checkOut) {
      setError('Check-in aur check-out dates select karo');
      return;
    }
    if (nights <= 0) {
      setError('Check-out check-in ke baad hona chahiye');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/bookings', {
        roomId: room._id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        serviceIds: form.selectedServices
      });
      navigate('/my-bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking fail ho gayi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!room) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Room not found</div>;
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center">
        <h1 className="font-bold text-xl">🏨 Room Details</h1>
        <Link to="/rooms" className="text-sm bg-white text-blue-700 px-3 py-1 rounded font-semibold">← Back</Link>
      </nav>

      <div className="max-w-4xl mx-auto p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white text-6xl mb-4">
            🛏️
          </div>
          <h2 className="text-2xl font-bold">Room {room.roomNumber}</h2>
          <p className="text-gray-600">{room.type} • {room.capacity} guests</p>
          <p className="text-blue-700 font-bold text-xl mt-2">PKR {room.price}/night</p>
          {room.description && <p className="text-sm text-gray-500 mt-3">{room.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {room.amenities?.map((a, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{a}</span>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Book This Room</h3>

          {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}

          <label className="block text-sm font-medium mb-1">Check-in</label>
          <input
            type="date"
            min={today}
            value={form.checkIn}
            onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
            required
            className="w-full border p-2 rounded mb-3"
          />

          <label className="block text-sm font-medium mb-1">Check-out</label>
          <input
            type="date"
            min={form.checkIn || today}
            value={form.checkOut}
            onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
            required
            className="w-full border p-2 rounded mb-3"
          />

          {services.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-2">Add Services (optional)</p>
              <div className="space-y-1">
                {services.map(s => (
                  <label key={s._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.selectedServices.includes(s._id)}
                      onChange={() => toggleService(s._id)}
                    />
                    {s.name} — PKR {s.price}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Live Price Summary */}
          {nights > 0 && (
            <div className="bg-gray-50 rounded p-3 text-sm space-y-1 mb-3">
              <div className="flex justify-between"><span>{nights} nights × PKR {room.price}</span><span>PKR {subtotal}</span></div>
              {servicesTotal > 0 && <div className="flex justify-between"><span>Services</span><span>PKR {servicesTotal}</span></div>}
              <div className="flex justify-between"><span>Tax (10%)</span><span>PKR {tax}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>PKR {total}</span></div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || room.status !== 'Available'}
            className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting ? 'Booking...' : `Confirm Booking${total ? ` — PKR ${total}` : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}