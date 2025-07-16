import React, { useState } from 'react';
import EmployeeList from '../components/EmployeeList';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeImportModal from '../components/EmployeeImportModal';
import authFetch from '../utils/authFetch';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import DataPageHeader from '../components/ui/DataPageHeader';
import { Button } from '../components/ui/button';

const API_URL = 'http://localhost:3000/api/employees';

const fetchEmployees = async () => {
  const res = await authFetch(API_URL);
  if (!res.ok) throw new Error('Błąd pobierania pracowników');
  return res.json();
};

// Helper to parse Excel date formats
function parseExcelDate(val) {
  if (!val) return undefined;
  // Try ISO first
  if (!isNaN(Date.parse(val))) return new Date(val).toISOString();
  // Try DD.MM.YYYY
  const match = val.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/);
  if (match) {
    const [_, d, m, y] = match;
    return new Date(`${y}-${m}-${d}T00:00:00.000Z`).toISOString();
  }
  return undefined;
}

const Employees = () => {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { data: employees = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  // Filtering logic (like Vehicles)
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const sA = (a.surname || '').localeCompare(b.surname || '', 'pl');
    if (sA !== 0) return sA;
    return (a.name || '').localeCompare(b.name || '', 'pl');
  });

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (emp) => {
    setEditing(emp);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    refetch();
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await authFetch(`${API_URL}/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } else {
      await authFetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
    setShowForm(false);
    refetch();
  };

  const handleImport = async (data) => {
    if (data && data.length > 0) {
      console.log('IMPORT HEADERS:', Object.keys(data[0]));
    }
    const get = (row, ...keys) => keys.find(k => row[k]) ? row[keys.find(k => row[k])] : '';

    const invalidRows = data.filter(employee =>
      !get(employee, 'Imię / Name', 'Name') ||
      !get(employee, 'Nazwisko / Surname', 'Surname') ||
      !get(employee, 'Stanowisko', 'Position', 'Stanowisko / Position')
    );
    if (invalidRows.length > 0) {
      alert('Niektóre wiersze nie mają wymaganych pól: Imię/Name, Nazwisko/Surname, Stanowisko/Position. Popraw plik i spróbuj ponownie.');
      return;
    }

    let errors = [];
    await Promise.all(data.map(async (employee, idx) => {
      // Parse new fields with fallback/defaults
      let workHoursRaw = get(employee, 'Wymiar pracy', 'workHours', 'WorkHours');
      let workHours = workHoursRaw ? Number(workHoursRaw) : 8;
      if (![7,8].includes(workHours)) workHours = 8;
      let overtimeAllowedRaw = get(employee, 'Praca w godzinach nadliczbowych', 'overtimeAllowed', 'OvertimeAllowed');
      let nightShiftAllowedRaw = get(employee, 'Praca w godzinach nocnych', 'nightShiftAllowed', 'NightShiftAllowed');
      // Accept 'TAK', 'tak', 'yes', '1', true as true
      const parseBool = v => {
        if (!v) return false;
        // Replace all whitespace (including non-breaking) with normal spaces, then trim and lowercase
        const normalized = v.toString().replace(/\s|\u00A0/g, ' ').trim().toLowerCase();
        return ['tak','yes','1','true'].includes(normalized);
      };
      let overtimeAllowed = parseBool(overtimeAllowedRaw);
      let nightShiftAllowed = parseBool(nightShiftAllowedRaw);
      const res = await authFetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          name: get(employee, 'Imię / Name', 'Name'),
          surname: get(employee, 'Nazwisko / Surname', 'Surname'),
          position: get(employee, 'Stanowisko', 'Position', 'Stanowisko / Position'),
          phone: get(employee, 'Telefon', 'Phone', 'Telefon / Phone')?.toString() || '',
          email: get(employee, 'Email', 'E-mail'),
          hiredAt: parseExcelDate(get(employee, 'Data zatrudnienia', 'HiredAt', 'hiredAt')),
          hasDisabilityCertificate: get(employee, 'Orzeczenie o niepełnosprawności', 'Disability', 'hasDisabilityCertificate') === 'TAK' || false,
          workHours,
          overtimeAllowed,
          nightShiftAllowed
        }),
      });
      if (!res.ok) {
        let errMsg = '';
        try {
          const err = await res.json();
          errMsg = err.error || 'Błąd zapisu';
        } catch {
          errMsg = 'Błąd zapisu';
        }
        errors.push(`Wiersz ${idx + 1}: ${errMsg}`);
      }
    }));

    if (errors.length > 0) {
      alert('Błędy importu:\n' + errors.join('\n'));
    }
    refetch();
  };

  const employeeTemplateColumns = ['Imię / Name', 'Nazwisko / Surname', 'Stanowisko / Position', 'Telefon / Phone', 'Email'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white bg-opacity-20 rounded-2xl">
                <Users className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 tracking-tight">Zarządzanie Pracownikami</h1>
                <p className="text-blue-100 text-lg">Zarządzaj i monitoruj swój personel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Controls Section - replaced with DataPageHeader */}
        <DataPageHeader
          title="Operacje Pracowników"
          searchValue={searchTerm}
          onSearchChange={e => setSearchTerm(e.target.value)}
          searchPlaceholder="Szukaj pracowników po imieniu, nazwisku lub stanowisku..."
          showSearch={true}
          showFilter={true}
          onFilterClick={() => {}}
          filterLabel="Filtry"
          ImportButtonComponent={
            <Button
              variant="outline"
              className="border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center"
              onClick={() => setImportModalOpen(true)}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
              Importuj Dane
            </Button>
          }
          onAddClick={handleAdd}
          addLabel="Dodaj Pracownika"
        />
        <EmployeeImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImport} />

        {/* Employee List as cards */}
        <EmployeeList employees={filteredEmployees} onEdit={handleEdit} onDelete={handleDelete} />

        {/* Form Modal */}
        {showForm && (
          <EmployeeForm
            initialData={editing}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}
        {isLoading && <div className="text-gray-500">Ładowanie...</div>}
        {isError && <div className="text-red-500">Błąd pobierania pracowników</div>}
        {!isLoading && !isError && employees.length === 0 && <div className="text-gray-500">Brak pracowników</div>}
      </div>
    </div>
  );
};

export default Employees; 