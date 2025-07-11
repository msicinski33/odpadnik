import React, { useState, useEffect } from 'react';
import AssignmentModal from '../components/AssignmentModal';
import { Button } from '../components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import RegionFractionModal from '../components/RegionFractionModal';
import SimpleModal from '../components/SimpleModal'; // Added import for SimpleModal
import ReactMarkdown from 'react-markdown';
import DailyPlanBezpylne from './DailyPlanBezpylne';
import DailyPlanSprzatanie from './DailyPlanSprzatanie';

const PLAN_TYPES = [
  { key: 'bezpylne', label: 'Bezpylne' },
  { key: 'sprzątanie', label: 'Sprzątanie' },
];

const EQUIPMENT_LIST = [
  { name: 'miotła' },
  { name: 'grabie' },
  { name: 'haczka' },
  { name: 'chwytak' },
  { name: 'dmuchawa' },
  { name: 'kosa' },
];

const DailyPlan = () => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('bezpylne');
  const [assignments, setAssignments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [fractionOptions, setFractionOptions] = useState([]);
  const [emptyRows, setEmptyRows] = useState([]);
  const [activeRowId, setActiveRowId] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [availableFractions, setAvailableFractions] = useState([]);
  const [regionFractionModalOpen, setRegionFractionModalOpen] = useState(false);
  const [regionFractionRowId, setRegionFractionRowId] = useState(null);
  const [regionFractionInitial, setRegionFractionInitial] = useState({ rejon: null, frakcja: null });
  const [editRowId, setEditRowId] = useState(null);
  const [municipalityOptions, setMunicipalityOptions] = useState([]);

  // 1. Add modal state and handlers for equipment and workType
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [workTypeModalOpen, setWorkTypeModalOpen] = useState(false);
  const [equipmentSelection, setEquipmentSelection] = useState([]); // [{ name, quantity }]
  const [workTypeValue, setWorkTypeValue] = useState('');
  const [activeSprzatanieRowId, setActiveSprzatanieRowId] = useState(null);

  // Fetch municipalities
  useEffect(() => {
    fetch('/api/municipalities')
      .then(res => res.json())
      .then(data => setMunicipalityOptions(Array.isArray(data) ? data : []));
  }, []);

  // Fetch assignments for selected date and type
  useEffect(() => {
    fetch(`/api/dailyAssignments?date=${date}&type=${type}`)
      .then(res => res.json())
      .then(data => {
        setAssignments(Array.isArray(data) ? data : []);
      });
  }, [date, type, modalOpen]);

  // Fetch waste calendar for the selected date (for bezpylne)
  useEffect(() => {
    if (type !== 'bezpylne') return;
    fetch(`/api/calendar/today`)
      .then(res => res.json())
      .then(entries => {
        setCalendarEntries(entries);
        // Unique regions
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
  }, [date, type]);

  // Get fractions for selected region
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
      pojazd: null,
      rejon: null,
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
      if (row && row.rejon && row.rejon.id && getFractionsForRegion) {
        setAvailableFractions(getFractionsForRegion(row.rejon.id));
      } else {
        setAvailableFractions([]);
      }
    }
    setModalOpen(true);
  };

  const handleOpenRegionFractionModal = (rowId) => {
    const row = emptyRows.find(r => r.id === rowId);
    setRegionFractionRowId(rowId);
    setRegionFractionInitial({ rejon: row?.rejon || null, frakcja: row?.frakcja || null });
    setRegionFractionModalOpen(true);
  };

  const handleRegionFractionSave = ({ rejon, frakcja }) => {
    setEmptyRows(rows => rows.map(row =>
      row.id === regionFractionRowId ? { ...row, rejon, frakcja } : row
    ));
    setRegionFractionModalOpen(false);
    setRegionFractionRowId(null);
    setRegionFractionInitial({ rejon: null, frakcja: null });
  };

  const handleCellSave = async (value) => {
    if (activeField === 'kierowca' && value && value.id) {
      // Fetch the schedule for the selected date
      try {
        const res = await fetch(`/api/employees/schedule/by-date?date=${date}`);
        const data = await res.json();
        // Find the selected driver's shift
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
      // Always store the full fraction object
      let fractionObj = value;
      if (activeRowId) {
        const row = emptyRows.find(r => r.id === activeRowId);
        // Robust null check: if no region, save as-is and exit
        if (!row || !row.rejon || typeof row.rejon !== 'object' || !('id' in row.rejon) || !row.rejon.id || !getFractionsForRegion) {
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
          const fractions = getFractionsForRegion(row.rejon.id);
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
        row.id === activeRowId ? { ...row, [activeField]: value } : row
      ));
    }
    setActiveRowId(null);
    setActiveField(null);
    setModalOpen(false);
  };

  const handleSave = async (value, rowId) => {
    console.log('handleSave called', value); // DEBUG LOG
    if (editRowId) {
      // Edit existing assignment
      const assignmentType = value.type || type;
      const updatedAssignment = {
        ...assignments.find(a => a.id === editRowId),
        shift: value.shift,
        driver: value.kierowca || value.driver,
        assistants: value.ladowacze ? value.ladowacze.map(l => ({ employee: l })) : [],
        vehicle: value.pojazd || value.vehicle,
        region: value.rejon || value.region,
        municipality: value.gmina || value.municipality,
        ...(assignmentType === 'bezpylne' && value.frakcja ? { fractions: [{ fraction: value.frakcja }] } : {}),
        type: assignmentType,
      };
      // Remove fractions for non-bezpylne types (PUT)
      if (assignmentType !== 'bezpylne' && updatedAssignment.fractions) {
        delete updatedAssignment.fractions;
      }
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
      // Add new assignment
      const assignmentType = value.type || type;
      const newAssignment = {
        id: uuidv4(),
        shift: value.shift,
        driver: value.kierowca || value.driver,
        assistants: value.ladowacze ? value.ladowacze.map(l => ({ employee: l })) : [],
        vehicle: value.pojazd || value.vehicle,
        region: value.rejon || value.region,
        municipalityId: value.gmina?.id || value.municipality?.id,
        ...(assignmentType === 'bezpylne' && value.frakcja ? { fractions: [{ fraction: value.frakcja }] } : {}),
        date: new Date(date).toISOString(),
        type: assignmentType,
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
    // fallback for cell edit
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

  // Modal fields for bezpylne
  const bezpylneFields = {
    regionOptions,
    getFractionsForRegion,
  };

  console.log('Editing assignment:', editingAssignment);
  console.log('Modal initial:', editingAssignment ? {
    responsible: editingAssignment.driver?.id || editingAssignment.driverId,
    vehicle: editingAssignment.vehicle?.id || editingAssignment.vehicleId,
    assistants: editingAssignment.assistants?.map(a => a.employee?.id || a.employeeId) || [],
    regionId: editingAssignment.region?.id || editingAssignment.regionId,
    regionName: editingAssignment.region?.name || editingAssignment.regionName,
    municipality: editingAssignment.municipality,
    fractionIds: editingAssignment.fractions?.map(f => f.fraction?.id || f.fractionId) || [],
    fractionName: editingAssignment.fractionName,
    shift: editingAssignment.shift,
  } : null);

  const validAssignments = assignments.filter(a => a && a.id);

  // 2. Add modal components for equipment and workType
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
    // Handler to bold selected text
    const handleBold = () => {
      const textarea = document.getElementById('worktype-textarea');
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) return; // nothing selected
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dzienny Plan Pracy</h1>
      <div className="flex gap-4 mb-4 items-center">
        <label>Data:
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="ml-2 border rounded px-2 py-1" />
        </label>
        <div className="flex gap-2">
          {PLAN_TYPES.map(tab => (
            <Button key={tab.key} variant={type === tab.key ? 'default' : 'outline'} onClick={() => setType(tab.key)}>
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      {type === 'bezpylne' && <DailyPlanBezpylne date={date} />}
      {type === 'sprzątanie' && <DailyPlanSprzatanie date={date} />}
    </div>
  );
};

export default DailyPlan; 