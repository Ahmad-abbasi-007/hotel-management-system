import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'guest' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      alert('Registered! Now login');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-96">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        <input className="w-full border p-2 mb-3" placeholder="Name" onChange={e=>setForm({...form, name: e.target.value})} />
        <input className="w-full border p-2 mb-3" placeholder="Email" onChange={e=>setForm({...form, email: e.target.value})} />
        <input className="w-full border p-2 mb-3" type="password" placeholder="Password" onChange={e=>setForm({...form, password: e.target.value})} />
        <select className="w-full border p-2 mb-3" onChange={e=>setForm({...form, role: e.target.value})}>
          <option value="guest">Guest</option>
          <option value="receptionist">Receptionist</option>
          <option value="admin">Admin</option>
        </select>
        <button className="w-full bg-green-600 text-white p-2 rounded">Register</button>
      </form>
    </div>
  );
}