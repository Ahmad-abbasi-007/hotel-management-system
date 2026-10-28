import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const requestBookings = async () => {
  const { data } = await api.get('/bookings/my');
  return data;
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setBookings(await requestBookings());
    } catch {
      setMessage({ type: 'error', text: 'Bookings load nahi ho sakin' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadBookings = async () => {
      try {
        const data = await requestBookings();
        if (active) setBookings(data);
      } catch {
        if (active) setMessage({ type: 'error', text: 'Bookings load nahi ho sakin' });
      } finally {
        if (active) setLoading(false);
      }
    };
    loadBookings();
    return () => { active = false; };
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Booking cancel karni hai?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setMessage({ type: 'success', text: 'Booking cancelled' });
      fetchBookings();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Cancel fail' });
    }
  };

  const handleDownloadInvoice = async (bookingId) => {
    setDownloadingId(bookingId);
    try {
      const res = await api.get(`/invoice/${bookingId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: 'error', text: 'Invoice download fail ho gaya' });
    } finally {
      setDownloadingId(null);
    }
  };

  const statusColor = (s) =>
    ({
      Confirmed: 'bg-blue-100 text-blue-700',
      CheckedIn: 'bg-green-100 text-green-700',
      CheckedOut: 'bg-gray-100 text-gray-700',
      Cancelled: 'bg-red-100 text-red-700'
    }[s] || 'bg-gray-100');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6">My Bookings ({bookings.length})</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white h-32 rounded animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-5xl mb-3">📅</p>
            <p className="text-gray-500 mb-4">Koi booking nahi hai abhi</p>
            <Link
              to="/rooms"
              className="bg-blue-700 text-white px-4 py-2 rounded font-semibold inline-block"
            >
              Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-lg">
                      Room {b.room?.roomNumber} — {b.room?.type}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(b.checkIn).toLocaleDateString()} →{' '}
                      {new Date(b.checkOut).toLocaleDateString()} ({b.nights} nights)
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${statusColor(b.status)}`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="mt-2 text-sm">
                  <p>
                    Total:{' '}
                    <span className="font-bold text-blue-700">
                      PKR {b.totalPrice}
                    </span>{' '}
                    (incl. tax PKR {b.tax})
                  </p>
                  {b.services?.length > 0 && (
                    <p className="text-gray-500">
                      Services: {b.services.map((s) => s.name).join(', ')}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status === 'Confirmed' && (
                    <button
                      onClick={() => handleCancel(b._id)}
                      className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {['Confirmed', 'CheckedIn', 'CheckedOut'].includes(b.status) && (
                    <button
                      onClick={() => handleDownloadInvoice(b._id)}
                      disabled={downloadingId === b._id}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      {downloadingId === b._id
                        ? '⏳ Downloading...'
                        : '📄 Download Invoice'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}