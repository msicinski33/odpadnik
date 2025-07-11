import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

const FractionForm = ({ initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    code: '',
    color: '#000000'
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-8 mb-0">
      <div className="flex items-center mb-8">
        <Palette className="w-6 h-6 mr-2 text-blue-700" />
        <h2 className="text-2xl font-bold text-blue-900">
          {initialData ? 'Edytuj frakcję' : 'Dodaj nową frakcję'}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-sm font-semibold mb-2">Nazwa</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
            placeholder="Wprowadź nazwę frakcji" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Kod</label>
          <input 
            name="code" 
            value={form.code} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
            placeholder="Wprowadź kod frakcji" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Kolor</label>
          <div className="flex items-center gap-4">
            <input 
              name="color" 
              type="color" 
              value={form.color} 
              onChange={handleChange} 
              className="w-16 h-12 p-1 border border-gray-300 rounded-lg cursor-pointer" 
            />
            <span className="text-sm text-gray-600">{form.color}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <button 
          type="submit" 
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
        >
          Zapisz
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-all duration-200"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
};

export default FractionForm; 