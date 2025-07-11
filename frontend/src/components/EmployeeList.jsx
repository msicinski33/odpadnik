import React from 'react';
import { Edit2, Trash2, Users } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const badgeClass = (position) =>
  position === 'Specjalista'
    ? 'bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-semibold'
    : 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold';

const EmployeeList = ({ employees, onEdit, onDelete }) => (
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
              <Badge className="bg-blue-50 text-blue-700 ml-2">{emp.position}</Badge>
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
            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => onEdit(emp)}>
                <Edit2 className="h-4 w-4 mr-1" /> Edytuj
              </Button>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => onDelete(emp.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Usuń
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default EmployeeList; 