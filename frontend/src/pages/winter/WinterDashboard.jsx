import React, { useState, useEffect } from 'react';
import { 
  CloudIcon,
  TruckIcon,
  CubeIcon,
  MapIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const WinterDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/winter-dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Mock data for demonstration
  const mockData = dashboardData || {
    vehicles: { total: 24, operational: 20, maintenance: 3, outOfService: 1 },
    materials: { salt: { current: 850, capacity: 1200, status: 'good' }, sand: { current: 420, capacity: 800, status: 'low' } },
    routes: { total: 156, active: 23, highPriority: 8, completed: 145 },
    personnel: { total: 48, available: 42, onDuty: 18, qualified: 38 },
    todayPlans: { total: 8, active: 3, completed: 4, pending: 1 },
    alerts: [
      { id: 1, type: 'warning', message: 'Niski stan piasku w magazynie głównym', time: '2 godz. temu' },
      { id: 2, type: 'info', message: 'Nowy plan dzienny na jutro wymaga zatwierdzenia', time: '4 godz. temu' },
      { id: 3, type: 'success', message: 'Wszystkie trasy priorytetowe zakończone', time: '6 godz. temu' }
    ]
  };

  const getStatusColor = (status, current, capacity) => {
    const percentage = (current / capacity) * 100;
    if (percentage > 70) return 'green';
    if (percentage > 30) return 'yellow';
    return 'red';
  };

  return (
    <div className="space-y-6">
      {/* Header with weather */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">❄️ Dashboard Akcji Zima</h1>
            <p className="text-blue-100">Centrum dowodzenia zimowego - {new Date().toLocaleDateString('pl-PL')}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end mb-2">
              <CloudIcon className="h-8 w-8 mr-2" />
              <span className="text-2xl font-bold">-3°C</span>
            </div>
            <p className="text-sm text-blue-100">Śnieżyca, wiatr 15 km/h</p>
            <p className="text-xs text-blue-200">Ostrzeżenie meteorologiczne aktywne</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Vehicles */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Flota Zimowa</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.vehicles.operational}/{mockData.vehicles.total}</p>
              <p className="text-sm text-green-600">Gotowe do akcji</p>
            </div>
            <TruckIcon className="h-12 w-12 text-blue-600" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Operacyjne: {mockData.vehicles.operational}</span>
              <span>Serwis: {mockData.vehicles.maintenance}</span>
            </div>
          </div>
        </div>

        {/* Materials */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Zapasy Materiałów</p>
              <p className="text-3xl font-bold text-gray-900">2</p>
              <p className="text-sm text-yellow-600">Typy dostępne</p>
            </div>
            <CubeIcon className="h-12 w-12 text-green-600" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Sól:</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '71%' }}></div>
                </div>
                <span className="text-xs text-gray-700">71%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Piasek:</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '53%' }}></div>
                </div>
                <span className="text-xs text-gray-700">53%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Routes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Trasy Aktywne</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.routes.active}</p>
              <p className="text-sm text-blue-600">W realizacji</p>
            </div>
            <MapIcon className="h-12 w-12 text-purple-600" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Wysoki priorytet: {mockData.routes.highPriority}</span>
              <span>Zakończone: {mockData.routes.completed}</span>
            </div>
          </div>
        </div>

        {/* Personnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Personel</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.personnel.available}/{mockData.personnel.total}</p>
              <p className="text-sm text-green-600">Dostępni</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-indigo-600" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Na służbie: {mockData.personnel.onDuty}</span>
              <span>Wykwalifikowani: {mockData.personnel.qualified}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Szybkie Akcje</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <CalendarDaysIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">Nowy Plan</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <TruckIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">Status Floty</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <MapIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">Trasy</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <CubeIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">Materiały</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            <ChartBarIcon className="h-8 w-8 text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-indigo-700">Raporty</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <BoltIcon className="h-8 w-8 text-red-600 mb-2" />
            <span className="text-sm font-medium text-red-700">Alerty</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Plans */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dzisiejsze Plany</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Plan dzienny - Zmiana I</p>
                  <p className="text-xs text-gray-500">06:00 - 14:00</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Aktywny
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Plan dzienny - Zmiana II</p>
                  <p className="text-xs text-gray-500">14:00 - 22:00</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Oczekujący
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Plan dzienny - Zmiana III</p>
                  <p className="text-xs text-gray-500">22:00 - 06:00</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Zaplanowany
              </span>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alerty i Powiadomienia</h3>
          <div className="space-y-3">
            {mockData.alerts.map((alert) => (
              <div key={alert.id} className={`flex items-start p-3 rounded-lg ${
                alert.type === 'warning' ? 'bg-yellow-50' :
                alert.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                {alert.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />}
                {alert.type === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5" />}
                {alert.type === 'info' && <ClockIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ostatnia Aktywność</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-900">Plan dzienny zaktualizowany</span>
            </div>
            <span className="text-xs text-gray-500">15 min temu</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <TruckIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-900">Pojazd WZ-456 zakończył trasę nr 23</span>
            </div>
            <span className="text-xs text-gray-500">32 min temu</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <CubeIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-900">Zużycie soli: 450kg na trasie A1-centrum</span>
            </div>
            <span className="text-xs text-gray-500">1 godz. temu</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-900">Jan Kowalski rozpoczął zmianę</span>
            </div>
            <span className="text-xs text-gray-500">2 godz. temu</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinterDashboard;