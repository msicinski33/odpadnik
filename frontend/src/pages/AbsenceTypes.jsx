import React, { useState, useEffect } from 'react';
import DataPageHeader from '../components/ui/DataPageHeader';
import AbsenceTypeModal from '../components/AbsenceTypeModal';
import { Palette } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Edit2, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3000/api/absence-types';

const emptyForm = { name: '', code: '', color: '', notes: '' };

const AbsenceTypes = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTypes = async () => {
    setLoading(true);
    const res = await fetch(API_URL);
    const data = await res.json();
    setTypes(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchTypes(); }, []);

  const handleEdit = (type) => {
    setEditing(type);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Usunąć ten rodzaj absencji?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchTypes();
  };

  const handleSubmit = async (form) => {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API_URL}/${editing.id}` : API_URL;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    setEditing(null);
    fetchTypes();
  };

  const filteredTypes = types.filter(type =>
    (type.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl">
              <Palette className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-3 tracking-tight">Rodzaje absencji</h1>
              <p className="text-blue-100 text-lg">Zarządzaj i monitoruj typy absencji</p>
            </div>
          </div>
              </div>
            </div>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <DataPageHeader
          title="Operacje Rodzajów Absencji"
          searchValue={searchTerm}
          onSearchChange={e => setSearchTerm(e.target.value)}
          searchPlaceholder="Szukaj po nazwie, kodzie lub notatkach..."
          showSearch={true}
          showFilter={false}
          ImportButtonComponent={null}
          onAddClick={() => { setModalOpen(true); setEditing(null); }}
          addLabel="Dodaj Rodzaj Absencji"
        />
        {loading ? <div className="text-gray-500">Ładowanie...</div> : (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-7xl px-6 flex flex-wrap gap-6 mt-6 justify-center">
              {filteredTypes.length === 0 && (
                <div className="text-gray-500 text-center w-full py-8">Brak rodzajów absencji</div>
              )}
              {filteredTypes.map(type => (
                <Card className="w-[340px] border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-200 relative overflow-visible">
                  {/* Big code in top-left */}
                  <div className="absolute -top-3 -left-3 bg-blue-100 text-blue-700 rounded-xl px-4 py-2 text-2xl font-extrabold shadow-lg z-10 border-2 border-white">
                    {type.code}
                  </div>
                  <CardHeader className="flex items-center gap-3 pb-2 pt-6">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Palette className="h-7 w-7 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-blue-900">{type.name}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-700 mb-2">
                      Kolor: {type.color ? <span style={{background:type.color, padding:'2px 8px', borderRadius:4, color:'#fff'}}>{type.color}</span> : '-'}<br />
                      Notatki: {type.notes || '-'}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(type)}>
                        <Edit2 className="h-4 w-4 mr-1" /> Edytuj
                      </Button>
                      <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleDelete(type.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Usuń
                      </Button>
            </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      )}
        <AbsenceTypeModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSubmit={handleSubmit}
          initialData={editing}
        />
      </div>
    </div>
  );
};

export default AbsenceTypes; 