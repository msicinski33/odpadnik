import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import VehicleList from '../components/VehicleList';
import VehicleForm from '../components/VehicleForm';
import VehicleImportModal from '../components/VehicleImportModal';
import StatsCards from '../components/ui/StatsCard';
import { useQuery } from '@tanstack/react-query';
import { Truck, AlertCircle } from 'lucide-react';
import authFetch from '../utils/authFetch';
import DataPageHeader from '../components/ui/DataPageHeader';

const fetchVehicles = async () => {
  const response = await authFetch('http://localhost:3000/api/vehicles');
  if (!response.ok) {
    throw new Error('Błąd pobierania pojazdów');
  }
  return response.json();
};

const Vehicles = () => {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { data: vehicles = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (vehicle) => {
    setEditing(vehicle);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await authFetch(`http://localhost:3000/api/vehicles/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Błąd usuwania pojazdu');
      }
      setAlert({ type: 'success', message: 'Pojazd został pomyślnie usunięty z floty.' });
      refetch();
    } catch (error) {
      setAlert({ type: 'error', message: 'Nie udało się usunąć pojazdu. Spróbuj ponownie.' });
    }
  };

  const handleSubmit = async (data) => {
    try {
      // Remove faultReports if present
      const { faultReports, ...cleanData } = data;
      const url = editing 
        ? `http://localhost:3000/api/vehicles/${editing.id}`
        : 'http://localhost:3000/api/vehicles';
      
      const response = await authFetch(url, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        throw new Error('Błąd zapisu pojazdu');
      }
      
      setAlert({ type: 'success', message: editing ? 'Informacje o pojeździe zostały pomyślnie zaktualizowane.' : 'Nowy pojazd został dodany do floty.' });
      setShowForm(false);
      refetch();
    } catch (error) {
      setAlert({ type: 'error', message: 'Nie udało się zapisać pojazdu. Spróbuj ponownie.' });
    }
  };

  const handleImport = async (data) => {
    try {
      // For now, we'll create vehicles one by one
      const promises = data.map(vehicle => 
        authFetch('http://localhost:3000/api/vehicles', {
          method: 'POST',
          body: JSON.stringify(vehicle)
        })
      );
      
      await Promise.all(promises);
      setAlert({ type: 'success', message: `Pomyślnie zaimportowano ${data.length} pojazdów do floty.` });
      refetch();
    } catch (error) {
      setAlert({ type: 'error', message: 'Nie udało się zaimportować pojazdów. Sprawdź format pliku.' });
    }
  };

  const vehicleTemplateColumns = ['Marka', 'Numer rejestracyjny', 'Typ', 'Pojemność', 'Rodzaj paliwa', 'Aktywny'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Ładowanie floty...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Błąd połączenia</h3>
            <p className="text-gray-600 mb-4">Nie udało się załadować floty pojazdów. Spróbuj ponownie.</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              Spróbuj ponownie
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white bg-opacity-20 rounded-2xl">
                <Truck className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 tracking-tight">Zarządzanie Flotą</h1>
                <p className="text-blue-100 text-lg">Zarządzaj i monitoruj pojazdy do zbiórki odpadów</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <StatsCards vehicles={vehicles} />

        {/* Controls Section - replaced with DataPageHeader */}
        <DataPageHeader
          title="Operacje Pojazdów"
          searchValue={searchTerm}
          onSearchChange={e => setSearchTerm(e.target.value)}
          searchPlaceholder="Szukaj pojazdów po marce, numerze rejestracyjnym lub typie..."
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
          addLabel="Dodaj Pojazd"
        />
        <VehicleImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImport} />

        {/* Alert Section */}
        {alert && (
          <div className={`mb-4 px-4 py-3 rounded ${alert.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{alert.message}</div>
        )}

        {/* Vehicle List */}
        <div className="space-y-6">
          {searchTerm && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {filteredVehicles.length} pojazd{filteredVehicles.length !== 1 ? 'ów' : ''} znalezionych
                {searchTerm && (
                  <span className="ml-2">
                    dla "<span className="font-semibold">{searchTerm}</span>"
                  </span>
                )}
              </p>
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  onClick={() => setSearchTerm('')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Wyczyść wyszukiwanie
                </Button>
              )}
            </div>
          )}
          
          <VehicleList 
            vehicles={filteredVehicles} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onVehicleUpdate={refetch}
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <VehicleForm
            initialData={editing}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Vehicles; 