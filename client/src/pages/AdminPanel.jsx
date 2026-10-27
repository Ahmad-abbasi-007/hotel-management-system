import { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const EMPTY_FORM = {
  roomNumber: '',
  type: 'Single',
  price: '',
  capacity: 2,
  description: '',
  image: ''
};

export default function AdminPanel() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Rooms load nahi ho saken' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetchRooms();
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPG, PNG, WEBP allowed' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Max file size 5MB' });
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post('/upload/room-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm((prev) => ({ ...prev, image: data.url }));
      setMessage({ type: 'success', text: 'Image uploaded ✅' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/rooms', {
        ...form,
        price: Number(form.price),
        capacity: Number(form.capacity)
      });
      setForm(EMPTY_FORM);
      setMessage({ type: 'success', text: 'Room add ho gaya ✅' });
      fetchRooms();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Room add fail' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ye room delete karna hai?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      setMessage({ type: 'success', text: 'Room delete ho gaya' });
      fetchRooms();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete fail' });
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow">
        <h1 className="font-bold text-xl">🏨 Admin - Manage Rooms</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/" className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-semibold">Home</Link>
          <Link to="/dashboard" className="bg-purple-600 px-3 py-1 rounded text-sm font-semibold">Dashboard</Link>
          <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-sm font-semibold">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>{message.text}</div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Naya Room Add Karo</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="Room Number" required className="border p-2 rounded" />
            <select name="type" value={form.type} onChange={handleChange} className="border p-2 rounded">
              <option>Single</option><option>Double</option><option>Deluxe</option><option>Suite</option>
            </select>
            <input name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="Price per night" required className="border p-2 rounded" />
            <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} placeholder="Capacity" className="border p-2 rounded" />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows="2" className="border p-2 rounded sm:col-span-2" />

            {/* Image Upload */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Room Image (JPG/PNG/WEBP, max 5MB)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={uploading}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
              {form.image && (
                <div className="mt-3 relative w-32 h-32">
                  <img src={form.image} alt="preview" className="w-full h-full object-cover rounded border" />
                  <button type="button" onClick={() => setForm({ ...form, image: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs">✕</button>
                </div>
              )}
            </div>

            <button type="submit" disabled={saving}
              className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 disabled:opacity-50 sm:col-span-2">
              {saving ? 'Saving...' : 'Add Room'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">All Rooms ({rooms.length})</h2>
            <button onClick={fetchRooms} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">🔄 Refresh</button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-gray-200 h-48 rounded" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-2">🏨</p>
              <p>Koi room nahi hai. Upar form se pehla room add karo!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div key={room._id} className="border rounded-lg overflow-hidden hover:shadow transition bg-white">
                  {room.image ? (
                    <img src={room.image} alt={`Room ${room.roomNumber}`} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl">🛏️</div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg">Room {room.roomNumber}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        room.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{room.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">{room.type} • {room.capacity} guests</p>
                    <p className="text-blue-700 font-bold mt-1">PKR {room.price}/night</p>
                    <button onClick={() => handleDelete(room._id)}
                      className="mt-3 text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 w-full">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}