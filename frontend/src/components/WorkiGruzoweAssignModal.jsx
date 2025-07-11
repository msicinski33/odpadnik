import React, { useEffect, useState } from 'react';
import SimpleModal from './SimpleModal';
import { Button } from './ui/button';

const WorkiGruzoweAssignModal = ({ open, onClose, onAssign, initial }) => {
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [responsible, setResponsible] = useState(initial?.responsible || '');
  const [vehicle, setVehicle] = useState(initial?.vehicle || '');

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(setEmployees);
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(setVehicles);
  }, []);

  useEffect(() => {
    setResponsible(initial?.responsible || '');
    setVehicle(initial?.vehicle || '');
  }, [initial]);

  const handleSave = () => {
    if (!responsible || !vehicle) return;
    onAssign({ responsible, vehicle });
  };

  return (
    <SimpleModal open={open} onClose={onClose}>
      <h2 className="font-bold text-lg mb-2">Przypisz pracownika i pojazd</h2>
      <div className="space-y-2">
        <div>
          <label>Odpowiedzialny (pracownik) *</label>
          <select value={responsible} onChange={e => setResponsible(e.target.value)} required className="border rounded px-2 py-1 w-full">
            <option value="">Wybierz...</option>
            {employees.map(emp => <option key={emp.id} value={emp.surname}>{emp.surname}</option>)}
          </select>
        </div>
        <div>
          <label>Pojazd *</label>
          <select value={vehicle} onChange={e => setVehicle(e.target.value)} required className="border rounded px-2 py-1 w-full">
            <option value="">Wybierz...</option>
            {vehicles.map(veh => (
              <option key={veh.id} value={veh.registrationNumber}>
                {veh.registrationNumber} {veh.brand && `(${veh.brand})`}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleSave} disabled={!responsible || !vehicle}>Zapisz</Button>
      </div>
    </SimpleModal>
  );
};

export default WorkiGruzoweAssignModal; 