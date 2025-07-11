import React, { useState, useEffect } from 'react';
import SimpleModal from './SimpleModal';
import { Button } from './ui/button';
import authFetch from '../utils/authFetch';

const defaultOrder = {
  company: '',
  address: '',
  rodzaj: '',
  zlecenie: '',
  realizationDate: '',
  vehicle: '',
  responsible: '',
  notes: '',
};

const WorkOrderModal = ({ open, onClose, onSave, initial, orderType }) => {
  const [order, setOrder] = useState(defaultOrder);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    setOrder(initial ? { ...defaultOrder, ...initial } : defaultOrder);
  }, [initial, open]);

  useEffect(() => {
    if (orderType === 'surowce' && open) {
      authFetch('http://localhost:3000/api/employees')
        .then(res => res.json())
        .then(data => setEmployees(Array.isArray(data) ? data.filter(e => e.position && e.position.toLowerCase().includes('kierowca')) : []));
      authFetch('http://localhost:3000/api/vehicles')
        .then(res => res.json())
        .then(data => setVehicles(Array.isArray(data) ? data.filter(v => v.vehicleType && v.vehicleType.toLowerCase().includes('wywrotka')) : []));
    }
    if (orderType === 'worki' && open) {
      authFetch('http://localhost:3000/api/employees')
        .then(res => res.json())
        .then(data => setEmployees(Array.isArray(data) ? data.filter(e => e.position && e.position.toLowerCase().includes('kierowca')) : []));
      authFetch('http://localhost:3000/api/vehicles')
        .then(res => res.json())
        .then(data => setVehicles(Array.isArray(data) ? data.filter(v => v.vehicleType && (v.vehicleType.toLowerCase().includes('wywrotka') || v.vehicleType.toLowerCase().includes('ciągnik'))) : []));
    }
    if (orderType === 'uslugi' && open) {
      authFetch('http://localhost:3000/api/employees')
        .then(res => res.json())
        .then(data => setEmployees(Array.isArray(data) ? data.filter(e => e.position && e.position.toLowerCase().includes('kierowca')) : []));
      authFetch('http://localhost:3000/api/vehicles')
        .then(res => res.json())
        .then(data => setVehicles(Array.isArray(data) ? data.filter(v => v.vehicleType && (v.vehicleType.toLowerCase().includes('hakowy') || v.vehicleType.toLowerCase().includes('bramowy'))) : []));
    }
    if (orderType === 'bramy' && open) {
      authFetch('http://localhost:3000/api/employees')
        .then(res => res.json())
        .then(data => setEmployees(Array.isArray(data) ? data.filter(e => e.position && e.position.toLowerCase().includes('kierowca')) : []));
      authFetch('http://localhost:3000/api/vehicles')
        .then(res => res.json())
        .then(data => setVehicles(Array.isArray(data) ? data.filter(v => v.vehicleType && v.vehicleType.toLowerCase().includes('bramowy')) : []));
    }
    if (orderType === 'bezpylne' && open) {
      authFetch('http://localhost:3000/api/employees')
        .then(res => res.json())
        .then(data => setEmployees(Array.isArray(data) ? data.filter(e => e.position && e.position.toLowerCase().includes('kierowca')) : []));
      authFetch('http://localhost:3000/api/vehicles')
        .then(res => res.json())
        .then(data => setVehicles(Array.isArray(data) ? data.filter(v => v.vehicleType && (v.vehicleType.toLowerCase().includes('bezpylny') || v.vehicleType.toLowerCase().includes('dostawczy'))) : []));
    }
  }, [orderType, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(order);
  };

  return (
    <SimpleModal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="font-bold text-lg mb-2">Przypisz zlecenie</h2>
        {orderType === 'surowce' ? (
          <>
            <div>
              <label className="block text-sm font-medium">Odpowiedzialny (kierowca)</label>
              <select name="responsible" value={order.responsible} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                <option value="">Wybierz kierowcę...</option>
                {employees
                  .slice()
                  .sort((a, b) => {
                    const surnameA = a.surname || '';
                    const surnameB = b.surname || '';
                    const surnameCompare = surnameA.localeCompare(surnameB, 'pl-PL');
                    if (surnameCompare !== 0) return surnameCompare;
                    const nameA = a.name || '';
                    const nameB = b.name || '';
                    return nameA.localeCompare(nameB, 'pl-PL');
                  })
                  .map(emp => (
                    <option key={emp.id} value={emp.surname ? `${emp.name} ${emp.surname}` : emp.name}>{emp.surname ? `${emp.name} ${emp.surname}` : emp.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Pojazd (tylko wywrotka)</label>
              <select name="vehicle" value={order.vehicle} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                <option value="">Wybierz pojazd typu wywrotka...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.registrationNumber}>{v.brand} {v.registrationNumber}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
         orderType === 'worki' ? (
           <>
             <div>
               <label className="block text-sm font-medium">Odpowiedzialny (kierowca)</label>
               <select name="responsible" value={order.responsible} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                 <option value="">Wybierz kierowcę...</option>
                 {employees
                   .slice()
                   .sort((a, b) => {
                     const surnameA = (a.surname || '').toLowerCase();
                     const surnameB = (b.surname || '').toLowerCase();
                     if (surnameA < surnameB) return -1;
                     if (surnameA > surnameB) return 1;
                     const nameA = (a.name || '').toLowerCase();
                     const nameB = (b.name || '').toLowerCase();
                     if (nameA < nameB) return -1;
                     if (nameA > nameB) return 1;
                     return 0;
                   })
                   .map(emp => (
                     <option key={emp.id} value={emp.surname ? `${emp.name} ${emp.surname}` : emp.name}>{emp.surname ? `${emp.name} ${emp.surname}` : emp.name}</option>
                   ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium">Pojazd (wywrotka lub ciągnik)</label>
               <select name="vehicle" value={order.vehicle} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                 <option value="">Wybierz pojazd...</option>
                 {vehicles.map(v => (
                   <option key={v.id} value={v.registrationNumber}>{v.brand} {v.registrationNumber}</option>
                 ))}
               </select>
             </div>
           </>
         ) : orderType === 'uslugi' ? (
           <>
             <div>
               <label className="block text-sm font-medium">Odpowiedzialny (kierowca)</label>
               <select name="responsible" value={order.responsible} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                 <option value="">Wybierz kierowcę...</option>
                 {employees
                   .slice()
                   .sort((a, b) => {
                     const surnameA = (a.surname || '').toLowerCase();
                     const surnameB = (b.surname || '').toLowerCase();
                     if (surnameA < surnameB) return -1;
                     if (surnameA > surnameB) return 1;
                     const nameA = (a.name || '').toLowerCase();
                     const nameB = (b.name || '').toLowerCase();
                     if (nameA < nameB) return -1;
                     if (nameA > nameB) return 1;
                     return 0;
                   })
                   .map(emp => (
                     <option key={emp.id} value={emp.surname ? `${emp.name} ${emp.surname}` : emp.name}>{emp.surname ? `${emp.name} ${emp.surname}` : emp.name}</option>
                   ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium">Pojazd (hakowy lub bramowy)</label>
               <select name="vehicle" value={order.vehicle} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                 <option value="">Wybierz pojazd...</option>
                 {vehicles.map(v => (
                   <option key={v.id} value={v.registrationNumber}>{v.brand} {v.registrationNumber}</option>
                 ))}
               </select>
             </div>
           </>
         ) : orderType === 'bramy' ? (
           <>
             <div>
               <label className="block text-sm font-medium">Odpowiedzialny (kierowca)</label>
               <select name="responsible" value={order.responsible} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                 <option value="">Wybierz kierowcę...</option>
                 {employees
                   .slice()
                   .sort((a, b) => {
                     const surnameA = (a.surname || '').toLowerCase();
                     const surnameB = (b.surname || '').toLowerCase();
                     if (surnameA < surnameB) return -1;
                     if (surnameA > surnameB) return 1;
                     const nameA = (a.name || '').toLowerCase();
                     const nameB = (b.name || '').toLowerCase();
                     if (nameA < nameB) return -1;
                     if (nameA > nameB) return 1;
                     return 0;
                   })
                   .map(emp => (
                     <option key={emp.id} value={emp.surname ? `${emp.name} ${emp.surname}` : emp.name}>{emp.surname ? `${emp.name} ${emp.surname}` : emp.name}</option>
                   ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium">Pojazd (bramowy)</label>
               <select name="vehicle" value={order.vehicle} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                 <option value="">Wybierz pojazd...</option>
                 {vehicles.map(v => (
                   <option key={v.id} value={v.registrationNumber}>{v.brand} {v.registrationNumber}</option>
                 ))}
               </select>
             </div>
           </>
         ) : orderType === 'bezpylne' ? (
           <>
             <div>
               <label className="block text-sm font-medium">Odpowiedzialny (kierowca)</label>
               <select name="responsible" value={order.responsible} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                 <option value="">Wybierz kierowcę...</option>
                 {employees
                   .slice()
                   .sort((a, b) => {
                     const surnameA = (a.surname || '').toLowerCase();
                     const surnameB = (b.surname || '').toLowerCase();
                     if (surnameA < surnameB) return -1;
                     if (surnameA > surnameB) return 1;
                     const nameA = (a.name || '').toLowerCase();
                     const nameB = (b.name || '').toLowerCase();
                     if (nameA < nameB) return -1;
                     if (nameA > nameB) return 1;
                     return 0;
                   })
                   .map(emp => (
                     <option key={emp.id} value={emp.surname ? `${emp.name} ${emp.surname}` : emp.name}>{emp.surname ? `${emp.name} ${emp.surname}` : emp.name}</option>
                   ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium">Pojazd (bezpylny lub dostawczy)</label>
               <select name="vehicle" value={order.vehicle} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
                 <option value="">Wybierz pojazd...</option>
                 {vehicles
                   .filter(v => v.vehicleType && (v.vehicleType.toLowerCase().includes('bezpylny') || v.vehicleType.toLowerCase().includes('dostawczy')))
                   .map(v => (
                     <option key={v.id} value={v.registrationNumber}>{v.brand} {v.registrationNumber}</option>
                   ))}
               </select>
             </div>
           </>
         ) : null
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
          <Button type="submit">Zapisz</Button>
        </div>
      </form>
    </SimpleModal>
  );
};

export default WorkOrderModal; 