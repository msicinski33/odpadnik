import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapIcon
} from '@heroicons/react/24/outline';

const WinterBusStops = () => {
  const [busStops, setBusStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'table', 'map'
  
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    busStopType: '',
    regionId: '',
    hasWinterService: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    busStopType: 'standard',
    priority: 'medium',
    hasWinterService: true,
    requiresSpecialAccess: false,
    accessNotes: '',
    bins: [],
    isActive: true
  });

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const busStopTypeColors = {
    standard: 'bg-blue-100 text-blue-800',
    sheltered: 'bg-green-100 text-green-800',
    major_hub: 'bg-purple-100 text-purple-800',
    terminal: 'bg-indigo-100 text-indigo-800',
    express: 'bg-orange-100 text-orange-800'
  };

  // Fetch bus stops
  const fetchBusStops = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/winter-bus-stops?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to fetch bus stops');
      
      const data = await response.json();
      setBusStops(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save bus stop
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `/api/winter-bus-stops/${editingItem.id}`
        : '/api/winter-bus-stops';
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save bus stop');

      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchBusStops();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete bus stop
  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten przystanek?')) return;

    try {
      const response = await fetch(`/api/winter-bus-stops/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to delete bus stop');
      fetchBusStops();
    } catch (err) {
      setError(err.message);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      const response = await fetch('/api/winter-bus-stops/export?format=excel', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bus-stops-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', location: '', busStopType: 'standard', priority: 'medium',
      hasWinterService: true, requiresSpecialAccess: false, accessNotes: '',
      bins: [], isActive: true
    });
  };

  const handleEdit = (busStop) => {
    setEditingItem(busStop);
    setFormData({
      name: busStop.name,
      location: busStop.location || '',
      busStopType: busStop.busStopType,
      priority: busStop.priority,
      hasWinterService: busStop.hasWinterService,
      requiresSpecialAccess: busStop.requiresSpecialAccess,
      accessNotes: busStop.accessNotes || '',
      bins: busStop.bins || [],
      isActive: busStop.isActive
    });
    setShowModal(true);
  };

  // Add bin to form
  const addBin = () => {
    setFormData({
      ...formData,
      bins: [...formData.bins, { type: 'waste', capacity: '', notes: '' }]
    });
  };

  // Remove bin from form
  const removeBin = (index) => {
    setFormData({
      ...formData,
      bins: formData.bins.filter((_, i) => i !== index)
    });
  };

  // Update bin in form
  const updateBin = (index, field, value) => {
    const newBins = [...formData.bins];
    newBins[index] = { ...newBins[index], [field]: value };
    setFormData({ ...formData, bins: newBins });
  };

  useEffect(() => {
    fetchBusStops();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚌 Przystanki i Kosze</h1>
          <p className="text-gray-600">Zarządzanie przystankami autobusowymi i koszami ulicznymi</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
            Eksport
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Nowy Przystanek
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj przystanków..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">Wszystkie priorytety</option>
            <option value="low">Niski</option>
            <option value="medium">Średni</option>
            <option value="high">Wysoki</option>
            <option value="critical">Krytyczny</option>
          </select>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.busStopType}
            onChange={(e) => setFilters({ ...filters, busStopType: e.target.value })}
          >
            <option value="">Wszystkie typy</option>
            <option value="standard">Standardowy</option>
            <option value="sheltered">Z wiatą</option>
            <option value="major_hub">Węzeł komunikacyjny</option>
            <option value="terminal">Terminal</option>
          </select>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="cards">Karty</option>
            <option value="table">Tabela</option>
            <option value="map">Mapa</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', priority: '', busStopType: '', regionId: '', hasWinterService: '' })}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Wyczyść
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {busStops.map((busStop) => (
            <div key={busStop.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{busStop.name}</h3>
                    <p className="text-sm text-gray-500">{busStop.location}</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[busStop.priority]}`}>
                      {busStop.priorityLabel}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${busStopTypeColors[busStop.busStopType]}`}>
                      {busStop.busStopTypeLabel}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    {busStop.hasWinterService ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className={busStop.hasWinterService ? 'text-green-700' : 'text-red-700'}>
                      {busStop.hasWinterService ? 'Obsługa zimowa' : 'Brak obsługi zimowej'}
                    </span>
                  </div>
                  
                  {busStop.requiresSpecialAccess && (
                    <div className="flex items-center text-sm">
                      <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-orange-700">Wymaga specjalnego dostępu</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <span>{busStop.binCount || 0} koszy</span>
                  </div>
                </div>

                {/* Recent Assignments */}
                {busStop.recentAssignments && busStop.recentAssignments.length > 0 && (
                  <div className="border-t pt-3 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ostatnie przydziały</h4>
                    <div className="space-y-1">
                      {busStop.recentAssignments.slice(0, 2).map((assignment, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          {new Date(assignment.date).toLocaleDateString('pl-PL')} - {assignment.workerName || 'Brak pracownika'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(busStop)} className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm">
                    <PencilIcon className="h-4 w-4 inline mr-1" />
                    Edytuj
                  </button>
                  <button onClick={() => handleDelete(busStop.id)} className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 text-sm">
                    <TrashIcon className="h-4 w-4 inline mr-1" />
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          ))}

          {busStops.length === 0 && (
            <div className="col-span-full text-center py-12">
              <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Brak przystanków</h3>
              <p className="mt-1 text-sm text-gray-500">Nie znaleziono przystanków spełniających kryteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Map View Placeholder */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <MapIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Widok Mapy</h3>
            <p className="mt-2 text-gray-500">
              Mapa z lokalizacją przystanków będzie dostępna po integracji z usługą mapową.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Tutaj będzie możliwość wizualizacji przystanków na interaktywnej mapie.
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingItem ? 'Edytuj Przystanek' : 'Nowy Przystanek'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokalizacja</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ przystanku</label>
                  <select
                    value={formData.busStopType}
                    onChange={(e) => setFormData({ ...formData, busStopType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standardowy</option>
                    <option value="sheltered">Z wiatą</option>
                    <option value="major_hub">Węzeł komunikacyjny</option>
                    <option value="terminal">Terminal</option>
                    <option value="express">Ekspresowy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorytet</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Średni</option>
                    <option value="high">Wysoki</option>
                    <option value="critical">Krytyczny</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasWinterService"
                    checked={formData.hasWinterService}
                    onChange={(e) => setFormData({ ...formData, hasWinterService: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasWinterService" className="ml-2 text-sm text-gray-700">
                    Ma obsługę zimową
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresSpecialAccess"
                    checked={formData.requiresSpecialAccess}
                    onChange={(e) => setFormData({ ...formData, requiresSpecialAccess: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresSpecialAccess" className="ml-2 text-sm text-gray-700">
                    Wymaga specjalnego dostępu
                  </label>
                </div>
              </div>

              {formData.requiresSpecialAccess && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi o dostępie</label>
                  <textarea
                    value={formData.accessNotes}
                    onChange={(e) => setFormData({ ...formData, accessNotes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Opisz wymagania specjalnego dostępu"
                  />
                </div>
              )}

              {/* Bins Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Kosze uliczne</h4>
                  <button
                    type="button"
                    onClick={addBin}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <PlusIcon className="h-4 w-4 inline mr-1" />
                    Dodaj kosz
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.bins.map((bin, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <select
                        value={bin.type}
                        onChange={(e) => updateBin(index, 'type', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="waste">Odpady</option>
                        <option value="recycling">Segregacja</option>
                        <option value="cigarette">Popielniczka</option>
                        <option value="dog_waste">Psie odchody</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Pojemność"
                        value={bin.capacity}
                        onChange={(e) => updateBin(index, 'capacity', e.target.value)}
                        className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeBin(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                  Anuluj
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  {editingItem ? 'Aktualizuj' : 'Utwórz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinterBusStops;