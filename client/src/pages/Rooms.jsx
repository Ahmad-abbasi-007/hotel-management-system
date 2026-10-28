import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', maxPrice: '', capacity: '' });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get('/rooms');
        setRooms(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const filtered = rooms.filter((r) => {
    if (filters.type && r.type !== filters.type) return false;
    if (filters.maxPrice && r.price > Number(filters.maxPrice)) return false;
    if (filters.capacity && r.capacity < Number(filters.capacity)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Available Rooms
        </h2>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Types</option>
            <option>Single</option>
            <option>Double</option>
            <option>Deluxe</option>
            <option>Suite</option>
          </select>
          <input
            type="number"
            placeholder="Max price (PKR)"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="number"
            placeholder="Min capacity"
            value={filters.capacity}
            onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow h-72 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-gray-500">Koi room nahi mila. Filters change karo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                {/* IMAGE — uploaded image if exists, else gradient placeholder */}
                {room.image ? (
                  <img
                    src={room.image}
                    alt={`Room ${room.roomNumber}`}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl">
                    🛏️
                  </div>
                )}

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">Room {room.roomNumber}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        room.status === 'Available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {room.type} • {room.capacity} guests
                  </p>
                  <p className="text-blue-700 font-bold text-lg mt-2">
                    PKR {room.price}
                    <span className="text-sm font-normal text-gray-500">/night</span>
                  </p>
                  <button
                    onClick={() => navigate(`/rooms/${room._id}`)}
                    disabled={room.status !== 'Available'}
                    className="mt-3 w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 disabled:opacity-50"
                  >
                    {room.status === 'Available' ? 'Book Now' : 'Not Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}