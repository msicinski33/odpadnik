import React, { useState, useEffect, Fragment } from 'react';
import { 
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  PlusIcon,
  FunnelIcon,
  CalendarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const WinterVehicleReadiness = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    status: '',
    equipmentType: '',
    activeOnly: true
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'timeline'
  const [statusTypes, setStatusTypes] = useState({});

  // Fetch vehicle readiness data
  const fetchVehicleReadiness = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        date: selectedDate,
        status: filters.status,
        equipmentType: filters.equipmentType,
        activeOnly: filters.activeOnly.toString()
      });

      const response = await fetch(`/api/winter-vehicle-readiness?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vehicle readiness');
      }

      const data = await response.json();
      setVehicles(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch timeline data for multiple vehicles
  const fetchTimeline = async () => {
    try {
      const endDate = selectedDate;
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`/api/winter-vehicle-readiness/timeline?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimelineData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    }
  };

  // Fetch status types
  const fetchStatusTypes = async () => {
    try {
      const response = await fetch('/api/winter-vehicle-readiness/types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatusTypes(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch status types:', err);
    }
  };

  // Update vehicle status
  const updateVehicleStatus = async (vehicleId, statusData) => {
    try {
      const response = await fetch(`/api/winter-vehicle-readiness/${vehicleId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(statusData)
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle status');
      }

      // Refresh data
      fetchVehicleReadiness();
      setShowStatusModal(false);
      setSelectedVehicle(null);
    } catch (err) {
      setError('Failed to update vehicle status: ' + err.message);
    }
  };

  useEffect(() => {
    fetchVehicleReadiness();
    fetchStatusTypes();
    if (viewMode === 'timeline') {
      fetchTimeline();
    }
  }, [selectedDate, filters, viewMode]);

  // Get cell color based on status (for timeline grid)
  const getCellColor = (status) => {
    const colors = {
      operational: 'bg-green-200',
      out_of_service_vehicle: 'bg-orange-200',
      out_of_service_device: 'bg-orange-200',
      reconfigured: 'bg-yellow-200',
      maintenance: 'bg-blue-200',
      standby: 'bg-purple-200'
    };
    return colors[status] || 'bg-gray-200';
  };

  // Get badge color for status badges (for current view)
  const getBadgeColor = (status) => {
    const colors = {
      operational: 'bg-green-100 text-green-800',
      out_of_service_vehicle: 'bg-red-100 text-red-800',
      out_of_service_device: 'bg-orange-100 text-orange-800',
      reconfigured: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      standby: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status symbol for timeline grid
  const getStatusSymbol = (status) => {
    const symbols = {
      operational: '-',
      out_of_service_vehicle: 'P',
      out_of_service_device: 'U', 
      reconfigured: 'Z',
      maintenance: 'S',
      standby: 'G'
    };
    return symbols[status] || '?';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'out_of_service_vehicle':
      case 'out_of_service_device':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'maintenance':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-600" />;
      case 'reconfigured':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
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
          <h1 className="text-2xl font-bold text-gray-900">🚛 Gotowość Pojazdów</h1>
          <p className="text-gray-600">Timeline gotowości operacyjnej floty zimowej</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'current' ? 'timeline' : 'current')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CalendarIcon className="h-5 w-5 inline mr-2" />
            {viewMode === 'current' ? 'Widok Timeline' : 'Widok Aktualny'}
          </button>
          <button
            onClick={() => setShowStatusModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Aktualizuj Status
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Wszystkie statusy</option>
              {statusTypes.statusTypes?.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wyposażenie</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.equipmentType}
              onChange={(e) => setFilters({ ...filters, equipmentType: e.target.value })}
            >
              <option value="">Wszystkie typy</option>
              {statusTypes.equipmentTypes?.map((equipment) => (
                <option key={equipment.value} value={equipment.value}>
                  {equipment.label}
                </option>
              ))}
            </select>
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

      {viewMode === 'current' && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <TruckIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Łącznie pojazdów</p>
                  <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Sprawne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vehicles.filter(v => v.winterStatus.status === 'operational').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <XCircleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Niesprawne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vehicles.filter(v => 
                      v.winterStatus.status === 'out_of_service_vehicle' || 
                      v.winterStatus.status === 'out_of_service_device'
                    ).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">W serwisie</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vehicles.filter(v => v.winterStatus.status === 'maintenance').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

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
                      Status Zimowy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wyposażenie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uwagi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ostatnia Aktualizacja
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Przydziały
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
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <TruckIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.registrationNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.brand} • {vehicle.vehicleType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(vehicle.winterStatus.status)}
                          <div className="ml-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(vehicle.winterStatus.status)}`}>
                              {vehicle.winterStatus.statusLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.winterStatus.equipmentLabel ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {vehicle.winterStatus.equipmentLabel}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Brak</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {vehicle.winterStatus.notes || <span className="text-gray-400">Brak uwag</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.winterStatus.lastUpdated ? (
                          <div>
                            <div>{new Date(vehicle.winterStatus.lastUpdated).toLocaleDateString('pl-PL')}</div>
                            {vehicle.winterStatus.reportedBy && (
                              <div className="text-xs text-gray-400">
                                przez {vehicle.winterStatus.reportedBy}
                              </div>
                            )}
                          </div>
                        ) : (
                          'Brak danych'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {vehicle.assignments.routes.map((route, index) => (
                            <div key={index} className="text-xs">
                              <span className="font-medium">{route.routeName}</span>
                              {route.driverName && (
                                <span className="text-gray-500"> • {route.driverName}</span>
                              )}
                            </div>
                          ))}
                          {vehicle.assignments.dailyPlan.map((plan, index) => (
                            <div key={index} className="text-xs">
                              <span className="font-medium">{plan.assignmentType}</span>
                              {plan.driverName && (
                                <span className="text-gray-500"> • {plan.driverName}</span>
                              )}
                            </div>
                          ))}
                          {vehicle.assignments.routes.length === 0 && vehicle.assignments.dailyPlan.length === 0 && (
                            <span className="text-xs text-gray-400">Brak przydziałów</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowStatusModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Aktualizuj Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {vehicles.length === 0 && (
                <div className="text-center py-12">
                  <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Brak pojazdów
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Nie znaleziono pojazdów spełniających kryteria wyszukiwania.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === 'timeline' && timelineData && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Stan pojazdów po ich sprawdzeniu przez DT oraz ZUC</h3>
            <p className="text-sm text-gray-500">
              Widok zmian statusu w ostatnich 14 dniach
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 min-w-[300px]">
                    Pojazd
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-900 min-w-[60px]">
                    Uwagi
                  </th>
                  {timelineData.dateRange?.map((date, index) => {
                    const dateObj = new Date(date);
                    const isEven = index % 2 === 0;
                    return (
                      <React.Fragment key={date}>
                        <th className={`border border-gray-300 px-1 py-1 text-center text-xs font-medium ${isEven ? 'bg-blue-50' : 'bg-green-50'} min-w-[40px]`}>
                          <div className="text-gray-700">{isEven ? 'ZUC' : 'DT'}</div>
                          <div className="text-gray-600">{dateObj.getDate()}.{(dateObj.getMonth() + 1).toString().padStart(2, '0')}</div>
                        </th>
                      </React.Fragment>
                    );
                  })}
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-1 sticky left-0 bg-gray-100 z-10"></th>
                  <th className="border border-gray-300 px-2 py-1"></th>
                  {timelineData.dateRange?.map((date) => (
                    <th key={date} className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-600">
                      {new Date(date).toLocaleDateString('pl-PL', { 
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timelineData.data?.map((vehicleTimeline, vehicleIndex) => {
                  const vehicle = vehicleTimeline.vehicle;
                  const isEvenRow = vehicleIndex % 2 === 0;
                  
                  return (
                    <tr key={vehicle.id} className={`${isEvenRow ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50`}>
                      <td className="border border-gray-300 px-4 py-2 sticky left-0 z-10 bg-inherit">
                        <div className="text-sm">
                          <div className="font-semibold text-red-600">
                            {vehicle.registrationNumber}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {vehicle.brand} • {vehicle.vehicleType}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            pojazd w stałej gotowości - uzbrojony
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                        {/* Vehicle notes/remarks column */}
                        <div className="text-gray-600">-</div>
                      </td>
                      {vehicleTimeline.timeline?.map((dayStatus, dateIndex) => {
                        const cellColor = getCellColor(dayStatus.status);
                        const statusSymbol = getStatusSymbol(dayStatus.status);
                        
                        return (
                          <td 
                            key={dateIndex} 
                            className={`border border-gray-300 text-center align-middle ${cellColor} min-h-[40px] relative group`}
                            title={`${dayStatus.statusLabel}${dayStatus.inherited ? ' (odziedziczony)' : ''}\n${dayStatus.notes || ''}\n${dayStatus.reportedBy ? 'Zgłoszone przez: ' + dayStatus.reportedBy : ''}`}
                          >
                            <div className="p-1 h-full flex items-center justify-center">
                              {dayStatus.inherited ? (
                                <div className="text-gray-400 text-xs">-</div>
                              ) : (
                                <div className="font-bold text-sm">{statusSymbol}</div>
                              )}
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap">
                              <div>{dayStatus.statusLabel}</div>
                              {dayStatus.notes && <div className="text-gray-300">{dayStatus.notes}</div>}
                              {dayStatus.reportedBy && <div className="text-gray-300">przez: {dayStatus.reportedBy}</div>}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Legenda</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-200 border border-gray-300 flex items-center justify-center font-bold">-</div>
                <span>pojazd sprawny</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-200 border border-gray-300 flex items-center justify-center font-bold">P</div>
                <span>pojazd niesprawny - P (pojazd)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-200 border border-gray-300 flex items-center justify-center font-bold">U</div>
                <span>pojazd niesprawny - U (urządzenie)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-200 border border-gray-300 flex items-center justify-center font-bold">Z</div>
                <span>zamiatarka - Z (przezbrojone)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-200 border border-gray-300 flex items-center justify-center font-bold text-white">S</div>
                <span>pojazd sprawny - bez posypywarki (jedynie płużenie)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <StatusUpdateModal
          vehicle={selectedVehicle}
          statusTypes={statusTypes}
          onSave={(statusData) => {
            if (selectedVehicle) {
              updateVehicleStatus(selectedVehicle.id, statusData);
            } else {
              // Handle bulk update or new status entry
              console.log('Bulk update:', statusData);
            }
          }}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedVehicle(null);
          }}
        />
      )}
    </div>
  );
};

// Status Update Modal Component
const StatusUpdateModal = ({ vehicle, statusTypes, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    status: vehicle?.winterStatus.status || 'operational',
    equipmentType: vehicle?.winterStatus.equipmentType || '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {vehicle ? `Aktualizuj Status: ${vehicle.registrationNumber}` : 'Nowy Status Pojazdu'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statusTypes.statusTypes?.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ Wyposażenia</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.equipmentType}
                onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
              >
                <option value="">Brak wyposażenia</option>
                {statusTypes.equipmentTypes?.map((equipment) => (
                  <option key={equipment.value} value={equipment.value}>
                    {equipment.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Dodatkowe informacje..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Anuluj
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Zapisz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinterVehicleReadiness;