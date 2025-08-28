import React, { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  UserIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const WinterSidewalks = () => {
  const [sidewalks, setSidewalks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('sidewalk'); // 'sidewalk' or 'assignment'
  
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    status: '',
    regionId: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startAddress: '',
    endAddress: '',
    length: '',
    width: '',
    priority: 'medium',
    clearingMethod: 'manual',
    equipmentNeeded: [],
    estimatedTime: '',
    difficulty: 'easy',
    notes: '',
    isActive: true
  });

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  // Fetch sidewalks
  const fetchSidewalks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/winter-sidewalks?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to fetch sidewalks');
      
      const data = await response.json();
      setSidewalks(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save sidewalk
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `/api/winter-sidewalks/${editingItem.id}`
        : '/api/winter-sidewalks';
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save sidewalk');

      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchSidewalks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      const response = await fetch('/api/winter-sidewalks/export?format=excel', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sidewalks-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      name: '', location: '', startAddress: '', endAddress: '',
      length: '', width: '', priority: 'medium', clearingMethod: 'manual',
      equipmentNeeded: [], estimatedTime: '', difficulty: 'easy',
      notes: '', isActive: true
    });
  };

  const handleEdit = (sidewalk) => {
    setEditingItem(sidewalk);
    setFormData({
      name: sidewalk.name,
      location: sidewalk.location || '',
      startAddress: sidewalk.startAddress || '',
      endAddress: sidewalk.endAddress || '',
      length: sidewalk.length || '',
      width: sidewalk.width || '',
      priority: sidewalk.priority,
      clearingMethod: sidewalk.clearingMethod || 'manual',
      equipmentNeeded: sidewalk.equipmentNeeded || [],
      estimatedTime: sidewalk.estimatedTime || '',
      difficulty: sidewalk.difficulty || 'easy',
      notes: sidewalk.notes || '',
      isActive: sidewalk.isActive
    });
    setShowModal(true);
  };

  useEffect(() => {
    fetchSidewalks();
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
          <h1 className="text-2xl font-bold text-gray-900">🚶 Chodniki (PGM)</h1>
          <p className="text-gray-600">Zarządzanie odśnieżaniem chodników i przydziałami</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
            Eksport
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Nowy Chodnik
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj chodników..."
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

      {/* Sidewalks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sidewalks.map((sidewalk) => (
          <div key={sidewalk.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{sidewalk.name}</h3>
                  <p className="text-sm text-gray-500">{sidewalk.location}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[sidewalk.priority]}`}>
                  {sidewalk.priorityLabel}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  <span>{sidewalk.startAddress} → {sidewalk.endAddress}</span>
                </div>
                {sidewalk.length && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Długość: {sidewalk.length}m</span>
                  </div>
                )}
                {sidewalk.estimatedTime && (
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>{sidewalk.estimatedTime} min</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button onClick={() => handleEdit(sidewalk)} className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm">
                  <PencilIcon className="h-4 w-4 inline mr-1" />
                  Edytuj
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingItem ? 'Edytuj Chodnik' : 'Nowy Chodnik'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres początkowy</label>
                  <input
                    type="text"
                    value={formData.startAddress}
                    onChange={(e) => setFormData({ ...formData, startAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres końcowy</label>
                  <input
                    type="text"
                    value={formData.endAddress}
                    onChange={(e) => setFormData({ ...formData, endAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Czas (min)</label>
                  <input
                    type="number"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
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

export default WinterSidewalks;