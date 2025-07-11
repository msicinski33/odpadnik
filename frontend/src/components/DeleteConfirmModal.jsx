import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isLoading = false, order }) => {
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
              <h2 className="text-white text-xl font-bold">Usuń zlecenie</h2>
              {order && (
                <p className="text-red-100 text-sm">
                  {order.company ? `Klient: ${order.company}` : ''} {order.type ? `(${order.type})` : ''}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">Potwierdzenie</span>
            </div>
            <p className="text-red-700 text-sm">
              Czy na pewno chcesz usunąć to zlecenie? Tej operacji nie można cofnąć.
            </p>
          </div>
          {order && (
            <div className="mb-6 text-sm text-gray-700">
              <div className="mb-1"><b>ID:</b> {order.id ?? '-'}</div>
              <div className="mb-1"><b>Adres:</b> {order.address ?? '-'}</div>
              <div className="mb-1"><b>Rodzaj:</b> {order.rodzaj ?? '-'}</div>
              <div className="mb-1"><b>Data zgłoszenia:</b> {order.dateReceived ? new Date(order.dateReceived).toLocaleDateString() : '-'}</div>
              <div className="mb-1"><b>Przyjął:</b> {order.receivedBy ?? '-'}</div>
              <div className="mb-1"><b>Odpowiedzialny:</b> {order.responsible ?? '-'}</div>
              <div className="mb-1"><b>Pojazd:</b> {order.vehicle ?? '-'}</div>
              <div className="mb-1"><b>Uwagi:</b> {order.notes ?? '-'}</div>
            </div>
          )}
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Anuluj
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Usuń</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal; 