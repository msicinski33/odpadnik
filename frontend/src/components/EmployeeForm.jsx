import React, { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';

// Driver's license categories with icons
const LICENSE_CATEGORIES = [
  { code: 'AM', name: 'AM', icon: '🛵', description: 'Motorower' },
  { code: 'A1', name: 'A1', icon: '🏍️', description: 'Motocykl' },
  { code: 'A2', name: 'A2', icon: '🏍️', description: 'Motocykl' },
  { code: 'A', name: 'A', icon: '🏍️', description: 'Motocykl' },
  { code: 'B1', name: 'B1', icon: '🚗', description: 'Samochód osobowy' },
  { code: 'B', name: 'B', icon: '🚗', description: 'Samochód osobowy' },
  { code: 'C1', name: 'C1', icon: '🚛', description: 'Samochód ciężarowy' },
  { code: 'C', name: 'C', icon: '🚛', description: 'Samochód ciężarowy' },
  { code: 'D1', name: 'D1', icon: '🚌', description: 'Autobus' },
  { code: 'D', name: 'D', icon: '🚌', description: 'Autobus' },
  { code: 'BE', name: 'BE', icon: '🚗+', description: 'Samochód z przyczepą' },
  { code: 'C1E', name: 'C1E', icon: '🚛+', description: 'Ciężarówka z przyczepą' },
  { code: 'CE', name: 'CE', icon: '🚛+', description: 'Ciężarówka z przyczepą' },
  { code: 'D1E', name: 'D1E', icon: '🚌+', description: 'Autobus z przyczepą' },
  { code: 'DE', name: 'DE', icon: '🚌+', description: 'Autobus z przyczepą' },
  { code: 'T', name: 'T', icon: '🚜', description: 'Ciągnik rolniczy' },
  { code: 'HDS', name: 'HDS', icon: '🏗️', description: 'Żuraw hydrauliczny' },
  { code: 'ADR', name: 'ADR', icon: '⚠️', description: 'Transport materiałów niebezpiecznych' },
  { code: 'ŻURAW', name: 'ŻURAW', icon: '🏗️', description: 'Operator żurawia' },
  { code: 'KOPARKO-ŁADOWARKA', name: 'KOPARKO-ŁADOWARKA', icon: '🚜', description: 'Koparko-ładowarka' },
];

const EmployeeForm = ({ initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    surname: '',
    position: '',
    phone: '',
    email: '',
    hiredAt: '',
    hasDisabilityCertificate: false,
    workHours: 8,
    overtimeAllowed: false,
    nightShiftAllowed: false,
    driversLicenseCategories: '',
    vacationDays: 26,
  });

  // Parse existing license categories into selected state
  const [selectedLicenses, setSelectedLicenses] = useState({});

  useEffect(() => {
    if (initialData) {
      const updatedForm = {
        ...initialData,
        workHours: initialData.workHours ?? 8,
        overtimeAllowed: initialData.overtimeAllowed ?? false,
        nightShiftAllowed: initialData.nightShiftAllowed ?? false,
      };
      setForm(updatedForm);
      
      // Parse existing license categories
      if (initialData.driversLicenseCategories) {
        const categories = initialData.driversLicenseCategories.split(',').map(cat => cat.trim());
        const selected = {};
        categories.forEach(cat => {
          selected[cat] = true;
        });
        setSelectedLicenses(selected);
      }
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleLicenseToggle = (categoryCode) => {
    setSelectedLicenses(prev => ({
      ...prev,
      [categoryCode]: !prev[categoryCode]
    }));
  };



  const handleSubmit = e => {
    e.preventDefault();
    // Convert selected licenses back to comma-separated string
    const selectedCategories = Object.keys(selectedLicenses).filter(cat => selectedLicenses[cat]);
    const licenseString = selectedCategories.join(', ');
    
    let submitData = { 
      ...form, 
      driversLicenseCategories: licenseString 
    };
    
    if (!form.hiredAt) {
      submitData.hiredAt = null;
    } else {
      submitData.hiredAt = new Date(form.hiredAt).toISOString();
    }
    submitData.workHours = Number(submitData.workHours);
    submitData.vacationDays = Number(submitData.vacationDays);
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-xl px-8 py-5 flex items-center gap-4 sticky top-0 z-10">
          <div className="bg-blue-100 p-3 rounded-lg">
            <User className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-white text-2xl font-bold flex-1">{initialData ? 'Edytuj pracownika' : 'Dodaj nowego pracownika'}</h2>
          <button onClick={onCancel} className="text-white hover:text-blue-200">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 bg-white rounded-b-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-semibold mb-2">Imię</label>
              <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź imię" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Nazwisko</label>
              <input name="surname" value={form.surname} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź nazwisko" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Stanowisko</label>
              <input name="position" value={form.position} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź stanowisko" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź email" type="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Data zatrudnienia</label>
              <input name="hiredAt" value={form.hiredAt || ''} onChange={handleChange} type="date" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
            </div>
            <div className="flex items-center mt-6">
              <input id="disability" name="hasDisabilityCertificate" type="checkbox" checked={form.hasDisabilityCertificate} onChange={handleChange} className="mr-2" />
              <label htmlFor="disability" className="text-sm font-semibold">Posiada orzeczenie o niepełnosprawności</label>
            </div>
            {/* New fields for work hours and permissions */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Wymiar pracy</label>
              <select name="workHours" value={form.workHours || 8} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base">
                <option value={8}>8 godzin</option>
                <option value={7}>7 godzin</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Wymiar urlopu</label>
              <input 
                name="vacationDays" 
                type="number" 
                min="0" 
                max="365"
                value={form.vacationDays || 26} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                placeholder="26"
              />
              <p className="text-xs text-gray-500 mt-1">Liczba dni urlopu w roku (domyślnie 26)</p>
            </div>
            <div className="mt-4 flex gap-6">
              <div className="flex items-center">
                <input id="overtimeAllowed" name="overtimeAllowed" type="checkbox" checked={!!form.overtimeAllowed} onChange={handleChange} className="mr-2" />
                <label htmlFor="overtimeAllowed" className="text-sm font-semibold">Praca w godzinach nadliczbowych</label>
              </div>
              <div className="flex items-center">
                <input id="nightShiftAllowed" name="nightShiftAllowed" type="checkbox" checked={!!form.nightShiftAllowed} onChange={handleChange} className="mr-2" />
                <label htmlFor="nightShiftAllowed" className="text-sm font-semibold">Praca w godzinach nocnych</label>
              </div>
            </div>
            
                        {/* Driver's License Categories Cards */}
            <div className="md:col-span-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <label className="block text-lg font-bold text-gray-900">Kategorie prawa jazdy</label>
                      <p className="text-sm text-gray-600">Wybierz kategorie, które posiada pracownik</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-gray-200">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={Object.keys(selectedLicenses).length > 0 && Object.values(selectedLicenses).every(v => v)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allSelected = {};
                          LICENSE_CATEGORIES.forEach(cat => {
                            allSelected[cat.code] = true;
                          });
                          setSelectedLicenses(allSelected);
                        } else {
                          setSelectedLicenses({});
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">Zaznacz wszystkie</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {LICENSE_CATEGORIES.map((category) => (
                    <div 
                      key={category.code} 
                      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        selectedLicenses[category.code] 
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => handleLicenseToggle(category.code)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          checked={selectedLicenses[category.code] || false}
                          onChange={() => handleLicenseToggle(category.code)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-3xl">{category.icon}</span>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-gray-900 mb-1">{category.name}</div>
                        <div className="text-xs text-gray-600 leading-tight">{category.description}</div>
                      </div>
                      {selectedLicenses[category.code] && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Wybrano: <span className="font-semibold text-blue-600">
                      {Object.keys(selectedLicenses).filter(cat => selectedLicenses[cat]).length}
                    </span> z {LICENSE_CATEGORIES.length} kategorii
                  </p>
                </div>
              </div>
            </div>
            

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Telefon</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź telefon" />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 justify-end">
            <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50">Anuluj</button>
            <button type="submit" className="flex-1 md:flex-none px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954 8.955c.44.439 1.152.439 1.591 0L21.75 12M12 3v17.25" /></svg>
              {initialData ? 'Zapisz zmiany' : 'Dodaj pracownika'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm; 