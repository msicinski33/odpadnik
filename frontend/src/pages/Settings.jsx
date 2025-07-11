import React, { useContext, useState } from 'react';
import { UserContext } from '../UserContext';
import authFetch from '../utils/authFetch';

const Settings = () => {
  const { user } = useContext(UserContext);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'user' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await authFetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Błąd podczas tworzenia użytkownika');
      setMessage('Użytkownik został utworzony!');
      setForm({ email: '', name: '', password: '', role: 'user' });
    } catch (err) {
      setError(err.message || 'Błąd');
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="max-w-xl mx-auto py-8"><h1 className="text-xl font-bold mb-4">Ustawienia</h1><div className="text-gray-500">Brak dostępu</div></div>;
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-xl font-bold mb-4">Ustawienia</h1>
      <h2 className="text-lg font-semibold mb-2">Stwórz nowego użytkownika</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded shadow">
        <div>
          <label className="block mb-2">Email</label>
          <input name="email" value={form.email} onChange={handleChange} className="w-full border px-2 py-1 rounded" type="email" required />
        </div>
        <div>
          <label className="block mb-2">Imię i nazwisko</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
        </div>
        <div>
          <label className="block mb-2">Hasło</label>
          <input name="password" value={form.password} onChange={handleChange} className="w-full border px-2 py-1 rounded" type="password" required />
        </div>
        <div>
          <label className="block mb-2">Rola</label>
          <select name="role" value={form.role} onChange={handleChange} className="w-full border px-2 py-1 rounded">
            <option value="user">Użytkownik</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        {message && <div className="text-green-600">{message}</div>}
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Stwórz użytkownika</button>
      </form>
    </div>
  );
};

export default Settings; 