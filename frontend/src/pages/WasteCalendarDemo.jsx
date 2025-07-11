import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, Trash2, Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import WasteCalendar from "../components/WasteCalendar";
import authFetch from "../utils/authFetch";

const API = "http://localhost:3000/api";

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

function LoadingSpinner() {
  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-slate-700 font-medium">Ładowanie harmonogramu...</span>
        </div>
      </div>
    </div>
  );
}

export default function WasteCalendarDemo() {
  const [regions, setRegions] = useState([]);
  const [fractions, setFractions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedFractions, setSelectedFractions] = useState([]);
  const [removeMode, setRemoveMode] = useState(false);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const initialLoad = useRef(true);
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);

  const monthStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authFetch(`${API}/regions`).then(r => r.json()),
      authFetch(`${API}/fractions`).then(r => r.json()),
    ])
      .then(([regionsData, fractionsData]) => {
        setRegions(regionsData);
        setFractions(fractionsData);
        if (regionsData.length > 0) setSelectedRegion(regionsData[0].id);
        setLoading(false);
      })
      .catch(e => {
        setError("Błąd ładowania danych");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    setLoading(true);
    authFetch(`${API}/calendar?regionId=${selectedRegion}&month=${monthStr}`)
      .then(r => r.json())
      .then(data => {
        const dayMap = {};
        data.forEach(entry => {
          const day = new Date(entry.date).getDate();
          if (!dayMap[day]) dayMap[day] = [];
          dayMap[day].push(entry.fractionId);
        });
        setSchedule(dayMap);
        setLoading(false);
        initialLoad.current = false;
      })
      .catch(e => {
        setError("Błąd ładowania harmonogramu");
        setLoading(false);
      });
  }, [selectedRegion, monthStr]);

  const handleLegendClick = (fractionId) => {
    setSelectedFractions((prev) =>
      prev.includes(fractionId)
        ? prev.filter((id) => id !== fractionId)
        : [...prev, fractionId]
    );
  };

  const handleDayClick = async (day) => {
    if (!selectedRegion || selectedFractions.length === 0) return;
    const date = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setActionLoading(true);
    setError(null);
    try {
      if (removeMode) {
        const entriesToRemove = [];
        for (const fractionId of selectedFractions) {
          const resp = await authFetch(`${API}/calendar?regionId=${selectedRegion}&month=${monthStr}`);
          const data = await resp.json();
          const entry = data.find(e => {
            const entryDay = new Date(e.date).getDate();
            return entryDay === day && e.fractionId === fractionId;
          });
          if (entry) entriesToRemove.push(entry.id);
        }
        await Promise.all(entriesToRemove.map(id =>
          authFetch(`${API}/calendar/${id}`, { method: "DELETE" })
        ));
      } else {
        const alreadyAssigned = schedule[day] || [];
        const toAdd = selectedFractions.filter(fractionId => !alreadyAssigned.includes(fractionId));
        if (toAdd.length > 0) {
          const payload = toAdd.map(fractionId => ({
            regionId: selectedRegion,
            fractionId,
            date,
          }));
          await authFetch(`${API}/calendar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      }
      const resp = await authFetch(`${API}/calendar?regionId=${selectedRegion}&month=${monthStr}`);
      const data = await resp.json();
      const dayMap = {};
      data.forEach(entry => {
        const day = new Date(entry.date).getDate();
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(entry.fractionId);
      });
      setSchedule(dayMap);
    } catch (e) {
      setError("Błąd zapisu harmonogramu");
    }
    setActionLoading(false);
  };

  const handleRegionChange = (e) => {
    setSelectedRegion(Number(e.target.value));
  };

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 1) {
        setCalendarYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 12) {
        setCalendarYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  if (loading) return <LoadingOverlay />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Wystąpił błąd</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link to="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do panelu
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!regions.length || !fractions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-600 text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Brak danych</h3>
            <p className="text-slate-600 mb-6">Nie znaleziono danych do wyświetlenia</p>
            <Link to="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do panelu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Panel główny
              </Link>
              <div className="w-px h-6 bg-slate-300"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Harmonogram Odpadów</h1>
                  <p className="text-sm text-slate-600">Zarządzanie kalendarzem zbiórki</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Main Calendar Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-8 space-y-8">
            {/* Controls Section */}
            <div className="flex items-center gap-8">
              {/* Region Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Wybór regionu
                </label>
                <select
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm h-12"
                  value={selectedRegion || ''}
                  onChange={handleRegionChange}
                >
                  <option value="" disabled>Wybierz region</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              {/* Mode Toggle */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 invisible">
                  Tryb pracy
                </label>
                <button
                  type="button"
                  onClick={() => setRemoveMode(m => !m)}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 h-12
                    ${removeMode 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40' 
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                    }`}
                >
                  {removeMode ? (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Tryb usuwania
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Tryb dodawania
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-center gap-6 py-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h3 className="text-2xl font-bold text-slate-900 min-w-[280px] text-center">
                {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Fraction Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Frakcje odpadów
              </label>
              <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2">
                {fractions.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleLegendClick(f.id)}
                    className={`group p-4 rounded-xl border-2 transition-all duration-200 text-left min-w-[220px]
                      ${selectedFractions.includes(f.id) 
                        ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-500/20 ring-2 ring-blue-400 z-10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:scale-102'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: f.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{f.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{f.code}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="relative">
              {actionLoading && <LoadingSpinner />}
              <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <WasteCalendar
                  year={calendarYear}
                  month={calendarMonth}
                  schedule={schedule}
                  fractions={fractions}
                  onDayClick={handleDayClick}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">i</span>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Instrukcja obsługi</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Wybierz frakcję odpadów z listy powyżej, następnie kliknij dzień w kalendarzu, 
                    aby {removeMode ? "usunąć" : "dodać"} wybraną frakcję do harmonogramu zbiórki.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 