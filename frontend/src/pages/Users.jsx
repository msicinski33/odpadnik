import React, { useState, useEffect } from 'react';
import authFetch from '../utils/authFetch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Switch from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'kierowca',
  isActive: true,
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authFetch('http://localhost:3000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy użytkowników",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const response = await authFetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => 
          user.id === userId ? updatedUser : user
        ));
        toast({
          title: "Sukces",
          description: `Użytkownik ${updatedUser.name} został ${updatedUser.isActive ? 'odblokowany' : 'zablokowany'}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Błąd",
          description: error.error || "Nie udało się zaktualizować użytkownika",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować użytkownika",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć użytkownika "${userName}"?`)) {
      return;
    }

    try {
      const response = await authFetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        toast({
          title: "Sukces",
          description: `Użytkownik "${userName}" został usunięty`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Błąd",
          description: error.error || "Nie udało się usunąć użytkownika",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć użytkownika",
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = () => {
    setForm(initialForm);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm(initialForm);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await authFetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        toast({ title: 'Sukces', description: 'Użytkownik został utworzony' });
        handleCloseModal();
        fetchUsers();
      } else {
        const error = await response.json();
        toast({ title: 'Błąd', description: error.error || 'Nie udało się utworzyć użytkownika', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Błąd', description: 'Nie udało się utworzyć użytkownika', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'koordynator': return 'bg-blue-500';
      case 'kierowca': return 'bg-green-500';
      case 'specjalista_zuc': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Ładowanie użytkowników...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zarządzanie Użytkownikami</h1>
          <p className="text-gray-600 mt-2">Panel administratora do zarządzania kontami użytkowników</p>
        </div>
        <Button onClick={handleOpenModal} variant="default">Dodaj użytkownika</Button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nowy użytkownik</h2>
            <form onSubmit={handleCreateUser}>
              <div className="mb-3">
                <label className="block mb-1 font-medium">Imię i nazwisko</label>
                <input type="text" name="name" value={form.name} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-medium">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-medium">Hasło</label>
                <input type="password" name="password" value={form.password} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-medium">Rola</label>
                <select name="role" value={form.role} onChange={handleFormChange} className="w-full border rounded px-3 py-2">
                  <option value="admin">admin</option>
                  <option value="koordynator">koordynator</option>
                  <option value="kierowca">kierowca</option>
                  <option value="specjalista_zuc">Specjalista ZUC</option>
                </select>
              </div>
              <div className="mb-3 flex items-center">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleFormChange} id="isActive" className="mr-2" />
                <label htmlFor="isActive">Aktywny</label>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>Anuluj</Button>
                <Button type="submit" variant="default" disabled={creating}>{creating ? 'Tworzenie...' : 'Utwórz'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista Użytkowników ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nazwa</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Rola</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Data utworzenia</th>
                  <th className="text-left p-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{user.name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggleActive(user.id, user.isActive)}
                          disabled={user.role === 'admin'} // Nie blokuj adminów
                        />
                        <Label className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                          {user.isActive ? 'Aktywny' : 'Zablokowany'}
                        </Label>
                      </div>
                    </td>
                    <td className="p-2 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="p-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={user.role === 'admin'} // Nie usuwaj adminów
                      >
                        Usuń
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users; 