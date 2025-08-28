import React, { useState, useEffect } from 'react';
import { 
  Squares2X2Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const WinterRoadInventory = () => {
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stats, setStats] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    winterPriority: '',
    condition: '',
    surfaceType: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'category_5',
    startPoint: '',
    endPoint: '',
    length: '',
    width: '',
    lanes: '',
    surfaceType: 'asphalt',
    winterPriority: 'medium',
    condition: 'good',
    maxWeight: '',
    maxHeight: '',
    hasBridges: false,
    hasTunnels: false,
    hasIntersections: false,
    equipmentRequired: [],
    specialRequirements: [],
    winterServiceFrequency: '',
    notes: '',
    isActive: true
  });

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const conditionColors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  // Fetch roads
  const fetchRoads = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/winter-road-inventory?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to fetch roads');
      
      const data = await response.json();
      setRoads(data.data || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save road
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `/api/winter-road-inventory/${editingItem.id}`
        : '/api/winter-road-inventory';
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save road');

      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchRoads();
    } catch (err) {
      setError(err.message);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      const response = await fetch('/api/winter-road-inventory/export?format=excel', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `road-inventory-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      name: '', description: '', category: 'category_5', startPoint: '', endPoint: '',
      length: '', width: '', lanes: '', surfaceType: 'asphalt', winterPriority: 'medium',
      condition: 'good', maxWeight: '', maxHeight: '', hasBridges: false, hasTunnels: false,
      hasIntersections: false, equipmentRequired: [], specialRequirements: [],
      winterServiceFrequency: '', notes: '', isActive: true
    });
  };

  const handleEdit = (road) => {
    setEditingItem(road);
    setFormData({
      name: road.name,
      description: road.description || '',
      category: road.category,
      startPoint: road.startPoint,
      endPoint: road.endPoint,
      length: road.length || '',
      width: road.width || '',
      lanes: road.lanes || '',
      surfaceType: road.surfaceType || 'asphalt',
      winterPriority: road.winterPriority,
      condition: road.condition || 'good',
      maxWeight: road.maxWeight || '',
      maxHeight: road.maxHeight || '',
      hasBridges: road.hasBridges || false,
      hasTunnels: road.hasTunnels || false,
      hasIntersections: road.hasIntersections || false,
      equipmentRequired: road.equipmentRequired || [],
      specialRequirements: road.specialRequirements || [],
      winterServiceFrequency: road.winterServiceFrequency || '',
      notes: road.notes || '',
      isActive: road.isActive
    });
    setShowModal(true);
  };

  useEffect(() => {
    fetchRoads();
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
          <h1 className="text-2xl font-bold text-gray-900">🛣️ Inwentarz Dróg</h1>
          <p className="text-gray-600">Zarządzanie kategoriami i wykazem dróg publicznych</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
            Eksport
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Nowa Droga
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Squares2X2Icon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Łącznie dróg</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Długość całkowita</p>
                <p className="text-2xl font-bold text-green-900">{Math.round(stats.totalLength)} km</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Priorytet krytyczny</p>
                <p className="text-2xl font-bold text-red-900">{stats.byPriority.critical}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Z mostami</p>
                <p className="text-2xl font-bold text-purple-900">{stats.withBridges}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <FunnelIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Kategoria I-III</p>
                <p className="text-2xl font-bold text-orange-900">
                  {(stats.byCategory.category_1 || 0) + (stats.byCategory.category_2 || 0) + (stats.byCategory.category_3 || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj dróg..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Wszystkie kategorie</option>
            <option value="category_1">Kategoria I - Autostrady</option>
            <option value="category_2">Kategoria II - Drogi ekspresowe</option>
            <option value="category_3">Kategoria III - Drogi główne</option>
            <option value="category_4">Kategoria IV - Drogi zbiorcze</option>
            <option value="category_5">Kategoria V - Drogi lokalne</option>
            <option value="category_6">Kategoria VI - Drogi dojazdowe</option>
          </select>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.winterPriority}
            onChange={(e) => setFilters({ ...filters, winterPriority: e.target.value })}
          >
            <option value="">Wszystkie priorytety</option>
            <option value="low">Niski</option>
            <option value="medium">Średni</option>
            <option value="high">Wysoki</option>
            <option value="critical">Krytyczny</option>
          </select>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.condition}
            onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
          >
            <option value="">Wszystkie stany</option>
            <option value="excellent">Doskonały</option>
            <option value="good">Dobry</option>
            <option value="fair">Zadowalający</option>
            <option value="poor">Zły</option>
            <option value="critical">Krytyczny</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', category: '', winterPriority: '', condition: '', surfaceType: '' })}
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

      {/* Roads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Droga</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trasa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parametry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorytet zimowy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roads.map((road) => (
                <tr key={road.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{road.name}</div>
                      {road.description && (
                        <div className="text-sm text-gray-500">{road.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {road.categoryLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{road.startPoint} → {road.endPoint}</div>
                    {road.length && (
                      <div className="text-sm text-gray-500">{road.length} km</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {road.width && `${road.width}m szerokość`}
                      {road.lanes && `, ${road.lanes} pasy`}
                    </div>
                    <div className="text-sm text-gray-500">{road.surfaceTypeLabel}</div>
                    <div className="flex space-x-1 mt-1">
                      {road.hasBridges && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Mosty
                        </span>
                      )}
                      {road.hasTunnels && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          Tunele
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[road.winterPriority]}`}>
                      {road.winterPriorityLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conditionColors[road.condition]}`}>
                      {road.conditionLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(road)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {roads.length === 0 && (
            <div className="text-center py-12">
              <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Brak dróg</h3>
              <p className="mt-1 text-sm text-gray-500">Nie znaleziono dróg spełniających kryteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingItem ? 'Edytuj Drogę' : 'Nowa Droga'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="category_1">Kategoria I - Autostrady</option>
                    <option value="category_2">Kategoria II - Drogi ekspresowe</option>
                    <option value="category_3">Kategoria III - Drogi główne</option>
                    <option value="category_4">Kategoria IV - Drogi zbiorcze</option>
                    <option value="category_5">Kategoria V - Drogi lokalne</option>
                    <option value="category_6">Kategoria VI - Drogi dojazdowe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Punkt początkowy *</label>
                  <input
                    type="text"
                    required
                    value={formData.startPoint}
                    onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Punkt końcowy *</label>
                  <input
                    type="text"
                    required
                    value={formData.endPoint}
                    onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorytet zimowy *</label>
                  <select
                    required
                    value={formData.winterPriority}
                    onChange={(e) => setFormData({ ...formData, winterPriority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Średni</option>
                    <option value="high">Wysoki</option>
                    <option value="critical">Krytyczny</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stan drogi</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">Doskonały</option>
                    <option value="good">Dobry</option>
                    <option value="fair">Zadowalający</option>
                    <option value="poor">Zły</option>
                    <option value="critical">Krytyczny</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Długość (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Szerokość (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasBridges"
                    checked={formData.hasBridges}
                    onChange={(e) => setFormData({ ...formData, hasBridges: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasBridges" className="ml-2 text-sm text-gray-700">Ma mosty</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasTunnels"
                    checked={formData.hasTunnels}
                    onChange={(e) => setFormData({ ...formData, hasTunnels: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasTunnels" className="ml-2 text-sm text-gray-700">Ma tunele</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasIntersections"
                    checked={formData.hasIntersections}
                    onChange={(e) => setFormData({ ...formData, hasIntersections: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasIntersections" className="ml-2 text-sm text-gray-700">Ma skrzyżowania</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
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

export default WinterRoadInventory;