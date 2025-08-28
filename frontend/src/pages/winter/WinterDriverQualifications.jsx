import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  IdentificationIcon,
  TruckIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const WinterDriverQualifications = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'matrix'
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    licenseCategory: '',
    equipment: '',
    qualification: '',
    activeOnly: true,
    sortBy: 'surname',
    sortOrder: 'asc'
  });
  const [categories, setCategories] = useState({
    licenseCategories: [],
    winterEquipmentTypes: [],
    allQualifications: []
  });
  const [matrixData, setMatrixData] = useState(null);

  // Fetch driver qualifications data
  const fetchQualifications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: searchTerm,
        licenseCategory: filters.licenseCategory,
        equipment: filters.equipment,
        qualification: filters.qualification,
        activeOnly: filters.activeOnly.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`/api/winter-driver-qualifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch driver qualifications');
      }

      const data = await response.json();
      setEmployees(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and options
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/winter-driver-qualifications/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch matrix view data
  const fetchMatrix = async () => {
    try {
      const response = await fetch('/api/winter-driver-qualifications/matrix', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMatrixData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch matrix data:', err);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        format: 'excel'
      });

      const response = await fetch(`/api/winter-driver-qualifications/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `winter-driver-qualifications-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data: ' + err.message);
    }
  };

  useEffect(() => {
    fetchQualifications();
    fetchCategories();
    if (viewMode === 'matrix') {
      fetchMatrix();
    }
  }, [searchTerm, filters, viewMode]);

  const getLicenseColor = (isWinterRelevant) => {
    return isWinterRelevant ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

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
          <h1 className="text-2xl font-bold text-gray-900">🚗 Kwalifikacje Kierowców</h1>
          <p className="text-gray-600">Zarządzanie uprawnieniami i licencjami kierowców na zimę</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FunnelIcon className="h-5 w-5 inline mr-2" />
            {viewMode === 'list' ? 'Widok Macierzowy' : 'Widok Listy'}
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
            Eksport Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj kierowców..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* License Category Filter */}
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.licenseCategory}
              onChange={(e) => setFilters({ ...filters, licenseCategory: e.target.value })}
            >
              <option value="">Wszystkie kategorie</option>
              {categories.licenseCategories.map((category) => (
                <option key={category.code} value={category.code}>
                  {category.code} - {category.description}
                </option>
              ))}
            </select>

            {/* Equipment Filter */}
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.equipment}
              onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}
            >
              <option value="">Wszystkie urządzenia</option>
              {categories.winterEquipmentTypes.map((equipment) => (
                <option key={equipment} value={equipment}>
                  {equipment}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="surname">Sortuj po nazwisku</option>
              <option value="experienceYears">Sortuj po doświadczeniu</option>
              <option value="qualifications">Sortuj po liczbie kwalifikacji</option>
            </select>

            {/* Active Only Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="activeOnly"
                checked={filters.activeOnly}
                onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="activeOnly" className="ml-2 text-sm text-gray-700">
                Tylko aktywni
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Łącznie kierowców</p>
                  <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <TruckIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Ciężkie pojazdy (C, C+E)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.canDriveHeavyVehicles).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <WrenchScrewdriverIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Z kwalifikacjami zimowymi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.hasWinterQualifications).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Zmiana nocna</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.nightShiftAllowed).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kierowca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategorie Prawa Jazdy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kwalifikacje Zimowe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doświadczenie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dostępność
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {employee.licenseDetails?.map((license, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLicenseColor(license.isWinterRelevant)}`}
                              title={license.description}
                            >
                              {license.category}
                              {license.isWinterRelevant && (
                                <CheckCircleIcon className="h-3 w-3 ml-1" />
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {employee.winterEquipment?.map((equipment, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {equipment}
                            </span>
                          ))}
                          {employee.winterEquipment?.length === 0 && (
                            <span className="text-sm text-gray-400">Brak kwalifikacji zimowych</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.experienceYears} {employee.experienceYears === 1 ? 'rok' : 'lat'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.workHours}h/dzień
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            {employee.nightShiftAllowed ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className="text-xs text-gray-600">Zmiana nocna</span>
                          </div>
                          <div className="flex items-center">
                            {employee.overtimeAllowed ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className="text-xs text-gray-600">Nadgodziny</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {employees.length === 0 && (
                <div className="text-center py-12">
                  <IdentificationIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Brak kierowców
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Nie znaleziono kierowców spełniających kryteria wyszukiwania.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === 'matrix' && matrixData && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Macierz Kwalifikacji</h3>
            <p className="text-sm text-gray-500">
              Przegląd kwalifikacji wszystkich kierowców w formie tabeli
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kierowca
                  </th>
                  {matrixData.headers?.licenses?.map((license) => (
                    <th key={license} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {license}
                    </th>
                  ))}
                  {matrixData.headers?.equipment?.map((equipment) => (
                    <th key={equipment} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="truncate max-w-20" title={equipment}>
                        {equipment.substring(0, 10)}...
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suma
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matrixData.matrix?.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {row.employee.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {row.employee.position}
                      </div>
                    </td>
                    {matrixData.headers?.licenses?.map((license) => (
                      <td key={license} className="px-3 py-4 text-center">
                        {row.licenses[license] ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                    {matrixData.headers?.equipment?.map((equipment) => (
                      <td key={equipment} className="px-3 py-4 text-center">
                        {row.equipment[equipment] ? (
                          <CheckCircleIcon className="h-5 w-5 text-blue-500 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {row.totalLicenses + row.totalEquipment}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.totalLicenses}L + {row.totalEquipment}E
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinterDriverQualifications;