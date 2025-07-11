import React, { useState, useEffect } from 'react';
import AssignmentModal from '../components/AssignmentModal';
import { Button } from '../components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import SimpleModal from '../components/SimpleModal';
import ReactMarkdown from 'react-markdown';

const EQUIPMENT_LIST = [
  { name: 'miotła' },
  { name: 'grabie' },
  { name: 'haczka' },
  { name: 'chwytak' },
  { name: 'dmuchawa' },
  { name: 'kosa' },
];

const DailyPlanSprzatanie = ({ date }) => {
  const [assignments, setAssignments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [emptyRows, setEmptyRows] = useState([]);
  const [activeRowId, setActiveRowId] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [municipalityOptions, setMunicipalityOptions] = useState([]);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [workTypeModalOpen, setWorkTypeModalOpen] = useState(false);
  const [equipmentSelection, setEquipmentSelection] = useState([]); // [{ name, quantity }]
  const [workTypeValue, setWorkTypeValue] = useState('');

  useEffect(() => {
    fetch('/api/municipalities')
      .then(res => res.json())
      .then(data => setMunicipalityOptions(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    fetch(`/api/dailyAssignments?date=${date}&type=sprzątanie`)
      .then(res => res.json())
      .then(data => {
        setAssignments(Array.isArray(data) ? data : []);
      });
  }, [date, modalOpen]);

  const handleAddEmptyRow = () => {
    const id = uuidv4();
    setEmptyRows(rows => [...rows, {
      id,
      kierowca: null,
      ladowacze: [],
      pojazd: null,
      gmina: '',
      equipment: [],
      workType: '',
      shift: '6-14',
    }]);
  };

  const handleOpenModalForCell = (rowId, field) => {
    setActiveRowId(rowId);
    setActiveField(field);
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
    } else {
      setEmptyRows(rows => rows.map(row =>
        row.id === activeRowId ? { ...row, [activeField]: value } : row
      ));
    }
    setActiveRowId(null);
    setActiveField(null);
    setModalOpen(false);
  };

  const handleSave = async (value, rowId) => {
    if (editRowId) {
      const updatedAssignment = {
        ...assignments.find(a => a.id === editRowId),
        shift: value.shift,
        driver: value.kierowca || value.driver,
        assistants: value.ladowacze ? value.ladowacze.map(l => ({ employee: l })) : [],
        vehicle: value.pojazd || value.vehicle,
        municipality: value.gmina || value.municipality,
        equipment: value.equipment || [],
        workType: value.workType || '',
        type: 'sprzątanie',
      };
      await fetch(`/api/dailyAssignments/${editRowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignment),
      });
      setAssignments(assignments => assignments.map(a => a.id === editRowId ? updatedAssignment : a));
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
        vehicle: value.pojazd || value.vehicle,
        municipalityId: value.gmina?.id || value.municipality?.id,
        equipment: value.equipment || [],
        workType: value.workType || '',
        date: new Date(date).toISOString(),
        type: 'sprzątanie',
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
      const saved = await res.json();
      setAssignments(assignments => [...assignments, saved]);
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

  // Modale do sprzętu i rodzaju prac
  function EquipmentModal({ open, onClose, onSave, initial }) {
    const [items, setItems] = useState(initial || EQUIPMENT_LIST.map(e => ({ ...e, quantity: 0 })));
    return (
      <SimpleModal open={open} onClose={onClose}>
        <div className="space-y-2">
          <h2 className="font-bold text-lg mb-2">Wybierz sprzęt</h2>
          {items.map((item, idx) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-32">{item.name}</span>
              <input type="number" min={0} value={item.quantity} onChange={e => {
                const val = Math.max(0, Number(e.target.value));
                setItems(items => items.map((it, i) => i === idx ? { ...it, quantity: val } : it));
              }} className="border rounded px-2 py-1 w-20" />
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={onClose} variant="outline">Anuluj</Button>
            <Button onClick={() => onSave(items.filter(i => i.quantity > 0))}>Zapisz</Button>
          </div>
        </div>
      </SimpleModal>
    );
  }
  function WorkTypeModal({ open, onClose, onSave, initial }) {
    const [value, setValue] = useState(initial || '');
    const handleBold = () => {
      const textarea = document.getElementById('worktype-textarea');
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) return;
      const before = value.slice(0, start);
      const selected = value.slice(start, end);
      const after = value.slice(end);
      setValue(before + '**' + selected + '**' + after);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, end + 2);
      }, 0);
    };
    return (
      <SimpleModal open={open} onClose={onClose}>
        <div className="space-y-2">
          <h2 className="font-bold text-lg mb-2">Rodzaj prac</h2>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={handleBold} className="font-bold border px-2 py-1 rounded">B</button>
          </div>
          <textarea id="worktype-textarea" className="border rounded px-2 py-1 w-full min-h-[100px]" value={value} onChange={e => setValue(e.target.value)} />
          <div className="mt-2 p-2 border rounded bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Podgląd:</div>
            <ReactMarkdown>{value}</ReactMarkdown>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={onClose} variant="outline">Anuluj</Button>
            <Button onClick={() => onSave(value)}>Zapisz</Button>
          </div>
        </div>
      </SimpleModal>
    );
  }

  // Renderowanie tabeli assignments i emptyRows
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Sprzątanie</h2>
        <Button onClick={handleAddEmptyRow}>Dodaj wiersz</Button>
      </div>
      <table className="min-w-full border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Kierowca</th>
            <th className="border px-2 py-1">Ładowacze</th>
            <th className="border px-2 py-1">Pojazd</th>
            <th className="border px-2 py-1">Gmina</th>
            <th className="border px-2 py-1">Sprzęt</th>
            <th className="border px-2 py-1">Rodzaj prac</th>
            <th className="border px-2 py-1">Zmiana</th>
            <th className="border px-2 py-1">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1">{a.driver?.name || '-'}</td>
              <td className="border px-2 py-1">{a.assistants?.map(l => l.employee?.name).join(', ') || '-'}</td>
              <td className="border px-2 py-1">{a.vehicle?.name || '-'}</td>
              <td className="border px-2 py-1">{a.municipality?.name || '-'}</td>
              <td className="border px-2 py-1">{a.equipment?.map(e => `${e.name} (${e.quantity})`).join(', ') || '-'}</td>
              <td className="border px-2 py-1"><ReactMarkdown>{a.workType || '-'}</ReactMarkdown></td>
              <td className="border px-2 py-1">{a.shift || '-'}</td>
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
          {emptyRows.map(r => (
            <tr key={r.id} className="bg-yellow-50">
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'kierowca')}>{r.kierowca?.name || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'ladowacze')}>{r.ladowacze?.map(l => l.name).join(', ') || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'pojazd')}>{r.pojazd?.name || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'gmina')}>{r.gmina?.name || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => setEquipmentModalOpen(true)}>{r.equipment?.map(e => `${e.name} (${e.quantity})`).join(', ') || <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => setWorkTypeModalOpen(true)}>{r.workType ? <ReactMarkdown>{r.workType}</ReactMarkdown> : <span className="text-gray-400">Wybierz</span>}</td>
              <td className="border px-2 py-1 cursor-pointer" onClick={() => handleOpenModalForCell(r.id, 'shift')}>{r.shift || <span className="text-gray-400">Wybierz</span>}</td>
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
        type="sprzątanie"
        municipalityOptions={municipalityOptions}
        activeField={activeField}
        rowId={activeRowId}
        emptyRows={emptyRows}
        onCellSave={handleCellSave}
      />
      <EquipmentModal
        open={equipmentModalOpen}
        onClose={() => setEquipmentModalOpen(false)}
        onSave={items => {
          if (activeRowId) {
            setEmptyRows(rows => rows.map(row => row.id === activeRowId ? { ...row, equipment: items } : row));
          }
          setEquipmentModalOpen(false);
        }}
        initial={emptyRows.find(r => r.id === activeRowId)?.equipment}
      />
      <WorkTypeModal
        open={workTypeModalOpen}
        onClose={() => setWorkTypeModalOpen(false)}
        onSave={val => {
          if (activeRowId) {
            setEmptyRows(rows => rows.map(row => row.id === activeRowId ? { ...row, workType: val } : row));
          }
          setWorkTypeModalOpen(false);
        }}
        initial={emptyRows.find(r => r.id === activeRowId)?.workType}
      />
    </div>
  );
};

export default DailyPlanSprzatanie; 