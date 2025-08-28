import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DamageModal = ({ isOpen, onClose, onSubmit, initialData, employeeName }) => {
  const [form, setForm] = useState({
    date: '',
    description: '',
    amount: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        description: initialData.description || '',
        amount: initialData.amount || ''
      });
    } else {
      setForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      amount: form.amount ? parseFloat(form.amount) : null
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative animate-fade-in">
        {/* Header */}
        <div className="bg-red-600 rounded-t-xl px-6 py-4 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-white text-xl font-bold flex-1">
            {initialData ? 'Edytuj szkodę' : 'Dodaj szkodę'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-red-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {employeeName && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Pracownik:</p>
              <p className="font-semibold text-gray-900">{employeeName}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Data szkody</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Opis szkody</label>
              <textarea
                name="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Opisz szczegóły szkody..."
                rows="4"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Koszt (zł)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 md:flex-none px-6 py-3 rounded bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {initialData ? 'Zapisz zmiany' : 'Dodaj szkodę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DamageModal; 