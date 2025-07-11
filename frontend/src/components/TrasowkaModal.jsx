import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const TrasowkaModal = ({ 
  fractions, 
  loadingFractions, 
  onClose, 
  onSave, 
  currentAssignments 
}) => {
  const [assignments, setAssignments] = useState(currentAssignments || []);

  useEffect(() => {
    setAssignments(currentAssignments || []);
  }, [currentAssignments]);

  const handleAddFraction = () => {
    setAssignments(prev => ([
      ...prev,
      { id: Date.now(), fractionId: '', date: '', color: '' }
    ]));
  };

  const handleRemoveFraction = (id) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleFractionChange = (id, field, value) => {
    setAssignments(prev => prev.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleSave = () => {
    // Only save valid assignments
    const formattedAssignments = assignments.filter(a => a.fractionId && a.date);
    onSave(formattedAssignments);
  };

  const isValid = assignments.every(a => a.fractionId && a.date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Przypisz frakcje i daty
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loadingFractions ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Ładowanie frakcji...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((data, idx) => (
                <div key={data.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  {/* Fraction Selection */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frakcja
                    </label>
                    <select
                      value={data.fractionId}
                      onChange={(e) => {
                        const fraction = fractions.find(f => f.id === parseInt(e.target.value));
                        handleFractionChange(data.id, 'fractionId', e.target.value);
                        handleFractionChange(data.id, 'color', fraction?.color || '');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Wybierz frakcję</option>
                      {fractions.map((fraction) => (
                        <option key={fraction.id} value={fraction.id}>
                          {fraction.name} ({fraction.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data (format: DD-MM)
                    </label>
                    <input
                      type="text"
                      value={data.date}
                      onChange={(e) => handleFractionChange(data.id, 'date', e.target.value)}
                      placeholder="np. 05-03"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Color Preview */}
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kolor
                    </label>
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: data.color || '#f3f4f6' }}
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFraction(data.id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}

              {/* Add New Fraction Button */}
              <button
                onClick={handleAddFraction}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Dodaj frakcję
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || assignments.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrasowkaModal; 