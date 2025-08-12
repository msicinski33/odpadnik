import React, { useState, useContext } from 'react';
import { Edit2, Trash2, Users, Eye } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import { UserContext } from '../UserContext';
import { hasPermission } from '../lib/utils';

const badgeClass = (position) =>
  position === 'Specjalista'
    ? 'bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-semibold'
    : 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold';

const EmployeeList = ({ employees, onEdit, onDelete }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { user } = useContext(UserContext);

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailsModalOpen(true);
  };

  return (
  <div className="w-full flex justify-center">
    <div className="w-full max-w-7xl px-6 flex flex-wrap gap-6 mt-6 justify-center">
      {employees.length === 0 && (
        <div className="text-gray-500 text-center w-full py-8">Brak pracowników</div>
      )}
      {employees.map(emp => (
        <Card className="w-[340px] border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex items-center gap-3 pb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-blue-900">{
                [emp.surname, emp.name].filter(Boolean).map(s => String(s).trim()).join(' ')
              }</span>
              <div className="mt-1 flex justify-center">
                <Badge className="bg-blue-50 text-blue-700">{emp.position}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700">
              Telefon: {emp.phone || '-'}<br />
              Email: {emp.email || '-'}<br />
              Data zatrudnienia: {emp.hiredAt ? new Date(emp.hiredAt).toLocaleDateString() : '-'}
            </div>
            {emp.hasDisabilityCertificate && (
              <div className="mt-2">
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Orzeczenie o niepełnosprawności</span>
              </div>
            )}
            {/* New fields for work hours and permissions */}
            <div className="mt-2 text-xs text-gray-700">
              Wymiar pracy: <b>{emp.workHours || 8}h</b><br />
              Wymiar urlopu: <b>{emp.vacationDays || 26} dni</b><br />
              Praca w godzinach nadliczbowych: <b>{emp.overtimeAllowed ? 'tak' : 'nie'}</b><br />
              Praca w godzinach nocnych: <b>{emp.nightShiftAllowed ? 'tak' : 'nie'}</b>
            </div>
            {/* Damage summary */}
            {emp.damages && emp.damages.length > 0 && (
              <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-1 mb-1">
                  <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-xs font-semibold text-red-700">Szkody: {emp.damages.length}</span>
                </div>
                <div className="text-xs text-red-600">
                  Ostatnia: {new Date(emp.damages[0].date).toLocaleDateString('pl-PL')}
                </div>
              </div>
            )}
            {/* Driver's license and qualifications */}
            {(emp.driversLicenseCategories || emp.specialQualifications) && (
              <div className="mt-2 text-xs text-gray-700">
                {emp.driversLicenseCategories && (
                  <div className="mb-1">
                    <span className="font-semibold text-blue-700">Prawo jazdy:</span> {emp.driversLicenseCategories}
                  </div>
                )}
                {emp.specialQualifications && (
                  <div>
                    <span className="font-semibold text-green-700">Kwalifikacje:</span> {emp.specialQualifications}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-1 mt-3">
              <Button variant="outline" size="sm" className="flex-1 border-green-300 text-green-700 hover:bg-green-50 text-xs px-2 py-1" onClick={() => handleViewDetails(emp)}>
                <Eye className="h-3 w-3 mr-1" /> Szczegóły
              </Button>
              {hasPermission(user, 'employees:update') && (
                <Button variant="outline" size="sm" className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 text-xs px-2 py-1" onClick={() => onEdit(emp)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edytuj
                </Button>
              )}
              {hasPermission(user, 'employees:delete') && (
                <Button variant="outline" size="sm" className="flex-1 border-red-300 text-red-700 hover:bg-red-50 text-xs px-2 py-1" onClick={() => onDelete(emp.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Usuń
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    {/* Employee Details Modal */}
    <EmployeeDetailsModal
      isOpen={isDetailsModalOpen}
      onClose={() => {
        setIsDetailsModalOpen(false);
        setSelectedEmployee(null);
      }}
      employee={selectedEmployee}
    />
  </div>
  );
};

export default EmployeeList; 