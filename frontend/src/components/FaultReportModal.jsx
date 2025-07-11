import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { Button } from './ui/button';

const FaultReportModal = ({ 
  isOpen, 
  onClose, 
  vehicle, 
  onSubmit, 
  isLoading = false 
}) => {
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(description);
    setDescription('');
  };

  const handleClose = () => {
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 relative animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">Zgłoś Usterkę</h2>
              <p className="text-red-100 text-sm">Pojazd: {vehicle?.brand} {vehicle?.registrationNumber}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-white hover:text-red-200 transition-colors"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">Potwierdzenie</span>
              </div>
              <p className="text-red-700 text-sm">
                Czy na pewno chcesz oznaczyć ten pojazd jako niesprawny? 
                Zostanie wysłane powiadomienie email do zespołu technicznego.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis problemu (opcjonalnie)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opisz szczegóły usterki, jeśli to możliwe..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={4}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Wysyłanie...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Zgłoś Usterkę</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaultReportModal; 