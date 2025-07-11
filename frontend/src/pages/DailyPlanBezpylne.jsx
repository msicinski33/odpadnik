import React, { useState, useEffect } from 'react';
import AssignmentModal from '../components/AssignmentModal';
import { Button } from '../components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import SimpleModal from '../components/SimpleModal';
import ReactMarkdown from 'react-markdown';
import authFetch from '../utils/authFetch';

const DailyPlanBezpylne = ({ date }) => {
  const [assignments, setAssignments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [emptyRows, setEmptyRows] = useState([]);
  const [activeRowId, setActiveRowId] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [availableFractions, setAvailableFractions] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [municipalityOptions, setMunicipalityOptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [fractions, setFractions] = useState([]);

  useEffect(() => {
    fetch('/api/municipalities')
      .then(res => res.json())
      .then(data => setMunicipalityOptions(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    fetch(`/api/dailyAssignments?date=${date}&type=bezpylne`)
      .then(res => res.json())
      .then(data => {
        setAssignments(Array.isArray(data) ? data : []);
      });
  }, [date, modalOpen]);

  useEffect(() => {
    fetch(`/api/calendar/today`)
      .then(res => res.json())
      .then(entries => {
        setCalendarEntries(entries);
        const regions = [];
        const regionMap = {};
        entries.forEach(e => {
          if (e.region && !regionMap[e.region.id]) {
            regionMap[e.region.id] = e.region;
            regions.push(e.region);
          }
        });
        setRegionOptions(regions);
      });
  }, [date]);

  useEffect(() => {
    authFetch('http://localhost:3000/api/regions')
      .then(res => res.json())
      .then(data => setRegions(Array.isArray(data) ? data : []));
    authFetch('http://localhost:3000/api/fractions')
      .then(res => res.json())
      .then(data => setFractions(Array.isArray(data) ? data : []));
  }, []);

  // Pobierz obecnych pracowników na dany dzień (z grafiku dziennego)
  useEffect(() => {
    fetch(`/api/employees/schedule/by-date?date=${date}`)
      .then(res => res.json())
      .then(data => setEmployees(Array.isArray(data) ? data : []));
  }, [date]);

  // Pobierz pojazdy operational, typ bezpylny lub dostawczy
  useEffect(() => {
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => setVehicles(Array.isArray(data) ? data.filter(v => v.faultStatus === 'operational' && (v.vehicleType?.toLowerCase().includes('bezpylny') || v.vehicleType?.toLowerCase().includes('dostawczy'))) : []));
  }, []);

  const getFractionsForRegion = regionId => {
    return calendarEntries
      .filter(e => e.region && e.region.id === regionId && e.fraction)
      .map(e => e.fraction)
      .filter((f, i, arr) => arr.findIndex(x => x.id === f.id) === i);
  };

  const handleAddEmptyRow = () => {
    const id = uuidv4();
    setEmptyRows(rows => [...rows, {
      id,
      kierowca: null,
      ladowacze: [],
      vehicle: null,
      region: null, // zamiast rejon
      gmina: '',
      frakcja: null,
      shift: '6-14',
    }]);
  };

  const handleOpenModalForCell = (rowId, field) => {
    setActiveRowId(rowId);
    setActiveField(field);
    if (field === 'frakcja') {
      const row = emptyRows.find(r => r.id === rowId);
      if (row && row.region && row.region.id && getFractionsForRegion) {
        setAvailableFractions(getFractionsForRegion(row.region.id));
      } else {
        setAvailableFractions([]);
      }
    }
    setModalOpen(true);
  };

  const handleCellSave = async (value) => {
    if (activeField === 'kierowca' && value && value.id) {
      try {
        const res = await fetch(`/api/employees/schedule/by-date?date=${date}`);
        const data = await res.json();
        const driver = data.find(e => String(e.id) === String(value.id));
        const shift = driver && driver.shift ? driver.shift : '6-14';
        setEmptyRows(rows => rows.map(row =>
          row.id === activeRowId ? { ...row, kierowca: value, shift } : row
        ));
      } catch (e) {
        setEmptyRows(rows => rows.map(row =>
          row.id === activeRowId ? { ...row, kierowca: value, shift: '6-14' } : row
        ));
      }
    } else if (activeField === 'frakcja') {
      let fractionObj = value;
      if (activeRowId) {
        const row = emptyRows.find(r => r.id === activeRowId);
        if (!row || !row.region || typeof row.region !== 'object' || !('id' in row.region) || !row.region.id || !getFractionsForRegion) {
          let fallbackFraction;
          if (typeof value === 'object' && value !== null) {
            fallbackFraction = { ...value, name: value.name || String(value.id || '') };
          } else {
            fallbackFraction = { id: value, name: String(value) };
          }
          setEmptyRows(rows => rows.map(row =>
            row.id === activeRowId ? { ...row, frakcja: fallbackFraction } : row
          ));
          setActiveRowId(null);
          setActiveField(null);
          setModalOpen(false);
          return;
        }
        try {
          const fractions = getFractionsForRegion(row.region.id);
          if (typeof value === 'object' && value.id) {
            fractionObj = fractions.find(f => f.id === value.id) || value;
          } else if (typeof value === 'string' || typeof value === 'number') {
            fractionObj = fractions.find(f => f.id === value) || { id: value, name: value };
          }
        } catch (e) {
          fractionObj = value;
        }
      }
      setEmptyRows(rows => rows.map(row =>
        row.id === activeRowId ? { ...row, frakcja: fractionObj } : row
      ));
    } else {
      setEmptyRows(rows => rows.map(row =>
        row.id === activeRowId ? { ...row, [activeField === 'rejon' ? 'region' : activeField]: value } : row
      ));
    }
    setActiveRowId(null);
    setActiveField(null);
    setModalOpen(false);
  };

  const handleSave = async (value, rowId) => {
    // Uzupełnij vehicle/frakcja jeśli to ID
    let vehicleObj = value.vehicle;
    if (vehicleObj && typeof vehicleObj === 'string') {
      vehicleObj = vehicles.find(v => String(v.id) === String(vehicleObj)) || vehicleObj;
    }
    let frakcjaObj = value.frakcja;
    if (frakcjaObj && typeof frakcjaObj === 'string') {
      frakcjaObj = fractions.find(f => String(f.id) === String(frakcjaObj)) || frakcjaObj;
    }
    if (editRowId) {
      const updatedAssignment = {
        ...assignments.find(a => a.id === editRowId),
        shift: value.shift,
        driver: value.kierowca || value.driver,
        assistants: value.ladowacze ? value.ladowacze.map(l => ({ employee: l })) : [],
        vehicle: vehicleObj || value.pojazd,
        region: value.region || value.rejon,
        municipality: value.gmina || value.municipality,
        ...(frakcjaObj && frakcjaObj.id ? { fractions: [{ fraction: frakcjaObj }] } : {}),
        type: 'bezpylne',
      };
      await fetch(`/api/dailyAssignments/${editRowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignment),
      });
      // Po zapisie odśwież assignments z backendu
      fetch(`/api/dailyAssignments?date=${date}&type=bezpylne`)
        .then(res => res.json())
        .then(data => setAssignments(Array.isArray(data) ? data : []));
      setEditRowId(null);
      setModalOpen(false);
      setEditingAssignment(null);
      return;
    }
    if (rowId) {
      const newAssignment = {
        id: uuidv4(),
        shift: value.shift,
        driver: value.kierowca || value.driver,
        assistants: value.ladowacze ? value.ladowacze.map(l => ({ employee: l })) : [],
        vehicle: vehicleObj || value.pojazd,
        region: value.region || value.rejon,
        municipalityId: value.gmina?.id || value.municipality?.id,
        ...(frakcjaObj && frakcjaObj.id ? { fractions: [{ fraction: frakcjaObj }] } : {}),
        date: new Date(date).toISOString(),
        type: 'bezpylne',
      };
      const res = await fetch('/api/dailyAssignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment),
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Błąd zapisu: ' + (err.error || 'Nieznany błąd'));
        return;
      }
      // Po zapisie odśwież assignments z backendu
      fetch(`/api/dailyAssignments?date=${date}&type=bezpylne`)
        .then(res => res.json())
        .then(data => setAssignments(Array.isArray(data) ? data : []));
      setEmptyRows(rows => rows.filter(r => r.id !== rowId));
      setActiveRowId(null);
      setModalOpen(false);
      return;
    }
    handleCellSave(value);
  };

  const handleDelete = (assignment) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten przydział?')) return;
    fetch(`/api/dailyAssignments/${assignment.id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setAssignments(assignments => assignments.filter(a => a.id !== assignment.id));
        }
      });
  };

  // Renderowanie tabeli assignments i emptyRows
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Bezpylne</h2>
        <Button onClick={handleAddEmptyRow}>Dodaj wiersz</Button>
      </div>
      <table className="min-w-full border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Lp.</th>
            <th className="border px-2 py-1">Zmiana</th>
            <th className="border px-2 py-1">Kierowca</th>
            <th className="border px-2 py-1">Pracownicy ręczni (ładowacze)</th>
            <th className="border px-2 py-1">Pojazd</th>
            <th className="border px-2 py-1">Rejon</th>
            <th className="border px-2 py-1">Frakcja</th>
            <th className="border px-2 py-1">Gmina/Miasto</th>
            <th className="border px-2 py-1">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a, idx) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1">{idx + 1}</td>
              <td className="border px-2 py-1">{a.shift || (a.driver?.shift) || '-'}</td>
              <td className="border px-2 py-1">{a.driver?.name || '-'}</td>
              <td className="border px-2 py-1">{a.assistants?.map(l => l.employee?.name).join(', ') || '-'}</td>
              <td className="border px-2 py-1">{a.vehicle?.name || a.vehicle?.registrationNumber || '-'}</td>
              <td className="border px-2 py-1">{a.region?.name || '-'}</td>
              <td className="border px-2 py-1">{a.fractions?.map(f => f.fraction?.name).join(', ') || '-'}</td>
              <td className="border px-2 py-1">{a.municipality?.name || '-'}</td>
              <td className="border px-2 py-1">
                <Button size="sm" variant="outline" onClick={() => {
                  setEditingAssignment(a);
                  setEditRowId(a.id);
                  setModalOpen(true);
                }}>Edytuj</Button>
                <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(a)}>Usuń</Button>
              </td>
            </tr>
          ))}
          {emptyRows.map((r, idx) => (
            <tr key={r.id} className="bg-yellow-50">
              <td className="border px-2 py-1">{assignments.length + idx + 1}</td>
              <td className="border px-2 py-1">{r.shift || '-'}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'kierowca')}>{r.kierowca?.name || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'ladowacze')}>{r.ladowacze?.map(l => l.name).join(', ') || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'pojazd')}>{r.vehicle?.name || r.vehicle?.registrationNumber || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'rejon')}>{r.region?.name || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'frakcja')}>{r.frakcja?.name || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'gmina')}>{r.gmina?.name || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1">
                <Button size="sm" onClick={() => handleSave(r, r.id)}>Zapisz</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modale */}
      <AssignmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAssignment(null); setEditRowId(null); }}
        onSave={handleSave}
        initial={editingAssignment}
        type="bezpylne"
        orderType="bezpylne"
        regionOptions={regions}
        availableFractions={fractions}
        municipalityOptions={municipalityOptions}
        activeField={activeField}
        rowId={activeRowId}
        emptyRows={emptyRows}
        onCellSave={handleCellSave}
        employees={employees}
        vehicles={vehicles}
      />
    </div>
  );
};

export default DailyPlanBezpylne; 