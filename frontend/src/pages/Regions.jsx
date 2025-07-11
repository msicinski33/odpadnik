import React, { useEffect, useState, useCallback } from 'react';
import RegionList from '../components/RegionList';
import RegionForm from '../components/RegionForm';
import ImportButton from '../components/ImportButton';
import authFetch from '../utils/authFetch';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapPin, Plus } from 'lucide-react';
import DataPageHeader from '../components/ui/DataPageHeader';
import SimpleModal from '../components/SimpleModal';
import RegionImportModal from '../components/RegionImportModal';

const API_URL = 'http://localhost:3000/api/regions';
const POINTS_URL = 'http://localhost:3000/api/points';
const FRACTIONS_URL = 'http://localhost:3000/api/fractions';

const Regions = () => {
  const [regions, setRegions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [assigningRegion, setAssigningRegion] = useState(null);
  const [allPoints, setAllPoints] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [assignError, setAssignError] = useState('');
  const [filterTown, setFilterTown] = useState("");
  const [filterStreet, setFilterStreet] = useState("");
  const [allFractions, setAllFractions] = useState([]);
  const [selectedFractions, setSelectedFractions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  const fetchRegions = useCallback(async () => {
    const res = await authFetch(API_URL);
    const regions = await res.json();
    await fetchFractionsForAllRegions(regions);
  }, []);

  const fetchAllPoints = async () => {
    const res = await authFetch(POINTS_URL);
    setAllPoints(await res.json());
  };

  const fetchAssignedPoints = async (regionId) => {
    const res = await authFetch(`${API_URL}/${regionId}/points`);
    const points = await res.json();
    setSelectedPoints(points.map(p => p.id));
  };

  const fetchAllFractions = async () => {
    const res = await authFetch(FRACTIONS_URL);
    setAllFractions(await res.json());
  };

  const fetchAssignedFractions = async (regionId) => {
    const res = await authFetch(`${API_URL}/${regionId}/fractions`);
    const fractions = await res.json();
    setSelectedFractions(fractions.map(f => f.id));
  };

  const fetchFractionsForAllRegions = async (regions) => {
    const updated = await Promise.all(regions.map(async region => {
      try {
        const res = await authFetch(`${API_URL}/${region.id}/fractions`);
        if (!res.ok) throw new Error('Failed to fetch fractions');
        const fractions = await res.json();
        return { ...region, assignedFractions: fractions };
      } catch (e) {
        console.error('Error fetching fractions for region', region.id, e);
        return { ...region, assignedFractions: [] };
      }
    }));
    setRegions(updated);
  };

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (region) => {
    setEditing(region);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchRegions();
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
    fetchRegions();
  };

  const handleImport = async (data) => {
    const promises = data.map(region => 
      authFetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          name: region['Nazwa'] || '',
          unitName: region['Nazwa jednostki'] || '',
          notes: region['Notatki'] || ''
        }),
      })
    );

    await Promise.all(promises);
    fetchRegions();
  };

  const regionTemplateColumns = ['Nazwa', 'Nazwa jednostki', 'Notatki'];

  // Assign Points logic
  const handleAssignPoints = async (region) => {
    setAssigningRegion(region);
    setAssignError('');
    await fetchAllPoints();
    await fetchAssignedPoints(region.id);
    await fetchAllFractions();
    await fetchAssignedFractions(region.id);
  };

  const handlePointToggle = (pointId) => {
    setSelectedPoints(selectedPoints.includes(pointId)
      ? selectedPoints.filter(id => id !== pointId)
      : [...selectedPoints, pointId]);
  };

  const handleFractionToggle = (fractionId) => {
    setSelectedFractions(selectedFractions.includes(fractionId)
      ? selectedFractions.filter(id => id !== fractionId)
      : [...selectedFractions, fractionId]);
  };

  const handleSaveAssignments = async () => {
    setAssignError('');
    try {
      // Save points
      const resPoints = await authFetch(`${API_URL}/${assigningRegion.id}/points`, {
        method: 'PUT',
        body: JSON.stringify({ pointIds: selectedPoints }),
      });
      if (!resPoints.ok) throw new Error((await resPoints.json()).error || 'Błąd przypisywania punktów');
      // Save fractions
      const resFractions = await authFetch(`${API_URL}/${assigningRegion.id}/fractions`, {
        method: 'PUT',
        body: JSON.stringify({ fractionIds: selectedFractions }),
      });
      if (!resFractions.ok) throw new Error((await resFractions.json()).error || 'Błąd przypisywania frakcji');
      setAssigningRegion(null);
      fetchRegions();
    } catch (err) {
      setAssignError(err.message);
    }
  };

  // Filtering logic (like Vehicles)
  const filteredRegions = regions.filter(region =>
    (region.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (region.unitName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (region.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white bg-opacity-20 rounded-2xl">
                <MapPin className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 tracking-tight">Zarządzanie Regionami</h1>
                <p className="text-blue-100 text-lg">Zarządzaj i monitoruj regiony obsługi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Controls Section - replaced with DataPageHeader */}
        <DataPageHeader
          title="Operacje Regionów"
          searchValue={searchTerm}
          onSearchChange={e => setSearchTerm(e.target.value)}
          searchPlaceholder="Szukaj regionów po nazwie, jednostce lub notatkach..."
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
          addLabel="Dodaj Region"
        />
        <RegionImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImport} />

        {/* Region List as cards */}
        <RegionList
          regions={filteredRegions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssignPoints={handleAssignPoints}
        />

        {/* Form Modal */}
        {showForm && (
          <SimpleModal open={showForm} onClose={() => setShowForm(false)}>
            <div className="w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <RegionForm
                initialData={editing}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </SimpleModal>
        )}
        {regions.length === 0 && <div className="text-gray-500">Brak regionów</div>}
        {assigningRegion && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow max-w-lg w-full">
              <h2 className="text-xl font-bold mb-2">Przypisz Punkty i Frakcje do {assigningRegion.name}</h2>
              {assignError && <div className="text-red-500 mb-2">{assignError}</div>}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Filtruj według miasta..."
                  value={filterTown}
                  onChange={e => setFilterTown(e.target.value)}
                  className="border px-2 py-1 rounded w-1/2"
                />
                <input
                  type="text"
                  placeholder="Filtruj według ulicy..."
                  value={filterStreet}
                  onChange={e => setFilterStreet(e.target.value)}
                  className="border px-2 py-1 rounded w-1/2"
                />
                <button
                  type="button"
                  className="bg-green-500 text-white px-3 py-1 rounded"
                  onClick={() => {
                    const filteredIds = allPoints
                      .filter(point =>
                        (!filterTown || point.town.toLowerCase().includes(filterTown.toLowerCase())) &&
                        (!filterStreet || point.street.toLowerCase().includes(filterStreet.toLowerCase()))
                      )
                      .map(point => point.id);
                    setSelectedPoints(prev => Array.from(new Set([...prev, ...filteredIds])));
                  }}
                >
                  Wybierz Wszystkie Filtrowane
                </button>
                <button
                  type="button"
                  className="bg-red-500 text-white px-3 py-1 rounded"
                  onClick={() => {
                    const filteredIds = allPoints
                      .filter(point =>
                        (!filterTown || point.town.toLowerCase().includes(filterTown.toLowerCase())) &&
                        (!filterStreet || point.street.toLowerCase().includes(filterStreet.toLowerCase()))
                      )
                      .map(point => point.id);
                    setSelectedPoints(prev => prev.filter(id => !filteredIds.includes(id)));
                  }}
                >
                  Odznacz Wszystkie Filtrowane
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto border p-2 mb-4">
                {allPoints
                  .filter(point =>
                    (!filterTown || point.town.toLowerCase().includes(filterTown.toLowerCase())) &&
                    (!filterStreet || point.street.toLowerCase().includes(filterStreet.toLowerCase()))
                  )
                  .map(point => (
                    <label key={point.id} className="block cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPoints.includes(point.id)}
                        onChange={() => handlePointToggle(point.id)}
                        className="mr-2"
                      />
                      {point.town}, {point.street} {point.number} ({point.type})
                    </label>
                  ))}
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Frakcje przypisane do regionu</h3>
                <div className="max-h-40 overflow-y-auto border p-2">
                  {allFractions.map(fraction => (
                    <label key={fraction.id} className="block cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFractions.includes(fraction.id)}
                        onChange={() => handleFractionToggle(fraction.id)}
                        className="mr-2"
                      />
                      {fraction.name}
                    </label>
                  ))}
                  {allFractions.length === 0 && <div className="text-gray-400">Brak dostępnych frakcji.</div>}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSaveAssignments}>Zapisz</button>
                <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setAssigningRegion(null)}>Anuluj</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Regions; 