import React, { useState } from 'react';
import FractionList from '../components/FractionList';
import FractionForm from '../components/FractionForm';
import FractionImportModal from '../components/FractionImportModal';
import SimpleModal from '../components/SimpleModal';
import { useQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import authFetch from '../utils/authFetch';
import DataPageHeader from '../components/ui/DataPageHeader';
import { Button } from '../components/ui/button';

const API_URL = 'http://localhost:3000/api/fractions';

const fetchFractions = async () => {
  const res = await authFetch(API_URL);
  if (!res.ok) throw new Error('Błąd pobierania frakcji');
  return res.json();
};

const fractionTemplateColumns = ['Nazwa', 'Kod', 'Kolor'];

const Fractions = () => {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { data: fractions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['fractions'],
    queryFn: fetchFractions,
  });

  // Filtering logic (like Vehicles)
  const filteredFractions = fractions.filter(fraction =>
    (fraction.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fraction.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fraction.color || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (fraction) => {
    setEditing(fraction);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    refetch();
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await authFetch(`${API_URL}/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } else {
      await authFetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
    setShowForm(false);
    refetch();
  };

  const handleImport = async (data) => {
    // Implement import logic for fractions if needed
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white bg-opacity-20 rounded-2xl">
                <Layers className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 tracking-tight">Zarządzanie Frakcjami</h1>
                <p className="text-blue-100 text-lg">Zarządzaj i monitoruj frakcje odpadów</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Controls Section - replaced with DataPageHeader */}
        <DataPageHeader
          title="Operacje Frakcji"
          searchValue={searchTerm}
          onSearchChange={e => setSearchTerm(e.target.value)}
          searchPlaceholder="Szukaj frakcji po nazwie, kodzie lub opisie..."
          showSearch={true}
          showFilter={true}
          onFilterClick={() => {}}
          filterLabel="Filtry"
          ImportButtonComponent={
            <Button
              variant="outline"
              className="border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center"
              onClick={() => setImportModalOpen(true)}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
              Importuj Dane
            </Button>
          }
          onAddClick={handleAdd}
          addLabel="Dodaj Frakcję"
        />
        <FractionImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImport} />

        {/* Fraction List as cards */}
        <FractionList fractions={filteredFractions} onEdit={handleEdit} onDelete={handleDelete} />

        {/* Form Modal */}
        <SimpleModal open={showForm} onClose={() => setShowForm(false)}>
          <FractionForm
            initialData={editing}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </SimpleModal>
        {isLoading && <div className="text-gray-500">Ładowanie...</div>}
        {isError && <div className="text-red-500">Błąd pobierania frakcji</div>}
        {!isLoading && !isError && fractions.length === 0 && <div className="text-gray-500">Brak frakcji</div>}
      </div>
    </div>
  );
};

export default Fractions; 