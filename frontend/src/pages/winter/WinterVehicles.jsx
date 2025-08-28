import React, { useState, useEffect } from 'react';
import { 
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const WinterVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    vehicleType: 'all',
    department: 'all',
    activeOnly: true
  });

  const [formData, setFormData] = useState({
    brand: '',
    registrationNumber: '',
    vehicleType: '',
    capacity: '',
    fuelType: '',
    winterEquipment: [],
    purchaseDate: '',
    winterSeasonStart: '',
    winterSeasonEnd: '',
    baseDepartment: '',
    notes: ''
  });

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        activeOnly: filters.activeOnly.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.vehicleType !== 'all' && { vehicleType: filters.vehicleType }),
        ...(filters.department !== 'all' && { department: filters.department })
      });

      const response = await fetch(`/api/winter-vehicles?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch winter vehicles');
      }

      const data = await response.json();
      setVehicles(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch types
  const fetchTypes = async () => {
    try {
      const response = await fetch('/api/winter-vehicles/types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVehicleTypes(data.data.vehicleTypes || []);
        setEquipmentTypes(data.data.equipmentTypes || []);
      }
    } catch (err) {
      console.error('Failed to fetch types:', err);
    }
  };

  // Save vehicle (create or update)
  const saveVehicle = async () => {
    try {
      const url = selectedVehicle 
        ? `/api/winter-vehicles/${selectedVehicle.id}`
        : '/api/winter-vehicles';
      
      const method = selectedVehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save vehicle');
      }

      setShowModal(false);
      setSelectedVehicle(null);
      resetForm();
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete vehicle
  const deleteVehicle = async (vehicleId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten pojazd zimowy?')) {
      return;
    }

    try {
      const response = await fetch(`/api/winter-vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete vehicle');
      }

      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      brand: '',
      registrationNumber: '',
      vehicleType: '',
      capacity: '',
      fuelType: '',
      winterEquipment: [],
      purchaseDate: '',
      winterSeasonStart: '',
      winterSeasonEnd: '',
      baseDepartment: '',
      notes: ''
    });
  };

  // Handle edit
  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      brand: vehicle.brand || '',
      registrationNumber: vehicle.registrationNumber || '',
      vehicleType: vehicle.vehicleType || '',
      capacity: vehicle.capacity?.toString() || '',
      fuelType: vehicle.fuelType || '',
      winterEquipment: vehicle.equipmentArray || [],
      purchaseDate: vehicle.purchaseDate ? vehicle.purchaseDate.split('T')[0] : '',
      winterSeasonStart: vehicle.winterSeasonStart ? vehicle.winterSeasonStart.split('T')[0] : '',
      winterSeasonEnd: vehicle.winterSeasonEnd ? vehicle.winterSeasonEnd.split('T')[0] : '',
      baseDepartment: vehicle.baseDepartment || '',
      notes: vehicle.notes || ''
    });
    setShowModal(true);
  };

  // Handle equipment change
  const handleEquipmentChange = (equipmentValue) => {
    setFormData(prev => ({
      ...prev,
      winterEquipment: prev.winterEquipment.includes(equipmentValue)
        ? prev.winterEquipment.filter(eq => eq !== equipmentValue)
        : [...prev.winterEquipment, equipmentValue]
    }));
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/winter-vehicles/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `winter-vehicles-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError('Failed to export vehicles');
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchTypes();
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
          <h1 className="text-2xl font-bold text-gray-900">🚛 Pojazdy Zimowe</h1>
          <p className="text-gray-600">Zarządzanie flotą pojazdów zimowych</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
            Eksportuj Excel
          </button>
          <button
            onClick={() => {
              setSelectedVehicle(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Dodaj Pojazd
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Szukaj</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nr rejestracyjny, marka..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ pojazdu</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.vehicleType}
              onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
            >
              <option value="all">Wszystkie typy</option>
              {vehicleTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dział</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="all">Wszystkie działy</option>
              <option value="Sektor Zimowy">Sektor Zimowy</option>
              <option value="Department 1">Dział 1</option>
              <option value="Department 2">Dział 2</option>
            </select>
          </div>

          {/* Active Only */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="activeOnly"
              checked={filters.activeOnly}
              onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="activeOnly" className="ml-2 text-sm text-gray-700">
              Tylko aktywne pojazdy
            </label>
          </div>
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

      {/* Vehicle List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pojazd
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wyposażenie Zimowe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sezon Zimowy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uwagi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <TruckIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.registrationNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.brand} • {vehicle.capacity}t • {vehicle.fuelType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {vehicleTypes.find(type => type.value === vehicle.vehicleType)?.label || vehicle.vehicleType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {vehicle.equipmentLabels?.map((equipment, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                        >
                          {equipment}
                        </span>
                      )) || <span className="text-sm text-gray-400">Brak</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.winterSeasonStart && vehicle.winterSeasonEnd ? (
                      <div>
                        <div>{new Date(vehicle.winterSeasonStart).toLocaleDateString('pl-PL')}</div>
                        <div className="text-xs text-gray-400">
                          do {new Date(vehicle.winterSeasonEnd).toLocaleDateString('pl-PL')}
                        </div>
                      </div>
                    ) : (
                      'Nie ustawiono'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {vehicle.notes || <span className="text-gray-400">Brak uwag</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {vehicle.isActive ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <span className={`text-sm ${vehicle.isActive ? 'text-green-800' : 'text-red-800'}`}>
                        {vehicle.isActive ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {vehicles.length === 0 && (
            <div className="text-center py-12">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Brak pojazdów zimowych
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Dodaj pierwszy pojazd do floty zimowej.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedVehicle ? 'Edytuj pojazd zimowy' : 'Dodaj nowy pojazd zimowy'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marka *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nr rejestracyjny *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  />
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ pojazdu *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  >
                    <option value="">Wybierz typ</option>
                    {vehicleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ładowność (t) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rodzaj paliwa *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  >
                    <option value="">Wybierz paliwo</option>
                    <option value="diesel">Diesel</option>
                    <option value="gasoline">Benzyna</option>
                    <option value="electric">Elektryczny</option>
                    <option value="hybrid">Hybrydowy</option>
                  </select>
                </div>

                {/* Base Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dział bazowy</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.baseDepartment}
                    onChange={(e) => setFormData({ ...formData, baseDepartment: e.target.value })}
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data zakupu</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>

                {/* Winter Season Start */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Początek sezonu zimowego</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.winterSeasonStart}
                    onChange={(e) => setFormData({ ...formData, winterSeasonStart: e.target.value })}
                  />
                </div>

                {/* Winter Season End */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Koniec sezonu zimowego</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.winterSeasonEnd}
                    onChange={(e) => setFormData({ ...formData, winterSeasonEnd: e.target.value })}
                  />
                </div>
              </div>

              {/* Winter Equipment */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Wyposażenie zimowe</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {equipmentTypes.map((equipment) => (
                    <label key={equipment.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.winterEquipment.includes(equipment.value)}
                        onChange={() => handleEquipmentChange(equipment.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{equipment.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedVehicle(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveVehicle}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {selectedVehicle ? 'Aktualizuj' : 'Dodaj'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinterVehicles;