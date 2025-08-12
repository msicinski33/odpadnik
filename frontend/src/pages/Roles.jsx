import React, { useEffect, useState, useContext } from 'react';
import authFetch from '../utils/authFetch';
import { UserContext } from '../UserContext';

const MODULES = [
  'employees', 'vehicles', 'regions', 'points', 'fractions', 'calendar', 'dailyAssignments', 'workorders', 'oneTimeOrders', 'debrisBagOrders', 'damages',
  // New RBAC modules for restricted areas
  'monthlyPlan', 'workCard', 'trasowka'
];
const ACTIONS = ['read', 'create', 'update', 'delete'];

export default function RolesPage() {
  const { user } = useContext(UserContext);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState(new Set());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRoles = async () => {
    const res = await authFetch('http://localhost:3000/api/roles');
    if (!res.ok) return;
    const data = await res.json();
    setRoles(data);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const startCreate = () => {
    setSelectedRole(null);
    setName('');
    setDescription('');
    setPermissions(new Set());
  };

  const startEdit = (role) => {
    setSelectedRole(role);
    setName(role.name);
    setDescription(role.description || '');
    setPermissions(new Set(role.permissions.map(p => `${p.module}:${p.action}`)));
  };

  const togglePerm = (mod, act) => {
    const key = `${mod}:${act}`;
    const next = new Set(permissions);
    if (next.has(key)) next.delete(key); else next.add(key);
    setPermissions(next);
  };

  const saveRole = async () => {
    setError(''); setMessage('');
    try {
      if (!name.trim()) throw new Error('Role name required');
      if (selectedRole) {
        const res = await authFetch(`http://localhost:3000/api/roles/${selectedRole.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, description })
        });
        if (!res.ok) throw new Error('Failed to update role');
      } else {
        const res = await authFetch('http://localhost:3000/api/roles', {
          method: 'POST',
          body: JSON.stringify({ name, description })
        });
        if (!res.ok) throw new Error('Failed to create role');
      }
      // Save permissions
      const perms = Array.from(permissions).map(k => ({ module: k.split(':')[0], action: k.split(':')[1] }));
      const roleId = selectedRole ? selectedRole.id : (await (await authFetch('http://localhost:3000/api/roles')).json()).find(r => r.name === name)?.id;
      const resPerm = await authFetch(`http://localhost:3000/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: perms })
      });
      if (!resPerm.ok) throw new Error('Failed to update permissions');
      setMessage('Saved');
      await loadRoles();
    } catch (e) {
      setError(e.message);
    }
  };

  const isAdmin = user?.role === 'admin';
  if (!isAdmin) return <div className="p-6">Brak dostępu</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Role i uprawnienia</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between mb-3">
            <h2 className="font-semibold">Role</h2>
            <button onClick={startCreate} className="bg-blue-600 text-white px-3 py-1 rounded">Nowa rola</button>
          </div>
          <ul className="divide-y">
            {roles.map(r => (
              <li key={r.id} className={`py-2 px-2 cursor-pointer ${selectedRole?.id===r.id?'bg-blue-50':''}`} onClick={() => startEdit(r)}>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-500">{r.permissions.map(p=>`${p.module}:${p.action}`).join(', ')}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">{selectedRole? 'Edytuj rolę':'Nowa rola'}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm">Nazwa</label>
              <input className="border rounded w-full px-2 py-1" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm">Opis</label>
              <input className="border rounded w-full px-2 py-1" value={description} onChange={e=>setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-2">Uprawnienia</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {MODULES.map(m => (
                  <div key={m} className="border rounded p-2">
                    <div className="font-medium text-sm mb-1">{m}</div>
                    <div className="flex flex-wrap gap-1">
                      {ACTIONS.map(a => {
                        const key = `${m}:${a}`;
                        const active = permissions.has(key);
                        return (
                          <button key={a} type="button" className={`text-xs px-2 py-1 rounded border ${active? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`} onClick={() => togglePerm(m,a)}>
                            {a}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {message && <div className="text-green-600 text-sm">{message}</div>}
            <div className="flex gap-2">
              <button onClick={saveRole} className="bg-green-600 text-white px-4 py-2 rounded">Zapisz</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


