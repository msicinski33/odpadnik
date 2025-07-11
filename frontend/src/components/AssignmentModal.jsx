import React, { useState, useEffect } from 'react';
import SimpleModal from './SimpleModal';
import { Button } from './ui/button';
import socket from '../lib/socket';

const AssignmentModal = ({ open, onClose, onSave, initial, orderType, date, type, regionOptions = [], getFractionsForRegion, activeField, availableFractions, municipalityOptions, employees: employeesProp, vehicles: vehiclesProp }) => {
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [responsible, setResponsible] = useState(initial?.responsible || '');
  const [vehicle, setVehicle] = useState(initial?.vehicle || '');
  const [assistants, setAssistants] = useState(initial?.assistants || []);
  const [regionId, setRegionId] = useState(initial?.regionId || '');
  const [regionName, setRegionName] = useState(initial?.regionName || '');
  const [municipality, setMunicipality] = useState(initial?.municipality || '');
  const [fractionIds, setFractionIds] = useState(initial?.fractionIds || []);
  const [fractionName, setFractionName] = useState(initial?.fractionName || '');
  const [shift, setShift] = useState(initial?.shift || '6-14');
  const [locks, setLocks] = useState({ employees: [], vehicles: [] });
  const [customRegion, setCustomRegion] = useState(false);
  const [customFraction, setCustomFraction] = useState(false);

  // Vehicle type mapping
  const vehicleTypeMap = {
    surowce: ['WYWROTKA'],
    worki: ['WYWROTKA', 'CIĄGNIK'],
    uslugi: ['HAKOWY', 'BRAMOWY', 'DOSTAWCZY'],
    bramy: ['BRAMOWY'],
    bezpylne: ['BEZPYLNY', 'DOSTAWCZY'], // tylko te dwa typy
  };
  const allowedTypes = vehicleTypeMap[orderType] || [];

  // Jeśli przekazano employees/vehicles jako props, użyj ich zamiast fetchowania
  useEffect(() => {
    if (Array.isArray(employeesProp) && employeesProp.length > 0) {
      setEmployees(employeesProp);
    } else if (date) {
      fetch(`/api/employees/schedule/by-date?date=${date}`)
        .then(res => res.json())
        .then(data => setEmployees(Array.isArray(data) ? data : []));
    }
    if (Array.isArray(vehiclesProp) && vehiclesProp.length > 0) {
      setVehicles(vehiclesProp);
    } else {
      fetch('/api/vehicles')
        .then(res => res.json())
        .then(data => setVehicles(Array.isArray(data) ? data : []));
    }
    fetch(`/api/dailyAssignments/locks?date=${date}`)
      .then(res => res.json())
      .then(data => setLocks({
        employees: Array.from(data.employees || []),
        vehicles: Array.from(data.vehicles || [])
      }));
  }, [date, open, employeesProp, vehiclesProp]);

  // Listen for socket events
  useEffect(() => {
    function onResourceReserved({ date: d, resourceType, id }) {
      if (d === date) {
        setLocks(prev => ({
          ...prev,
          [resourceType]: [...new Set([...(prev[resourceType] || []), id])]
        }));
      }
    }
    function onResourceReleased({ date: d, resourceType, id }) {
      if (d === date) {
        setLocks(prev => ({
          ...prev,
          [resourceType]: (prev[resourceType] || []).filter(x => x !== id)
        }));
      }
    }
    socket.on('resourceReserved', onResourceReserved);
    socket.on('resourceReleased', onResourceReleased);
    return () => {
      socket.off('resourceReserved', onResourceReserved);
      socket.off('resourceReleased', onResourceReleased);
    };
  }, [date]);

  // Reserve resources on open, release on close
  useEffect(() => {
    if (open && responsible && date && type) {
      fetch('/api/dailyAssignments/reserve-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type, resourceType: 'employees', id: responsible })
      });
    }
    if (open && vehicle && date && type) {
      fetch('/api/dailyAssignments/reserve-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type, resourceType: 'vehicles', id: vehicle })
      });
    }
    return () => {
      if (responsible && date && type) {
        fetch('/api/dailyAssignments/release-resource', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, type, resourceType: 'employees', id: responsible })
        });
      }
      if (vehicle && date && type) {
        fetch('/api/dailyAssignments/release-resource', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, type, resourceType: 'vehicles', id: vehicle })
        });
      }
    };
  }, [open, responsible, vehicle, date, type]);

  useEffect(() => {
    setResponsible(initial?.responsible || '');
    setVehicle(initial?.vehicle || '');
    setAssistants(initial?.assistants || []);
    setRegionId(initial?.regionId || '');
    setRegionName(initial?.regionName || '');
    setMunicipality(initial?.municipality || '');
    setFractionIds(initial?.fractionIds || []);
    setFractionName(initial?.fractionName || '');
    setShift(initial?.shift || '6-14');
    setCustomRegion(false);
    setCustomFraction(false);
  }, [initial, open]);

  // Update shift automatically when driver changes (for bezpylne)
  useEffect(() => {
    if (orderType === 'bezpylne' && responsible && employees.length > 0) {
      const driver = employees.find(e => String(e.id) === String(responsible) && String(e.position).toUpperCase() === 'KIEROWCA');
      if (driver && driver.shift) {
        setShift(driver.shift);
      }
    }
    // Optionally, reset shift if no driver selected
    if (orderType === 'bezpylne' && !responsible) {
      setShift('6-14');
    }
  }, [responsible, orderType, employees]);

  // Filter vehicles: for daily plan show all operational, for work orders filter by type
  const filteredVehicles = orderType === 'bezpylne' || orderType === 'sprzątanie'
    ? vehicles.filter(v => v.faultStatus === 'operational')
    : vehicles.filter(v =>
        v.faultStatus === 'operational' &&
        allowedTypes.some(type => type.toLowerCase() === String(v.vehicleType).toLowerCase())
      );

  // Filter employees to only KIEROWCA and DYSPOZYTOR (case-insensitive)
  const filteredEmployees = employees.filter(emp =>
    ['KIEROWCA', 'DYSPOZYTOR'].includes(String(emp.position).toUpperCase())
  );

  // Sort filteredEmployees by surname
  const sortedFilteredEmployees = [...filteredEmployees].sort((a, b) => {
    const sA = (a.surname || '').localeCompare(b.surname || '', 'pl');
    if (sA !== 0) return sA;
    return (a.name || '').localeCompare(b.name || '', 'pl');
  });

  // Disable if locked
  const isEmployeeLocked = id => (locks.employees || []).includes(id);
  const isVehicleLocked = id => (locks.vehicles || []).includes(id);

  // Multi-select for assistants (ładowacze)
  const filteredLoaders = employees.filter(emp => String(emp.position).toUpperCase() === 'ŁADOWACZ');
  const isLoaderLocked = id => (locks.employees || []).includes(id);

  // Region/fraction logic for bezpylne
  const regionDropdown = (
    <div>
      <label>Rejon *</label>
      <select
        value={customRegion ? 'custom' : regionId}
        onChange={e => {
          if (e.target.value === 'custom') {
            setCustomRegion(true);
            setRegionId('');
          } else {
            setCustomRegion(false);
            setRegionId(e.target.value);
          }
        }}
        className="border rounded px-2 py-1 w-full"
      >
        <option value="">Wybierz...</option>
        {regionOptions.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
        <option value="custom">Własny rejon...</option>
      </select>
      {customRegion && (
        <input
          className="border rounded px-2 py-1 w-full mt-1"
          placeholder="Wpisz własny rejon"
          value={regionName}
          onChange={e => setRegionName(e.target.value)}
        />
      )}
    </div>
  );

  const fractionDropdown = (
    <div>
      <label>Frakcja *</label>
      <select
        value={customFraction ? 'custom' : (fractionIds[0] || '')}
        onChange={e => {
          if (e.target.value === 'custom') {
            setCustomFraction(true);
            setFractionIds([]);
          } else {
            setCustomFraction(false);
            setFractionIds([e.target.value]);
          }
        }}
        className="border rounded px-2 py-1 w-full"
        disabled={customRegion && !regionName}
      >
        <option value="">Wybierz...</option>
        {(availableFractions || (regionId && getFractionsForRegion && getFractionsForRegion(Number(regionId))) || []).map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
        <option value="custom">Własna frakcja...</option>
      </select>
      {customFraction && (
        <input
          className="border rounded px-2 py-1 w-full mt-1"
          placeholder="Wpisz własną frakcję"
          value={fractionName}
          onChange={e => setFractionName(e.target.value)}
        />
      )}
    </div>
  );

  // Only show the relevant field for cell-by-cell editing
  const renderField = () => {
    switch (activeField) {
      case 'kierowca':
        return (
          <div>
            <label>Kierowca *</label>
            <select value={responsible} onChange={e => setResponsible(e.target.value)} required className="border rounded px-2 py-1 w-full">
              <option value="">Wybierz...</option>
              {sortedFilteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id} disabled={isEmployeeLocked(emp.id)}>
                  {emp.surname} {isEmployeeLocked(emp.id) ? '(Zajęty)' : ''}
                </option>
              ))}
            </select>
          </div>
        );
      case 'ladowacze':
        return (
          <div>
            <label>Ładowacze</label>
            <select multiple value={assistants} onChange={e => setAssistants(Array.from(e.target.selectedOptions, o => o.value))} className="border rounded px-2 py-1 w-full">
              {filteredLoaders.map(emp => (
                <option key={emp.id} value={emp.id} disabled={isLoaderLocked(emp.id)}>
                  {emp.surname} {isLoaderLocked(emp.id) ? '(Zajęty)' : ''}
                </option>
              ))}
            </select>
          </div>
        );
      case 'pojazd':
        return (
          <div>
            <label>Pojazd *</label>
            <select value={vehicle} onChange={e => setVehicle(e.target.value)} required className="border rounded px-2 py-1 w-full">
              <option value="">Wybierz...</option>
              {filteredVehicles.map(veh => (
                <option key={veh.id} value={veh.id} disabled={isVehicleLocked(veh.id)}>
                  {veh.registrationNumber}
                  {veh.brand ? ` (${veh.brand})` : ''}
                  {veh.vehicleType ? ` (${veh.vehicleType})` : ''}
                  {isVehicleLocked(veh.id) ? ' (Zajęty)' : ''}
                </option>
              ))}
            </select>
          </div>
        );
      case 'rejon':
        return regionDropdown;
      case 'gmina':
        return (
          <div>
            <label>Gmina/Miasto *</label>
            <select className="border rounded px-2 py-1 w-full" value={municipality?.id || ''} onChange={e => {
              const selected = municipalityOptions.find(m => String(m.id) === e.target.value);
              setMunicipality(selected);
            }}>
              <option value="">Wybierz...</option>
              {municipalityOptions.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        );
      case 'frakcja':
        return fractionDropdown;
      case 'shift':
        return (
          <div>
            <label>Godziny *</label>
            <select value={shift} onChange={e => setShift(e.target.value)} className="border rounded px-2 py-1 w-full">
              <option value="6-14">6-14</option>
              <option value="14-22">14-22</option>
              <option value="22-6">22-6</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  const handleCellSave = () => {
    let value;
    switch (activeField) {
      case 'kierowca':
        value = filteredEmployees.find(e => String(e.id) === String(responsible)) || null;
        break;
      case 'ladowacze':
        value = assistants.map(id => filteredLoaders.find(e => String(e.id) === String(id))).filter(Boolean);
        break;
      case 'pojazd':
        value = filteredVehicles.find(v => String(v.id) === String(vehicle)) || null;
        break;
      case 'rejon':
        value = customRegion ? { name: regionName } : regionOptions.find(r => String(r.id) === String(regionId)) || null;
        break;
      case 'gmina':
        value = municipality;
        break;
      case 'frakcja':
        value = customFraction ? { name: fractionName } : (regionId && getFractionsForRegion ? getFractionsForRegion(Number(regionId)).find(f => String(f.id) === String(fractionIds[0])) : null);
        break;
      case 'shift':
        value = shift;
        break;
      default:
        value = null;
    }
    onSave(value);
  };

  console.log('Allowed vehicle types:', allowedTypes);
  console.log('Filtered vehicles:', filteredVehicles);
  console.log('Filtered employees:', filteredEmployees);

  return (
    <SimpleModal open={open} onClose={onClose}>
      <div className="space-y-2">
        <h2 className="font-bold text-lg mb-2">Dodaj {activeField && activeField.charAt(0).toUpperCase() + activeField.slice(1)}</h2>
        {activeField ? renderField() : (
          <>
            <div>
              <label>Kierowca *</label>
              <select value={responsible} onChange={e => setResponsible(e.target.value)} required className="border rounded px-2 py-1 w-full">
                <option value="">Wybierz...</option>
                {sortedFilteredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id} disabled={isEmployeeLocked(emp.id)}>
                    {emp.surname} {isEmployeeLocked(emp.id) ? '(Zajęty)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Ładowacze</label>
              <select multiple value={assistants} onChange={e => setAssistants(Array.from(e.target.selectedOptions, o => o.value))} className="border rounded px-2 py-1 w-full">
                {filteredLoaders.map(emp => (
                  <option key={emp.id} value={emp.id} disabled={isLoaderLocked(emp.id)}>
                    {emp.surname} {isLoaderLocked(emp.id) ? '(Zajęty)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Pojazd *</label>
              <select value={vehicle} onChange={e => setVehicle(e.target.value)} required className="border rounded px-2 py-1 w-full">
                <option value="">Wybierz...</option>
                {filteredVehicles.map(veh => (
                  <option key={veh.id} value={veh.id} disabled={isVehicleLocked(veh.id)}>
                    {veh.registrationNumber}
                    {veh.brand ? ` (${veh.brand})` : ''}
                    {veh.vehicleType ? ` (${veh.vehicleType})` : ''}
                    {isVehicleLocked(veh.id) ? ' (Zajęty)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Rejon *</label>
              <select
                value={customRegion ? 'custom' : regionId}
                onChange={e => {
                  if (e.target.value === 'custom') {
                    setCustomRegion(true);
                    setRegionId('');
                  } else {
                    setCustomRegion(false);
                    setRegionId(e.target.value);
                  }
                }}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="">Wybierz...</option>
                {regionOptions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
                <option value="custom">Własny rejon...</option>
              </select>
              {customRegion && (
                <input
                  className="border rounded px-2 py-1 w-full mt-1"
                  placeholder="Wpisz własny rejon"
                  value={regionName}
                  onChange={e => setRegionName(e.target.value)}
                />
              )}
            </div>
            <div>
              <label>Gmina/Miasto *</label>
              <select className="border rounded px-2 py-1 w-full" value={municipality?.id || ''} onChange={e => {
                const selected = municipalityOptions.find(m => String(m.id) === e.target.value);
                setMunicipality(selected);
              }}>
                <option value="">Wybierz...</option>
                {municipalityOptions.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Frakcja *</label>
              <select
                value={customFraction ? 'custom' : (fractionIds[0] || '')}
                onChange={e => {
                  if (e.target.value === 'custom') {
                    setCustomFraction(true);
                    setFractionIds([]);
                  } else {
                    setCustomFraction(false);
                    setFractionIds([e.target.value]);
                  }
                }}
                className="border rounded px-2 py-1 w-full"
                disabled={customRegion && !regionName}
              >
                <option value="">Wybierz...</option>
                {(availableFractions || (regionId && getFractionsForRegion && getFractionsForRegion(Number(regionId))) || []).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
                <option value="custom">Własna frakcja...</option>
              </select>
              {customFraction && (
                <input
                  className="border rounded px-2 py-1 w-full mt-1"
                  placeholder="Wpisz własną frakcję"
                  value={fractionName}
                  onChange={e => setFractionName(e.target.value)}
                />
              )}
            </div>
            <div>
              <label>Godziny *</label>
              <select value={shift} onChange={e => setShift(e.target.value)} className="border rounded px-2 py-1 w-full">
                <option value="6-14">6-14</option>
                <option value="14-22">14-22</option>
                <option value="22-6">22-6</option>
              </select>
            </div>
          </>
        )}
        <Button onClick={handleCellSave} disabled={activeField === 'kierowca' ? !responsible : activeField === 'pojazd' ? !vehicle : activeField === 'rejon' ? (!regionId && !regionName) : activeField === 'frakcja' ? (!fractionIds.length && !fractionName) : activeField === 'shift' ? !shift : activeField === 'gmina' ? !municipality : false}>
          Zapisz
        </Button>
      </div>
    </SimpleModal>
  );
};

export default AssignmentModal; 