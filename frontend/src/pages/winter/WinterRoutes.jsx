import React, { useState, useEffect } from 'react';
import { 
  MapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  MapPinIcon,
  ClockIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const WinterRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'table', 'map'
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    routeType: '',
    regionId: '',
    isActive: 'true'
  });

  // Form data
  const [routeFormData, setRouteFormData] = useState({
    name: '',
    description: '',
    routeType: 'main_road',
    priority: 'medium',
    startPoint: '',
    endPoint: '',
    estimatedTime: '',
    distance: '',
    surfaceType: 'asphalt',
    width: '',
    maxWeight: '',
    regionId: '',
    routeInstructions: [],
    notes: '',
    isActive: true
  });

  // Options data
  const [options, setOptions] = useState({
    priorities: [],
    routeTypes: [],
    surfaceTypes: [],
    regions: []
  });

  // Priority colors
  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
      maintenance: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Fetch routes
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);

      const response = await fetch(`/api/winter-routes?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }

      const data = await response.json();
      setRoutes(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch options
  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/winter-routes/types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOptions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  // Save route
  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      const url = editingRoute 
        ? `/api/winter-routes/${editingRoute.id}`
        : '/api/winter-routes';
      
      const method = editingRoute ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(routeFormData)
      });

      if (!response.ok) {
        throw new Error('Failed to save route');
      }

      setShowRouteModal(false);
      setEditingRoute(null);
      resetForm();
      fetchRoutes();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete route
  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę trasę?')) return;

    try {
      const response = await fetch(`/api/winter-routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete route');
      }

      fetchRoutes();
    } catch (err) {
      setError(err.message);
    }
  };

  // Export routes
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({ ...filters, format: 'excel' });

      const response = await fetch(`/api/winter-routes/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export routes');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `winter-routes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export routes: ' + err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setRouteFormData({
      name: '',
      description: '',
      routeType: 'main_road',
      priority: 'medium',
      startPoint: '',
      endPoint: '',
      estimatedTime: '',
      distance: '',
      surfaceType: 'asphalt',
      width: '',
      maxWeight: '',
      regionId: '',
      routeInstructions: [],
      notes: '',
      isActive: true
    });
  };

  // Edit route
  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setRouteFormData({
      name: route.name,
      description: route.description || '',
      routeType: route.routeType,
      priority: route.priority,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      estimatedTime: route.estimatedTime || '',
      distance: route.distance || '',
      surfaceType: route.surfaceType || 'asphalt',
      width: route.width || '',
      maxWeight: route.maxWeight || '',
      regionId: route.region?.id || '',
      routeInstructions: route.instructions || [],
      notes: route.notes || '',
      isActive: route.isActive
    });
    setShowRouteModal(true);
  };

  // Add instruction
  const addInstruction = () => {
    setRouteFormData({
      ...routeFormData,
      routeInstructions: [
        ...routeFormData.routeInstructions,
        { step: routeFormData.routeInstructions.length + 1, instruction: '', distance: '' }
      ]
    });
  };

  // Remove instruction
  const removeInstruction = (index) => {
    const newInstructions = routeFormData.routeInstructions.filter((_, i) => i !== index);
    setRouteFormData({
      ...routeFormData,
      routeInstructions: newInstructions.map((inst, i) => ({ ...inst, step: i + 1 }))
    });
  };

  // Update instruction
  const updateInstruction = (index, field, value) => {
    const newInstructions = [...routeFormData.routeInstructions];
    newInstructions[index] = { ...newInstructions[index], [field]: value };
    setRouteFormData({
      ...routeFormData,
      routeInstructions: newInstructions
    });
  };

  useEffect(() => {
    fetchRoutes();
    fetchOptions();
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
          <h1 className="text-2xl font-bold text-gray-900">🗺️ Trasy Zimowe</h1>
          <p className="text-gray-600">Zarządzanie trasami odśnieżania z instrukcjami szczegółowymi</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
            Eksport
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowRouteModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Nowa Trasa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj tras..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Priority Filter */}
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">Wszystkie priorytety</option>
            {options.priorities?.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

          {/* Route Type Filter */}
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.routeType}
            onChange={(e) => setFilters({ ...filters, routeType: e.target.value })}
          >
            <option value="">Wszystkie typy</option>
            {options.routeTypes?.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Active Filter */}
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
          >
            <option value="">Wszystkie</option>
            <option value="true">Aktywne</option>
            <option value="false">Nieaktywne</option>
          </select>

          {/* View Mode */}
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="cards">Karty</option>
            <option value="table">Tabela</option>
            <option value="map">Mapa</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => setFilters({
              search: '',
              priority: '',
              routeType: '',
              regionId: '',
              isActive: 'true'
            })}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Wyczyść
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Routes Display */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {routes.map((route) => (
            <div key={route.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                    <p className="text-sm text-gray-500">{route.routeTypeLabel}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(route.priority)}`}>
                    {route.priorityLabel}
                  </span>
                </div>

                {/* Route Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{route.startPoint} → {route.endPoint}</span>
                  </div>
                  {route.distance && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Squares2X2Icon className="h-4 w-4 mr-2" />
                      <span>{route.distance} km</span>
                    </div>
                  )}
                  {route.estimatedTime && (
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>{route.estimatedTime} min</span>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {route.statistics?.totalInstructions || 0}
                    </div>
                    <div className="text-xs text-gray-500">Instrukcje</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-blue-600">
                      {route.statistics?.recentAssignments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Przydziały</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-green-600">
                      {route.statistics?.recentMaterialUsage || 0}
                    </div>
                    <div className="text-xs text-gray-500">Materiały</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedRoute(route)}
                    className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <EyeIcon className="h-4 w-4 inline mr-1" />
                    Szczegóły
                  </button>
                  <button
                    onClick={() => handleEditRoute(route)}
                    className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <PencilIcon className="h-4 w-4 inline mr-1" />
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(route.id)}
                    className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    <TrashIcon className="h-4 w-4 inline mr-1" />
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          ))}

          {routes.length === 0 && (
            <div className="col-span-full text-center py-12">
              <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Brak tras
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Nie znaleziono tras spełniających kryteria wyszukiwania.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Map View Placeholder */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <MapIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Widok Mapy
            </h3>
            <p className="mt-2 text-gray-500">
              Wizualizacja tras na mapie będzie dostępna po integracji z usługą mapową.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Tutaj będzie możliwość planowania tras graficznie z interaktywną mapą.
            </p>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRoute ? 'Edytuj Trasę' : 'Nowa Trasa'}
              </h3>
              <button
                onClick={() => {
                  setShowRouteModal(false);
                  setEditingRoute(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa trasy *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeFormData.name}
                    onChange={(e) => setRouteFormData({ ...routeFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nazwa trasy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Typ trasy *
                  </label>
                  <select
                    required
                    value={routeFormData.routeType}
                    onChange={(e) => setRouteFormData({ ...routeFormData, routeType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {options.routeTypes?.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Punkt początkowy *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeFormData.startPoint}
                    onChange={(e) => setRouteFormData({ ...routeFormData, startPoint: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Punkt początkowy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Punkt końcowy *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeFormData.endPoint}
                    onChange={(e) => setRouteFormData({ ...routeFormData, endPoint: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Punkt końcowy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorytet *
                  </label>
                  <select
                    required
                    value={routeFormData.priority}
                    onChange={(e) => setRouteFormData({ ...routeFormData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {options.priorities?.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Szacowany czas (minuty)
                  </label>
                  <input
                    type="number"
                    value={routeFormData.estimatedTime}
                    onChange={(e) => setRouteFormData({ ...routeFormData, estimatedTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Czas w minutach"
                  />
                </div>
              </div>

              {/* Route Instructions */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Instrukcje trasy</h4>
                  <button
                    type="button"
                    onClick={addInstruction}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <PlusIcon className="h-4 w-4 inline mr-1" />
                    Dodaj instrukcję
                  </button>
                </div>

                <div className="space-y-3">
                  {routeFormData.routeInstructions.map((instruction, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                        {instruction.step}
                      </div>
                      <input
                        type="text"
                        placeholder="Instrukcja (np. Skręć w prawo w ul. Główną)"
                        value={instruction.instruction}
                        onChange={(e) => updateInstruction(index, 'instruction', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Dystans"
                        value={instruction.distance}
                        onChange={(e) => updateInstruction(index, 'distance', e.target.value)}
                        className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description and Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis
                </label>
                <textarea
                  value={routeFormData.description}
                  onChange={(e) => setRouteFormData({ ...routeFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Opis trasy"
                />
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRouteModal(false);
                    setEditingRoute(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingRoute ? 'Aktualizuj' : 'Utwórz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinterRoutes;