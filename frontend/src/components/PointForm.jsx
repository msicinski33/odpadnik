import React, { useState, useEffect } from 'react';
import authFetch from '../utils/authFetch';
import { X, MapPin } from 'lucide-react';

const PointForm = ({ initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    type: 'zamieszkala',
    town: '',
    street: '',
    number: '',
    companyName: '',
    startDate: '',
    endDate: '',
    isIndefinite: false,
    regionId: '',
    notes: '',
    activityNotes: '',
    kompostownik: false
  });
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    const fetchRegions = async () => {
      const res = await authFetch('http://localhost:3000/api/regions');
      setRegions(await res.json());
    };
    fetchRegions();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    const data = { ...form };
    
    // Convert to ISO-8601 DateTime if present
    if (data.startDate) data.startDate = new Date(data.startDate).toISOString();
    if (data.endDate) data.endDate = new Date(data.endDate).toISOString();
    if (form.isIndefinite) {
      data.endDate = null;
    }
    
    // Convert regionId to number
    if (data.regionId) data.regionId = Number(data.regionId);

    // Remove date fields for residential points
    if (data.type === 'zamieszkala') {
      delete data.startDate;
      delete data.endDate;
      delete data.isIndefinite;
    }
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[90vh] relative animate-fade-in overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-xl px-8 py-5 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <MapPin className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-white text-2xl font-bold flex-1">{initialData ? 'Edytuj punkt' : 'Dodaj nowy punkt'}</h2>
          <button onClick={onCancel} className="text-white hover:text-blue-200">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 bg-white rounded-b-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Typ punktu</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="zamieszkala">Zamieszkana</option>
                <option value="niezamieszkala">Niezamieszkana</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Region</label>
              <select
                name="regionId"
                value={form.regionId}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Wybierz region</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Miasto</label>
              <input
                name="town"
                type="text"
                value={form.town}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Ulica</label>
              <input
                name="street"
                type="text"
                value={form.street}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Numer</label>
              <input
                name="number"
                type="text"
                value={form.number}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Data rozpoczęcia</label>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                required={false}
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Data zakończenia</label>
              <input
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                disabled={form.isIndefinite}
              />
            </div>
            <div className="flex items-center mt-2">
              <input
                name="isIndefinite"
                type="checkbox"
                checked={form.isIndefinite}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="font-semibold text-gray-700">Nieokreślony termin</label>
            </div>
            {form.type === 'zamieszkala' && (
              <div className="flex items-center mt-2">
                <input
                  name="kompostownik"
                  type="checkbox"
                  checked={!!form.kompostownik}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="font-semibold text-gray-700">Kompostownik</label>
              </div>
            )}
            {form.type === 'niezamieszkala' && (
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Nazwa firmy</label>
                <input
                  name="companyName"
                  type="text"
                  value={form.companyName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          <div className="mt-4">
            <label className="block mb-2 font-semibold text-gray-700">Notatki</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
              rows="3"
            />
          </div>
          {form.type === 'niezamieszkala' && (
            <div className="mt-4">
              <label className="block mb-2 font-semibold text-gray-700">Notatki o działalności</label>
              <textarea
                name="activityNotes"
                value={form.activityNotes}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500"
                rows="3"
              />
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-3 justify-end mt-8">
            <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50">Anuluj</button>
            <button type="submit" className="flex-1 md:flex-none px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954 8.955c.44.439 1.152.439 1.591 0L21.75 12M12 3v17.25" /></svg>
              {initialData ? 'Zapisz zmiany' : 'Dodaj punkt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PointForm; 