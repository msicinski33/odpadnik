import React, { useContext, useState, useRef } from 'react';
import { UserContext } from '../UserContext';
import authFetch from '../utils/authFetch';

const API_URL = 'http://localhost:3000/api/users/me';
const AVATAR_URL = 'http://localhost:3000';

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [avatarMsg, setAvatarMsg] = useState('');
  const [avatarErr, setAvatarErr] = useState('');
  const fileInput = useRef();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await authFetch(API_URL, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Aktualizacja nie powiodła się');
      setUser(u => ({ ...u, ...form }));
      setMessage('Profil zaktualizowany!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePwChange = e => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };

  const handlePwSubmit = async e => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    try {
      const res = await authFetch(`${API_URL}/password`, {
        method: 'PUT',
        body: JSON.stringify(pwForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Zmiana hasła nie powiodła się');
      setPwMsg('Hasło zaktualizowane!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwErr(err.message);
    }
  };

  const handleAvatarChange = async e => {
    setAvatarMsg('');
    setAvatarErr('');
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Przesłanie awatara nie powiodło się');
      setUser(u => ({ ...u, avatarUrl: data.avatarUrl }));
      setAvatarMsg('Avatar zaktualizowany!');
      fileInput.current.value = '';
    } catch (err) {
      setAvatarErr(err.message);
    }
  };

  if (!user) return <div className="max-w-sm mx-auto py-12">Nie zalogowano.</div>;

  return (
    <div className="max-w-sm mx-auto py-12 space-y-8">
      <h1 className="text-xl font-bold mb-4">Profil</h1>
      <div className="flex flex-col items-center mb-4">
        {user.avatarUrl && (
          <img src={AVATAR_URL + user.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full mb-2 object-cover border" />
        )}
        <input type="file" accept="image/*" ref={fileInput} onChange={handleAvatarChange} className="mb-2" />
        {avatarMsg && <div className="text-green-600">{avatarMsg}</div>}
        {avatarErr && <div className="text-red-500">{avatarErr}</div>}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded shadow">
        <div>
          <label className="block mb-1">Imię</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
        </div>
        {message && <div className="text-green-600">{message}</div>}
        {error && <div className="text-red-500">{error}</div>}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">Zapisz</button>
      </form>
      <form onSubmit={handlePwSubmit} className="space-y-4 bg-gray-50 p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-2">Zmień hasło</h2>
        <div>
          <label className="block mb-2">Aktualne hasło</label>
          <input name="currentPassword" type="password" value={pwForm.currentPassword} onChange={handlePwChange} className="w-full border px-2 py-1 rounded" required />
        </div>
        <div>
          <label className="block mb-2">Nowe hasło</label>
          <input name="newPassword" type="password" value={pwForm.newPassword} onChange={handlePwChange} className="w-full border px-2 py-1 rounded" required />
        </div>
        <div>
          <label className="block mb-2">Powtórz nowe hasło</label>
          <input name="repeatNewPassword" type="password" className="w-full border px-2 py-1 rounded" required />
        </div>
        {pwMsg && <div className="text-green-600">{pwMsg}</div>}
        {pwErr && <div className="text-red-500">{pwErr}</div>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Zmień hasło</button>
      </form>
      {pwMsg && <div className="text-green-600 mt-2">Hasło zmienione</div>}
      {pwErr && <div className="text-red-600 mt-2">Błąd: {pwErr}</div>}
    </div>
  );
};

export default Profile; 