import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import PointList from '../components/PointList';
import PointForm from '../components/PointForm';
import PointImportModal from '../components/PointImportModal';
import authFetch from '../utils/authFetch';
import PointDetails from '../components/PointDetails';
import { MapPin, Building2, Home, ArrowLeft, TrendingUp, BarChart3, Activity, AlertCircle } from 'lucide-react';
import DataPageHeader from '../components/ui/DataPageHeader';

const API_URL = 'http://localhost:3000/api/points';

const Points = ({ type: initialType }) => {
  const [type, setType] = useState(initialType || '');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const [stats, setStats] = useState({ totalPoints: 0, activeZones: 0 });
  const [residentialCount, setResidentialCount] = useState(0);
  const [commercialCount, setCommercialCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [totalRes, zonesRes, resRes, comRes] = await Promise.all([
          authFetch('http://localhost:3000/api/points/stats/total'),
          authFetch('http://localhost:3000/api/points/stats/active-zones'),
          authFetch('http://localhost:3000/api/points/type/zamieszkala'),
          authFetch('http://localhost:3000/api/points/type/niezamieszkala'),
        ]);
        const totalData = await totalRes.json();
        const zonesData = await zonesRes.json();
        const resData = await resRes.json();
        const comData = await comRes.json();
        setStats({
          totalPoints: totalData.total,
          activeZones: zonesData.activeZones,
        });
        setResidentialCount(Array.isArray(resData) ? resData.length : 0);
        setCommercialCount(Array.isArray(comData) ? comData.length : 0);
      } catch (e) {
        setStats({ totalPoints: 0, activeZones: 0 });
        setResidentialCount(0);
        setCommercialCount(0);
      }
    }
    fetchStats();
  }, []);

  // Filtering logic (like Vehicles)
  // Only filter when type is selected
  const [points, setPoints] = useState([]);
  useEffect(() => {
    if (type) {
      // Fetch points for selected type
      authFetch(`http://localhost:3000/api/points/type/${type}`)
        .then(res => res.json())
        .then(data => setPoints(data))
        .catch(() => setPoints([]));
    }
  }, [type]);

  const filteredPoints = points.filter(point =>
    (point.town || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (point.street || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (point.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (point.regionId ? point.regionId.toString() : '').includes(searchTerm)
  );

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
    setError('');
  };

  const handleEdit = (point) => {
    setEditing(point);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (data) => {
    setError('');
    try {
      if (editing && editing.id) {
        await authFetch(`${API_URL}/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        await authFetch(API_URL, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      setShowForm(false);
    } catch (err) {
      setError('Błąd zapisu punktu: ' + err.message);
    }
  };

  const handleImport = async (data) => {
    let errors = [];
    await Promise.all(data.map(async (point, idx) => {
      const res = await authFetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          type: type,
          town: point['Miasto'] || point['town'] || '',
          street: point['Ulica'] || point['street'] || '',
          number: point['Numer'] || point['number'] || '',
          regionId: point['ID Regionu'] || null,
          startDate: point['Data rozpoczęcia / Start Date'] ? new Date(point['Data rozpoczęcia / Start Date']).toISOString() : new Date().toISOString()
        }),
      });
      if (!res.ok) {
        let errMsg = '';
        try {
          const err = await res.json();
          errMsg = err.error || 'Błąd zapisu';
        } catch {
          errMsg = 'Błąd zapisu';
        }
        errors.push(`Wiersz ${idx + 1}: ${errMsg}`);
      }
    }));
    if (errors.length > 0) {
      alert('Błędy importu:\n' + errors.join('\n'));
    } else {
      window.location.reload();
    }
  };

  const pointTemplateColumns = ['Miasto', 'Ulica', 'Numer', 'ID Regionu', 'Data rozpoczęcia / Start Date'];

  if (!type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Premium Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white">
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                  <MapPin className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-3 tracking-tight">System Zarządzania Punktami</h1>
                  <p className="text-indigo-100 text-lg">Zaawansowana administracja lokalizacji i punktów obsługi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex justify-center gap-10 mb-12">
            {/* Total Points */}
            <Card className="min-w-[340px] w-[360px] hover:shadow-xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  WSZYSTKIE PUNKTY
                </CardTitle>
                <div className="p-3 rounded-xl bg-blue-100 shadow-sm">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {stats.totalPoints}
                </div>
                <p className="text-xs text-green-600 flex items-center font-semibold">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% vs zeszły miesiąc
                </p>
              </CardContent>
            </Card>
            {/* Active Zones */}
            <Card className="min-w-[340px] w-[360px] hover:shadow-xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  AKTYWNE STREFY
                </CardTitle>
                <div className="p-3 rounded-xl bg-green-100 shadow-sm">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {stats.activeZones}
                </div>
                <p className="text-xs text-green-600 flex items-center font-semibold">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% vs zeszły miesiąc
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Premium Type Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card 
              className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-0"
              onClick={() => setType('zamieszkala')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                    <Home className="h-10 w-10" />
                  </div>
                  <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-30 font-bold">
                    MIESZKAŃCY
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold mb-2">NIERUCHOMOŚCI ZAMIESZKAŁE</CardTitle>
                <p className="text-blue-100 text-lg">Kompleksowe zarządzanie nieruchomościami. Dodaj, usuń, edytuj i przeglądaj!</p>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold">{residentialCount}</div>
                    <div className="text-sm text-blue-100">Aktywne Punkty</div>
                  </div>
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold">96.3%</div>
                    <div className="text-sm text-blue-100">Pokrycie</div>
                  </div>
                </div>
                <Button 
                  className="w-full bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-semibold backdrop-blur-sm"
                  size="lg"
                >
                  Zarządzaj nieruchomościami zamieszkałymi →
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 text-white border-0"
              onClick={() => setType('niezamieszkala')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                    <Building2 className="h-10 w-10" />
                  </div>
                  <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-30 font-bold">
                    FIRMY
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold mb-2">NIERUCHOMOŚCI NIEZAMIESZKAŁE</CardTitle>
                <p className="text-purple-100 text-lg">Kompleksowe zarządzanie Kontrahentami. Dodaj nową umowę, frakcję czy częstotliwość!</p>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold">{commercialCount}</div>
                    <div className="text-sm text-purple-100">Aktywne Punkty</div>
                  </div>
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold">91.8%</div>
                    <div className="text-sm text-purple-100">Pokrycie</div>
                  </div>
                </div>
                <Button 
                  className="w-full bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-semibold backdrop-blur-sm"
                  size="lg"
                >
                  Zarządzaj nieruchomościami niezamieszkałymi →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Premium Header for Selected Type */}
      <div className={`bg-gradient-to-r ${type === 'zamieszkala' 
        ? 'from-blue-600 to-indigo-800' 
        : 'from-purple-600 to-pink-800'} text-white`}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setType('')}
                className="p-3 bg-white bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm group"
              >
                <ArrowLeft className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  {type === 'zamieszkala' ? <Home className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">
                    Punkty {type === 'zamieszkala' ? 'Zamieszkane' : 'Niezamieszkane'}
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    {type === 'zamieszkala' 
                      ? 'System zarządzania deklaracjami mieszkańców' 
                      : 'System zarządzania umowami kontrahentów'}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              {type === 'zamieszkala' ? 'Moduł Mieszkańców' : 'Moduł Kontrahentów'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Enhanced Controls Section - replaced with DataPageHeader */}
        <DataPageHeader
          title="Operacje Punktów"
          searchValue={searchTerm}
          onSearchChange={e => setSearchTerm(e.target.value)}
          searchPlaceholder="Szukaj punktów po nazwie, adresie, typie..."
          showSearch={true}
          showFilter={true}
          onFilterClick={() => {}}
          filterLabel="Filtry"
          ImportButtonComponent={
            <Button
              variant="outline"
              className="border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center"
              onClick={() => setImportModalOpen(true)}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
              Importuj Dane
            </Button>
          }
          onAddClick={handleAdd}
          addLabel="Dodaj Punkt"
        />
        <PointImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImport} />

        {/* Enhanced Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-red-100 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div className="text-red-800 font-semibold">{error}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {showForm ? (
          <PointForm
            initialData={editing}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <PointList
            type={type}
            points={filteredPoints}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onView={setViewing}
          />
        )}
        
        {viewing && (
          <PointDetails point={viewing} onClose={() => setViewing(null)} />
        )}
      </div>
    </div>
  );
};

export default Points; 