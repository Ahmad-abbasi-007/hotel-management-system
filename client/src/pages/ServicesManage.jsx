import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const requestServices = async () => {
  const { data } = await api.get('/services');
  return data;
};

export default function ServicesManage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', description: '' });
  const [message, setMessage] = useState(null);

  const fetchServices = async () => {
    setServices(await requestServices());
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    let active = true;
    const loadServices = async () => {
      try {
        const data = await requestServices();
        if (active) setServices(data);
      } catch (err) {
        if (active) setMessage({ type: 'error', text: err.response?.data?.message || 'Services load nahi ho sakin' });
      }
    };
    loadServices();
    return () => { active = false; };
  }, [user, navigate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', { ...form, price: Number(form.price) });
      setForm({ name: '', price: '', description: '' });
      setMessage({ type: 'success', text: 'Service added' });
      fetchServices();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Add Service</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Service name" required className="border p-2 rounded" />
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price (PKR)" required className="border p-2 rounded" />
            <button type="submit" className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800">Add Service</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Available Services ({services.length})</h2>
          {services.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No services yet</p>
          ) : (
            <ul className="divide-y">
              {services.map(s => (
                <li key={s._id} className="py-3 flex justify-between">
                  <span>{s.name}</span>
                  <span className="font-semibold text-blue-700">PKR {s.price}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}