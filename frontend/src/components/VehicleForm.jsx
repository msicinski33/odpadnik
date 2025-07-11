import React, { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';

const VEHICLE_TYPES = [
  'BEZPYLNY',
  'DOSTAWCZY',
  'BRAMOWY',
  'HAKOWY',
  'ZAMIATARKA ULICZNA',
  'ZAMIATARKA CHODNIKOWA',
  'CIĄGNIK',
  'WYWROTKA',
  'MELEX',
  'ODKURZACZ',
  'KOSIARKA SAMOJEZDNA',
  'KOPARKO-ŁADOWARKA',
];
const FUEL_TYPES = [
  'ON',
  'CNG',
  'ELEKTRYCZNY',
];

const VehicleForm = ({ initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    brand: '',
    registrationNumber: '',
    vehicleType: '',
    capacity: '',
    fuelType: '',
    isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        capacity: initialData.capacity !== undefined && initialData.capacity !== null
          ? String(initialData.capacity).replace('.', ',')
          : ''
      });
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSwitch = () => {
    setForm(f => ({ ...f, isActive: !f.isActive }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Convert comma to dot and parse as float
    const numericCapacity = parseFloat(form.capacity.replace(',', '.'));
    onSubmit({ ...form, capacity: numericCapacity });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-xl px-8 py-5 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Truck className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-white text-2xl font-bold flex-1">{initialData ? 'Edytuj Pojazd' : 'Dodaj Nowy Pojazd'}</h2>
          <button onClick={onCancel} className="text-white hover:text-blue-200">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 bg-white rounded-b-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Marka</label>
              <input name="brand" value={form.brand} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500" placeholder="Wprowadź markę pojazdu" required />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Numer Rejestracyjny</label>
              <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500" placeholder="Wprowadź numer rejestracyjny" required />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Typ Pojazdu</label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500" required>
                <option value="">Wybierz typ pojazdu</option>
                {VEHICLE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Rodzaj Paliwa</label>
              <select name="fuelType" value={form.fuelType} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500" required>
                <option value="">Wybierz rodzaj paliwa</option>
                {FUEL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2 font-semibold text-gray-700">Pojemność</label>
              <input name="capacity" value={form.capacity} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500" placeholder="Wprowadź pojemność np. 10 t" required pattern="^\d{1,3}([\.,]\d{1,2})?\s*[a-zA-Z]*$" title="Wprowadź liczbę, np. 10 lub 6,5" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-semibold text-gray-700 mb-1">Status Pojazdu</div>
              <div className="text-gray-500 text-sm">Ustaw czy pojazd jest obecnie aktywny</div>
            </div>
            <button type="button" onClick={handleSwitch} className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${form.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}> 
              <span className="sr-only">Przełącz Aktywny</span>
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-7' : 'translate-x-1'}`}></span>
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 justify-end">
            <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50">Anuluj</button>
            <button type="submit" className="flex-1 md:flex-none px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954 8.955c.44.439 1.152.439 1.591 0L21.75 12M12 3v17.25" /></svg>
              {initialData ? 'Zapisz Zmiany' : 'Dodaj Pojazd'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleForm; 