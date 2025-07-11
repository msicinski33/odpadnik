import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, Car, Building, Calendar, TrendingUp, Activity, MapPin, Clock, CheckCircle2, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import authFetch from '../utils/authFetch';
import CountUp from '../components/CountUp';

const fetchCount = async (url) => {
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Błąd pobierania danych');
  return res.json();
};

const Dashboard = () => {
  const { data: employees = [], isLoading: loadingEmp } = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchCount('http://localhost:3000/api/employees'),
  });
  const { data: vehicles = [], isLoading: loadingVeh } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => fetchCount('http://localhost:3000/api/vehicles'),
  });
  const { data: points = [], isLoading: loadingPts } = useQuery({
    queryKey: ['points'],
    queryFn: () => fetchCount('http://localhost:3000/api/points'),
  });
  const { data: regions = [], isLoading: loadingReg } = useQuery({
    queryKey: ['regions'],
    queryFn: () => fetchCount('http://localhost:3000/api/regions'),
  });
  const { data: todaySchedule = [], isLoading: loadingToday } = useQuery({
    queryKey: ['today-schedule'],
    queryFn: () => fetchCount('http://localhost:3000/api/calendar/today'),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                System Zarządzania Odpadami
              </h1>
              <p className="text-slate-600 mt-1 font-medium">Panel administracyjny - Przegląd operacyjny</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold">System aktywny</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Ostatnia aktualizacja</div>
                <div className="text-sm font-semibold text-slate-700">
                  {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/MonthlySchedule" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 min-h-[260px]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <TrendingUp className="h-5 w-5 opacity-70" />
                </div>
                <h3 className="text-xl font-bold mb-2">Miesięczny Plan Pracy</h3>
                <p className="text-blue-100 text-sm mb-4">Zarządzanie harmonogramem obsługi</p>
                <div className="flex items-center justify-between">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    Lipiec 2025 - Aktywny
                  </span>
                  <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                    Kliknij aby zarządzać →
                  </span>
                </div>
                <div className="mt-4">
                  {/* Demo link removed. Whole card is now clickable. */}
                </div>
              </div>
            </div>
          </Link>

          {/* Replace Dzienny Plan Pracy card with Karty Pracy */}
          <Link to="/work-card" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 min-h-[260px]">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-transparent"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="h-6 w-6" />
                  </div>
                  <Users className="h-5 w-5 opacity-70" />
                </div>
                <h3 className="text-xl font-bold mb-2">Karty Pracy</h3>
                <p className="text-indigo-100 text-sm mb-4">Rejestracja i przegląd kart pracy pracowników</p>
                <div className="flex items-center justify-between">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    Nowy moduł
                  </span>
                  <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                    Przejdź do kart pracy →
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/trasowka" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 min-h-[260px]">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-transparent"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <BarChart3 className="h-5 w-5 opacity-70" />
                </div>
                <h3 className="text-xl font-bold mb-2">Moduł Trasówek</h3>
                <p className="text-amber-100 text-sm mb-4">Generowanie raportów PDF tras</p>
                <div className="flex items-center justify-between">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    Gotowy do użycia
                  </span>
                  <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                    Generuj PDF →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors duration-300">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">ZESPÓŁ</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-slate-900">
                {loadingEmp ? (
                  <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <CountUp
                    key={`emp-${employees.length}`}
                    from={0}
                    to={employees.length}
                    separator=","
                    direction="up"
                    duration={1.5}
                    delay={0.2}
                    className="count-up-text"
                  />
                )}
              </div>
              <p className="text-sm text-slate-600 font-medium">Aktywni pracownicy</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors duration-300">
                <Car className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">FLOTA</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-slate-900">
                {loadingVeh ? (
                  <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <CountUp
                    key={`veh-${vehicles.length}`}
                    from={0}
                    to={vehicles.length}
                    separator=","
                    direction="up"
                    duration={1.5}
                    delay={0.4}
                    className="count-up-text"
                  />
                )}
              </div>
              <p className="text-sm text-slate-600 font-medium">Pojazdy operacyjne</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors duration-300">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">LOKALIZACJE</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-slate-900">
                {loadingPts ? (
                  <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <CountUp
                    key={`pts-${points.length}`}
                    from={0}
                    to={points.length}
                    separator=","
                    direction="up"
                    duration={1.5}
                    delay={0.6}
                    className="count-up-text"
                  />
                )}
              </div>
              <p className="text-sm text-slate-600 font-medium">Punkty zbiórki</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors duration-300">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">OBSZARY</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-slate-900">
                {loadingReg ? (
                  <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <CountUp
                    key={`reg-${regions.length}`}
                    from={0}
                    to={regions.length}
                    separator=","
                    direction="up"
                    duration={1.5}
                    delay={0.8}
                    className="count-up-text"
                  />
                )}
              </div>
              <p className="text-sm text-slate-600 font-medium">Regiony obsługi</p>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-200 rounded-lg">
                  <Clock className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Harmonogram Dzienny</h2>
                  <p className="text-sm text-slate-600">Zaplanowane zbiórki na dziś</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">
                  {new Date().toLocaleDateString('pl-PL', { 
                    day: 'numeric', 
                    month: 'short'
                  })}
                </div>
                <div className="text-sm text-slate-500">
                  {new Date().toLocaleDateString('pl-PL', { 
                    weekday: 'long'
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {loadingToday ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600"></div>
                  <p className="text-slate-600 font-medium">Ładowanie harmonogramu...</p>
                </div>
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Brak zaplanowanych zbiórek</h3>
                <p className="text-slate-500">Na dziś nie ma żadnych zaplanowanych operacji terenowych</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((entry, index) => (
                  <div key={`${entry.regionId}-${entry.fractionId}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: entry.fraction.color }}
                        ></div>
                        <div>
                          <div className="font-semibold text-slate-900">{entry.region.name}</div>
                          <div className="text-sm text-slate-600">{entry.fraction.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-white px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200">
                        {entry.fraction.code}
                      </span>
                      <div className="text-xs text-slate-500">
                        #{String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 