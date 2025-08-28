import React, { useState } from 'react';
import { AlertTriangle, Edit, Trash2, Plus, Calendar, DollarSign, User } from 'lucide-react';
import DamageModal from './DamageModal';

const DamageList = ({ damages, onAddDamage, onEditDamage, onDeleteDamage, employeeName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDamage, setEditingDamage] = useState(null);

  const handleAddDamage = () => {
    setEditingDamage(null);
    setIsModalOpen(true);
  };

  const handleEditDamage = (damage) => {
    setEditingDamage(damage);
    setIsModalOpen(true);
  };

  const handleDeleteDamage = async (damageId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę szkodę?')) {
      await onDeleteDamage(damageId);
    }
  };

  const handleSubmit = async (damageData) => {
    if (editingDamage) {
      await onEditDamage(editingDamage.id, damageData);
    } else {
      await onAddDamage(damageData);
    }
    setIsModalOpen(false);
    setEditingDamage(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const totalCost = damages.reduce((sum, damage) => sum + (damage.amount || 0), 0);
  const lastDamageDate = damages.length > 0 ? damages[0].date : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Szkody pracownika</h3>
            <p className="text-sm text-gray-600">Historia szkód i incydentów</p>
          </div>
        </div>
        <button
          onClick={handleAddDamage}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Dodaj szkodę
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-600">Łączna liczba szkód</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{damages.length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Łączny koszt</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Ostatnia szkoda</span>
          </div>
          <p className="text-lg font-bold text-blue-700">
            {lastDamageDate ? formatDate(lastDamageDate) : 'Brak'}
          </p>
        </div>
      </div>

      {/* Damages List */}
      {damages.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Brak zarejestrowanych szkód</p>
        </div>
      ) : (
        <div className="space-y-4">
          {damages.map((damage) => (
            <div
              key={damage.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">{formatDate(damage.date)}</span>
                    {damage.amount && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        {formatCurrency(damage.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 mb-2">{damage.description}</p>

                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditDamage(damage)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edytuj"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDamage(damage.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <DamageModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDamage(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingDamage}
          employeeName={employeeName}
        />
      )}
    </div>
  );
};

export default DamageList; 