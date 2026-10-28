import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user } = useContext(AuthContext);

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Guest';
  const role = user?.role || 'guest';

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Rooms are always fetched
        const roomsPromise = api.get('/rooms');

        let rolePromise = Promise.resolve({ data: null });
        if (role === 'guest') {
          rolePromise = api.get('/bookings/my');
        } else if (role === 'receptionist') {
          rolePromise = api.get('/bookings');
        } else if (role === 'admin') {
          rolePromise = api.get('/stats');
        }

        const [roomsRes, roleRes] = await Promise.all([roomsPromise, rolePromise]);

        if (!isMounted) return;

        setRooms(roomsRes.data || []);

        if (role === 'guest' || role === 'receptionist') {
          setBookings(roleRes.data || []);
        } else if (role === 'admin') {
          setStats(roleRes.data || null);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [role]);

  // Format currency helpers (e.g. PKR 500K)
  const formatRevenue = (amount) => {
    if (!amount && amount !== 0) return 'PKR 0';
    if (amount >= 1000000) {
      return `PKR ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `PKR ${Math.round(amount / 1000)}K`;
    }
    return `PKR ${amount}`;
  };

  const statusBadge = (status) => {
    const styles = {
      Confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      CheckedIn: 'bg-green-100 text-green-700 border-green-200',
      CheckedOut: 'bg-gray-100 text-gray-700 border-gray-200',
      Cancelled: 'bg-red-100 text-red-700 border-red-200'
    };
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  // Stat calculations
  const totalRoomsCount = rooms.length;
  const availableRoomsCount = rooms.filter((r) => r.status === 'Available').length;
  const activeStaysCount = bookings.filter((b) => b.status === 'CheckedIn').length;
  const pendingCheckinsCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const checkedOutCount = bookings.filter((b) => b.status === 'CheckedOut').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-blue-100 mb-3 border border-white/20">
                <span>🏨</span>
                <span>Zenvio Luxury Hospitality Management</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Hello, {firstName}!
              </h1>
              <p className="mt-2 text-blue-100 text-sm sm:text-base max-w-2xl">
                {role === 'admin' && 'Administrator Dashboard: monitor performance, room inventory, and revenue analytics.'}
                {role === 'receptionist' && 'Receptionist Workspace: check-in guests, view room availability, and handle bookings.'}
                {role === 'guest' && 'Welcome to your hotel portal. Browse luxury suites and manage your reservations effortlessly.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-sm font-medium text-white">
                Role: <strong className="ml-1 uppercase tracking-wider">{role}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* ========================================================= */}
        {/* GUEST DASHBOARD VIEW                                      */}
        {/* ========================================================= */}
        {role === 'guest' && (
          <div className="space-y-8">
            {/* 4 Stat Cards */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Overview</h2>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white h-28 rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Rooms */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Total Rooms</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totalRoomsCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                      🛏️
                    </div>
                  </div>

                  {/* Available Now */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Available Now</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">{availableRoomsCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                      ✨
                    </div>
                  </div>

                  {/* My Bookings */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-indigo-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">My Bookings</p>
                      <p className="text-2xl font-bold text-indigo-600 mt-1">{bookings.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                      📅
                    </div>
                  </div>

                  {/* Active Stays */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Active Stays</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">{activeStaysCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                      🏨
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/rooms"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex items-center justify-between group"
                >
                  <div>
                    <h3 className="text-xl font-bold group-hover:underline">Browse Rooms</h3>
                    <p className="text-blue-100 text-sm mt-1">Explore our deluxe suites, view rates, and book your stay.</p>
                  </div>
                  <span className="text-3xl group-hover:scale-110 transition duration-200">🛏️</span>
                </Link>

                <Link
                  to="/my-bookings"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex items-center justify-between group"
                >
                  <div>
                    <h3 className="text-xl font-bold group-hover:underline">My Bookings</h3>
                    <p className="text-emerald-100 text-sm mt-1">View booking history, download PDF invoices, or manage reservations.</p>
                  </div>
                  <span className="text-3xl group-hover:scale-110 transition duration-200">📑</span>
                </Link>
              </div>
            </div>

            {/* Featured Rooms (first 3 rooms with images) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Featured Rooms</h2>
                <Link to="/rooms" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                  View All Rooms →
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm border border-gray-100" />
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                  <p className="text-4xl mb-2">🛏️</p>
                  <p className="text-gray-500">No rooms available currently.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.slice(0, 3).map((room) => (
                    <div
                      key={room._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col"
                    >
                      {room.image ? (
                        <img
                          src={room.image}
                          alt={`Room ${room.roomNumber}`}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="h-44 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl">
                          🛏️
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-900">Room {room.roomNumber}</h3>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                room.status === 'Available'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {room.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {room.type} • {room.capacity} Guests
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <p className="text-blue-700 font-bold text-lg">
                            PKR {room.price}
                            <span className="text-xs font-normal text-gray-500"> /night</span>
                          </p>
                          <Link
                            to={`/rooms/${room._id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md font-semibold transition"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Bookings (last 3) with status badges */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Bookings</h2>
                {bookings.length > 0 && (
                  <Link to="/my-bookings" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                    View All Bookings →
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white h-20 rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                  <p className="text-4xl mb-2">📅</p>
                  <p className="text-gray-500">You don't have any bookings yet.</p>
                  <Link
                    to="/rooms"
                    className="inline-block mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Find a Room
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                  {bookings.slice(0, 3).map((b) => (
                    <div key={b._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">
                            Room {b.room?.roomNumber} ({b.room?.type})
                          </h3>
                          {statusBadge(b.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} ({b.nights} {b.nights === 1 ? 'night' : 'nights'})
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total Price</p>
                          <p className="text-base font-bold text-blue-700">PKR {b.totalPrice}</p>
                        </div>
                        <Link
                          to="/my-bookings"
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-semibold transition"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* RECEPTIONIST DASHBOARD VIEW                               */}
        {/* ========================================================= */}
        {role === 'receptionist' && (
          <div className="space-y-8">
            {/* 4 Stat Cards */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Front Desk Metrics</h2>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white h-28 rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Pending Check-ins */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Pending Check-ins</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{pendingCheckinsCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                      🛎️
                    </div>
                  </div>

                  {/* In-House Guests */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">In-House Guests</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">{activeStaysCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                      🧳
                    </div>
                  </div>

                  {/* Checked Out */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Checked Out</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">{checkedOutCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                      🚪
                    </div>
                  </div>

                  {/* Available Rooms */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Available Rooms</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">{availableRoomsCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                      🔑
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/receptionist"
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex items-center justify-between group"
                >
                  <div>
                    <h3 className="text-xl font-bold group-hover:underline">Receptionist Panel</h3>
                    <p className="text-emerald-100 text-sm mt-1">Process walk-in bookings, check-in, check-out guests, and manage stays.</p>
                  </div>
                  <span className="text-3xl group-hover:scale-110 transition duration-200">🛎️</span>
                </Link>

                <Link
                  to="/rooms"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex items-center justify-between group"
                >
                  <div>
                    <h3 className="text-xl font-bold group-hover:underline">Room Overview</h3>
                    <p className="text-blue-100 text-sm mt-1">Review live room status, tariffs, amenities, and inventory.</p>
                  </div>
                  <span className="text-3xl group-hover:scale-110 transition duration-200">🛏️</span>
                </Link>
              </div>
            </div>

            {/* Recent Bookings Queue */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Front Desk Activity</h2>
                <Link to="/receptionist" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                  Open Receptionist Panel →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white h-20 rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                  <p className="text-4xl mb-2">📋</p>
                  <p className="text-gray-500">No bookings in the system yet.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                  {bookings.slice(0, 5).map((b) => (
                    <div key={b._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{b.guest?.name || 'Walk-in Guest'}</span>
                          <span className="text-sm text-gray-500">• Room {b.room?.roomNumber} ({b.room?.type})</span>
                          {statusBadge(b.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} ({b.nights} nights)
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="font-bold text-blue-700 text-sm">PKR {b.totalPrice}</span>
                        <Link
                          to="/receptionist"
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md font-semibold transition"
                        >
                          View in Panel
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ADMIN DASHBOARD VIEW                                      */}
        {/* ========================================================= */}
        {role === 'admin' && (
          <div className="space-y-8">
            {/* 5 Stat Cards */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Executive Summary</h2>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white h-28 rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Total Rooms */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Total Rooms</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        {stats?.summary?.totalRooms ?? totalRoomsCount}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                      🏨
                    </div>
                  </div>

                  {/* Bookings */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Bookings</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {stats?.summary?.totalBookings ?? 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                      📑
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Guests</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {stats?.summary?.totalGuests ?? 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                      👥
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Revenue</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        {formatRevenue(stats?.summary?.revenue)}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                      💰
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-rose-500 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Occupancy</p>
                      <p className="text-2xl font-bold text-rose-600 mt-1">
                        {stats?.summary?.occupancyRate ?? 0}%
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
                      📊
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions (4 cards) */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">📊</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Reports</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-lg group-hover:underline">Analytics Dashboard</h3>
                    <p className="text-xs text-purple-100 mt-1">Interactive revenue, room type, and occupancy charts with date filtering.</p>
                  </div>
                </Link>

                <Link
                  to="/admin"
                  className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">🏨</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Inventory</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-lg group-hover:underline">Manage Rooms</h3>
                    <p className="text-xs text-blue-100 mt-1">Add new rooms, upload photos, set pricing, and edit capacity.</p>
                  </div>
                </Link>

                <Link
                  to="/services"
                  className="bg-gradient-to-br from-amber-600 to-orange-700 text-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">🧺</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Add-ons</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-lg group-hover:underline">Services</h3>
                    <p className="text-xs text-amber-100 mt-1">Configure laundry, spa, breakfast, and extra guest amenity rates.</p>
                  </div>
                </Link>

                <Link
                  to="/receptionist"
                  className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">🛎️</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Front Desk</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-lg group-hover:underline">Reception Overview</h3>
                    <p className="text-xs text-emerald-100 mt-1">Oversee current guest stays, walk-in bookings, and check-in statuses.</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Room Inventory Snapshot */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Room Inventory</h2>
                <Link to="/admin" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                  Manage All Rooms →
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white h-24 rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                  <p className="text-4xl mb-2">🏨</p>
                  <p className="text-gray-500">No rooms configured yet.</p>
                  <Link
                    to="/admin"
                    className="inline-block mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Add First Room
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.slice(0, 6).map((r) => (
                    <div key={r._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {r.image ? (
                          <img src={r.image} alt={`Room ${r.roomNumber}`} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                            🛏️
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">Room {r.roomNumber}</p>
                          <p className="text-xs text-gray-500">{r.type} • Cap: {r.capacity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            r.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {r.status}
                        </span>
                        <p className="text-xs font-bold text-blue-700 mt-1">PKR {r.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}