import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  UserIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const WinterPhoneNumbers = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    qualifications: '',
    driversLicense: '',
    activeOnly: true
  });
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false);

  // Fetch phone directory data
  const fetchPhoneDirectory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: searchTerm,
        qualifications: filters.qualifications,
        driversLicense: filters.driversLicense,
        activeOnly: filters.activeOnly.toString()
      });

      const response = await fetch(`/api/winter-phone-numbers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch phone directory');
      }

      const data = await response.json();
      setEmployees(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch emergency contacts
  const fetchEmergencyContacts = async () => {
    try {
      const response = await fetch('/api/winter-phone-numbers/emergency-contacts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmergencyContacts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch emergency contacts:', err);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        format: 'excel',
        search: searchTerm,
        qualifications: filters.qualifications,
        driversLicense: filters.driversLicense,
        activeOnly: filters.activeOnly.toString()
      });

      const response = await fetch(`/api/winter-phone-numbers/export?${queryParams}`, {
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
      a.download = `winter-phone-directory-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data: ' + err.message);
    }
  };

  useEffect(() => {
    fetchPhoneDirectory();
    fetchEmergencyContacts();
  }, [searchTerm, filters]);

  const displayedEmployees = showEmergencyOnly ? emergencyContacts : employees;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">📞 Książka Telefoniczna Zima</h1>
          <p className="text-gray-600">Katalog kontaktów do pracowników na okres zimowy</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowEmergencyOnly(!showEmergencyOnly)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showEmergencyOnly 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            Kontakty Awaryjne
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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj po imieniu, nazwisku, stanowisku..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Qualifications Filter */}
          <div>
            <input
              type="text"
              placeholder="Kwalifikacje zimowe..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.qualifications}
              onChange={(e) => setFilters({ ...filters, qualifications: e.target.value })}
            />
          </div>

          {/* Driver License Filter */}
          <div>
            <input
              type="text"
              placeholder="Kategoria prawa jazdy..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.driversLicense}
              onChange={(e) => setFilters({ ...filters, driversLicense: e.target.value })}
            />
          </div>

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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Łącznie kontaktów</p>
              <p className="text-2xl font-bold text-gray-900">{displayedEmployees.length}</p>
            </div>
          </div>
        </div>
        
        {!showEmergencyOnly && (
          <>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <PhoneIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Z kwalifikacjami zimowymi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.winterQualifications.length > 0).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <FunnelIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Kierowcy (C, C+E, T)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => 
                      emp.driversLicenseArray.some(cat => ['C', 'C+E', 'T'].includes(cat))
                    ).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Kontakty awaryjne</p>
                  <p className="text-2xl font-bold text-gray-900">{emergencyContacts.length}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pracownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prawa Jazdy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kwalifikacje Zimowe
                </th>
                {showEmergencyOnly && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorytet
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedEmployees.map((employee) => (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`tel:${employee.phone}`} className="hover:text-blue-600">
                          {employee.phone}
                        </a>
                      </div>
                      {employee.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={`mailto:${employee.email}`} className="hover:text-blue-600">
                            {employee.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {employee.driversLicenseArray?.map((category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {employee.winterQualifications?.map((qual, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {qual}
                        </span>
                      ))}
                    </div>
                  </td>
                  {showEmergencyOnly && employee.priority && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(employee.priority)}`}>
                        {employee.priority}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {displayedEmployees.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Brak kontaktów
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {showEmergencyOnly 
                  ? 'Nie znaleziono kontaktów awaryjnych.' 
                  : 'Nie znaleziono pracowników spełniających kryteria wyszukiwania.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WinterPhoneNumbers;