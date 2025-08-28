import React, { useState, useEffect } from 'react';
import { 
  CubeIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const WinterMaterials = () => {
  const [stocks, setStocks] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks', 'consumption', 'analytics'
  const [showModal, setShowModal] = useState(false);
  
  const [filters, setFilters] = useState({
    materialType: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [consumptionForm, setConsumptionForm] = useState({
    materialType: 'salt',
    quantity: '',
    unit: 'kg',
    operatorId: '',
    vehicleId: '',
    routeId: '',
    notes: ''
  });

  const materialColors = {
    salt: 'bg-blue-100 text-blue-800',
    sand: 'bg-yellow-100 text-yellow-800',
    gravel: 'bg-gray-100 text-gray-800',
    salt_brine: 'bg-purple-100 text-purple-800',
    mixed: 'bg-green-100 text-green-800'
  };

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    low: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-orange-100 text-orange-800',
    out_of_stock: 'bg-red-100 text-red-800'
  };

  // Fetch stocks
  const fetchStocks = async () => {
    try {
      const response = await fetch('/api/winter-materials/stocks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStocks(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
    }
  };

  // Fetch consumption
  const fetchConsumption = async () => {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/winter-materials/consumption?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConsumptions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch consumption:', err);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/winter-materials/analytics?period=30', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  // Save consumption
  const handleSaveConsumption = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/winter-materials/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(consumptionForm)
      });

      if (!response.ok) throw new Error('Failed to save consumption');

      setShowModal(false);
      setConsumptionForm({
        materialType: 'salt', quantity: '', unit: 'kg', operatorId: '',
        vehicleId: '', routeId: '', notes: ''
      });
      fetchConsumption();
      fetchStocks();
    } catch (err) {
      setError(err.message);
    }
  };

  // Export data
  const handleExport = async () => {
    try {
      const response = await fetch('/api/winter-materials/export?type=consumption&format=excel', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials-consumption-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed: ' + err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchStocks(), fetchConsumption(), fetchAnalytics()]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
          <h1 className="text-2xl font-bold text-gray-900">🧂 Sól i Piasek</h1>
          <p className="text-gray-600">Zarządzanie zapasami i zużyciem materiałów zimowych</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
            Eksport
          </button>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Dodaj Zużycie
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'stocks', name: 'Zapasy', icon: CubeIcon },
              { id: 'consumption', name: 'Zużycie', icon: TruckIcon },
              { id: 'analytics', name: 'Analityka', icon: ChartBarIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Stocks Tab */}
          {activeTab === 'stocks' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stocks.map((stock) => (
                  <div key={stock.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{stock.materialTypeLabel}</h3>
                        <p className="text-sm text-gray-500">{stock.location}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[stock.status]}`}>
                        {stock.statusLabel}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Obecny stan:</span>
                        <span className="text-sm font-medium">{stock.currentStock} {stock.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Pojemność max:</span>
                        <span className="text-sm font-medium">{stock.maxCapacity} {stock.unit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stock.status === 'available' ? 'bg-green-600' :
                            stock.status === 'low' ? 'bg-yellow-600' :
                            stock.status === 'critical' ? 'bg-orange-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, (stock.currentStock / stock.maxCapacity) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consumption Tab */}
          {activeTab === 'consumption' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Typ materiału</label>
                    <select
                      value={filters.materialType}
                      onChange={(e) => setFilters({ ...filters, materialType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Wszystkie</option>
                      <option value="salt">Sól drogowa</option>
                      <option value="sand">Piasek</option>
                      <option value="gravel">Żwir</option>
                      <option value="salt_brine">Solanka</option>
                      <option value="mixed">Mieszanka</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data od</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data do</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materiał</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pojazd</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consumptions.map((consumption) => (
                      <tr key={consumption.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(consumption.date).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${materialColors[consumption.materialType]}`}>
                            {consumption.materialTypeLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {consumption.quantity} {consumption.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {consumption.operatorName || 'Brak danych'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {consumption.vehicleInfo || 'Brak danych'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <CubeIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Całkowite zużycie</p>
                      <p className="text-2xl font-bold text-blue-900">{analytics.totalConsumption}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <CalendarIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Średnia dzienna</p>
                      <p className="text-2xl font-bold text-green-900">{Math.round(analytics.averageDaily)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">Rekordów</p>
                      <p className="text-2xl font-bold text-yellow-900">{analytics.totalRecords}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <TruckIcon className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Okres</p>
                      <p className="text-2xl font-bold text-purple-900">{analytics.period}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Zużycie według materiału</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.materialBreakdown).map(([material, data]) => (
                    <div key={material} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${materialColors[material]}`}>
                          {data.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{data.quantity} kg</div>
                        <div className="text-xs text-gray-500">{data.count} operacji</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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

      {/* Consumption Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Dodaj Zużycie Materiału</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveConsumption} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ materiału *</label>
                  <select
                    required
                    value={consumptionForm.materialType}
                    onChange={(e) => setConsumptionForm({ ...consumptionForm, materialType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="salt">Sól drogowa</option>
                    <option value="sand">Piasek</option>
                    <option value="gravel">Żwir</option>
                    <option value="salt_brine">Solanka</option>
                    <option value="mixed">Mieszanka</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ilość *</label>
                  <div className="flex">
                    <input
                      type="number"
                      required
                      value={consumptionForm.quantity}
                      onChange={(e) => setConsumptionForm({ ...consumptionForm, quantity: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={consumptionForm.unit}
                      onChange={(e) => setConsumptionForm({ ...consumptionForm, unit: e.target.value })}
                      className="px-3 py-2 border-t border-r border-b rounded-r-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kg">kg</option>
                      <option value="t">t</option>
                      <option value="l">l</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                <textarea
                  value={consumptionForm.notes}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                  Anuluj
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinterMaterials;