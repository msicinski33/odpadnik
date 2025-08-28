import React, { useState, useEffect } from 'react';
import { User, X, AlertTriangle } from 'lucide-react';
import DamageList from './DamageList';

const EmployeeDetailsModal = ({ isOpen, onClose, employee, onUpdateEmployee }) => {
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employee) {
      fetchDamages();
    }
  }, [isOpen, employee]);

  const fetchDamages = async () => {
    if (!employee) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/damages/employee/${employee.id}`);
      if (response.ok) {
        const data = await response.json();
        setDamages(data);
      }
    } catch (error) {
      console.error('Error fetching damages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDamage = async (damageData) => {
    try {
      const response = await fetch('/api/damages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...damageData,
          employeeId: employee.id
        }),
      });

      if (response.ok) {
        await fetchDamages();
      }
    } catch (error) {
      console.error('Error adding damage:', error);
    }
  };

  const handleEditDamage = async (damageId, damageData) => {
    try {
      const response = await fetch(`/api/damages/${damageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(damageData),
      });

      if (response.ok) {
        await fetchDamages();
      }
    } catch (error) {
      console.error('Error updating damage:', error);
    }
  };

  const handleDeleteDamage = async (damageId) => {
    try {
      const response = await fetch(`/api/damages/${damageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDamages();
      }
    } catch (error) {
      console.error('Error deleting damage:', error);
    }
  };

  if (!isOpen || !employee) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

      const totalDamageCost = damages.reduce((sum, damage) => sum + (damage.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-xl px-8 py-5 flex items-center gap-4 sticky top-0 z-10">
          <div className="bg-blue-100 p-3 rounded-lg">
            <User className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-white text-2xl font-bold flex-1">
            Szczegóły pracownika: {employee.name} {employee.surname}
          </h2>
          <button onClick={onClose} className="text-white hover:text-blue-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8">
          {/* Employee Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informacje podstawowe</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Imię i nazwisko:</span>
                  <p className="text-gray-900">{employee.name} {employee.surname}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Stanowisko:</span>
                  <p className="text-gray-900">{employee.position}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{employee.email || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Telefon:</span>
                  <p className="text-gray-900">{employee.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Data zatrudnienia:</span>
                  <p className="text-gray-900">{formatDate(employee.hiredAt)}</p>
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Szczegóły pracy</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Wymiar pracy:</span>
                  <p className="text-gray-900">{employee.workHours || 8} godzin</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Wymiar urlopu:</span>
                  <p className="text-gray-900">{employee.vacationDays || 26} dni</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Praca w godzinach nadliczbowych:</span>
                  <p className="text-gray-900">{employee.overtimeAllowed ? 'Tak' : 'Nie'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Praca w godzinach nocnych:</span>
                  <p className="text-gray-900">{employee.nightShiftAllowed ? 'Tak' : 'Nie'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Orzeczenie o niepełnosprawności:</span>
                  <p className="text-gray-900">{employee.hasDisabilityCertificate ? 'Tak' : 'Nie'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Qualifications */}
          {(employee.driversLicenseCategories || employee.specialQualifications) && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Kwalifikacje</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {employee.driversLicenseCategories && (
                  <div>
                    <span className="text-sm font-medium text-blue-600">Prawo jazdy:</span>
                    <p className="text-gray-900">{employee.driversLicenseCategories}</p>
                  </div>
                )}
                {employee.specialQualifications && (
                  <div>
                    <span className="text-sm font-medium text-green-600">Specjalne kwalifikacje:</span>
                    <p className="text-gray-900">{employee.specialQualifications}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Damage Summary */}
          <div className="bg-red-50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Podsumowanie szkód</h3>
                <p className="text-sm text-gray-600">Przegląd incydentów i szkód pracownika</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Łączna liczba szkód</div>
                <div className="text-2xl font-bold text-red-600">{damages.length}</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Łączny koszt</div>
                <div className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('pl-PL', {
                    style: 'currency',
                    currency: 'PLN'
                  }).format(totalDamageCost)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Ostatnia szkoda</div>
                <div className="text-lg font-bold text-red-600">
                  {damages.length > 0 ? formatDate(damages[0].date) : 'Brak'}
                </div>
              </div>
            </div>
          </div>

          {/* Damages Management */}
          <DamageList
            damages={damages}
            onAddDamage={handleAddDamage}
            onEditDamage={handleEditDamage}
            onDeleteDamage={handleDeleteDamage}
            employeeName={`${employee.name} ${employee.surname}`}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal; 