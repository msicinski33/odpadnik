import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import authFetch from '../utils/authFetch';
import TrasowkaModal from '../components/TrasowkaModal';
import { Download, FileText, MapPin, ArrowLeft, Truck, Users, Building } from 'lucide-react';

const Trasowka = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fractionAssignments, setFractionAssignments] = useState([]);
  const [generatedPDF, setGeneratedPDF] = useState(null);

  // Fetch regions
  const { data: regions = [], isLoading: loadingRegions } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const res = await authFetch('http://localhost:3000/api/regions');
      if (!res.ok) throw new Error('Błąd pobierania regionów');
      return res.json();
    },
  });

  // Fetch points for selected region
  const { data: points = [], isLoading: loadingPoints } = useQuery({
    queryKey: ['points', selectedRegion?.id],
    queryFn: async () => {
      if (!selectedRegion) return [];
      const res = await authFetch(`http://localhost:3000/api/points?regionId=${selectedRegion.id}&type=zamieszkala`);
      if (!res.ok) throw new Error('Błąd pobierania punktów');
      return res.json();
    },
    enabled: !!selectedRegion,
  });

  // Debug: log points array
  console.log('Trasowka points:', points);

  // Fetch fractions
  const { data: fractions = [], isLoading: loadingFractions } = useQuery({
    queryKey: ['fractions'],
    queryFn: async () => {
      const res = await authFetch('http://localhost:3000/api/fractions');
      if (!res.ok) throw new Error('Błąd pobierania frakcji');
      return res.json();
    },
  });

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setFractionAssignments([]);
    setGeneratedPDF(null);
  };

  const handleFractionAssignment = (assignments) => {
    setFractionAssignments(assignments);
    setShowModal(false);
  };

  const handleGeneratePDF = async () => {
    if (!selectedRegion || fractionAssignments.length === 0) {
      alert('Proszę wybrać region i przypisać frakcje');
      return;
    }

    try {
      const response = await authFetch('http://localhost:3000/api/trasowka/generate', {
        method: 'POST',
        body: JSON.stringify({
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
          points: points,
          fractionAssignments: fractionAssignments,
        }),
      });

      if (!response.ok) throw new Error('Błąd generowania PDF');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedPDF(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Błąd generowania PDF: ' + error.message);
    }
  };

  const handleDownloadPDF = () => {
    if (generatedPDF) {
      const link = document.createElement('a');
      link.href = generatedPDF;
      link.download = `trasowka_${selectedRegion?.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Generator Trasówek</h1>
                  <p className="text-sm text-slate-600">Tworzenie dokumentów dla tras zbiórki</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Region Selection */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Wybór regionu</h2>
            </div>
            
            {loadingRegions ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-slate-600 font-medium">Ładowanie regionów...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionSelect(region)}
                    className={`group p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedRegion?.id === region.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/25 scale-105'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:scale-102'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedRegion?.id === region.id ? 'bg-blue-500' : 'bg-slate-100 group-hover:bg-blue-100'
                      } transition-colors`}>
                        <Building className={`w-5 h-5 ${
                          selectedRegion?.id === region.id ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                          {region.name}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">{region.unitName}</div>
                        {selectedRegion?.id === region.id && (
                          <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mt-2">
                            ✓ Wybrane
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Region Details and Configuration */}
        {selectedRegion && (
          <>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Konfiguracja: {selectedRegion.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 font-medium"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Przypisz frakcje
                  </button>
                </div>

                {loadingPoints ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-slate-600 font-medium">Ładowanie punktów zbiórki...</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Punkty zbiórki</p>
                          <p className="text-2xl font-bold text-blue-900">{points.length}</p>
                        </div>
                        <MapPin className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-700">Przypisane frakcje</p>
                          <p className="text-2xl font-bold text-emerald-900">{fractionAssignments.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-emerald-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-700">Status</p>
                          <p className="text-sm font-bold text-purple-900">
                            {fractionAssignments.length > 0 ? 'Gotowe do generowania' : 'Wymaga konfiguracji'}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          fractionAssignments.length > 0 ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          <span className={`text-sm ${
                            fractionAssignments.length > 0 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {fractionAssignments.length > 0 ? '✓' : '⚠'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fraction Assignments Preview */}
                {fractionAssignments.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4">Przypisane frakcje odpadów</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {fractionAssignments.map((assignment, idx) => {
                        const fraction = fractions.find(f => f.id === parseInt(assignment.fractionId));
                        return (
                          <div
                            key={idx}
                            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200"
                          >
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: fraction?.color || '#gray' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 text-sm truncate">
                                {fraction?.name}
                              </div>
                              <div className="text-xs text-slate-500">{assignment.date}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PDF Generation */}
            {fractionAssignments.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Generowanie dokumentu PDF</h2>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleGeneratePDF}
                      className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 font-semibold"
                    >
                      <FileText className="w-5 h-5 mr-3" />
                      Generuj trasówkę PDF
                    </button>
                    
                    {generatedPDF && (
                      <button
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 font-semibold"
                      >
                        <Download className="w-5 h-5 mr-3" />
                        Pobierz dokument
                      </button>
                    )}
                  </div>

                  {generatedPDF && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold text-sm">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">Dokument wygenerowany pomyślnie</p>
                          <p className="text-sm text-green-700">
                            Trasówka PDF została utworzona i jest gotowa do pobrania.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <TrasowkaModal
            fractions={fractions}
            loadingFractions={loadingFractions}
            onClose={() => setShowModal(false)}
            onSave={handleFractionAssignment}
            currentAssignments={fractionAssignments}
          />
        )}
      </div>
    </div>
  );
};

export default Trasowka; 