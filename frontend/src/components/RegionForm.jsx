import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';

const RegionForm = ({ initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    unitName: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-lg max-h-[90vh] relative animate-fade-in overflow-y-auto">
      {/* Header */}
      <div className="bg-blue-600 rounded-t-xl px-8 py-5 flex items-center gap-4">
        <div className="bg-blue-100 p-3 rounded-lg">
          <MapPin className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="text-white text-2xl font-bold flex-1">{initialData ? 'Edytuj region' : 'Dodaj nowy region'}</h2>
        <button onClick={onCancel} className="text-white hover:text-blue-200">
          <X className="h-6 w-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-b-xl">
        <div className="space-y-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Nazwa</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Opis</label>
            <input name="unitName" value={form.unitName} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Notes</label>
            <input name="notes" value={form.notes} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded focus:border-blue-500 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Zapisz</button>
          <button type="button" onClick={onCancel} className="ml-2 text-gray-600">Anuluj</button>
        </div>
      </form>
    </div>
  );
};

export default RegionForm; 