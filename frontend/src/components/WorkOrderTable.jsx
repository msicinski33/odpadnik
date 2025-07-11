import React from 'react';
import { Button } from './ui/button';
import Switch from './ui/switch';

const RODZAJ_OPTIONS = [
  { value: 'ZABRANIE', color: 'bg-red-600 text-white' },
  { value: 'WSTAWIENIE', color: 'bg-purple-200 text-purple-900' },
  { value: 'OPRÓŻNIENIE', color: 'bg-green-500 text-white' },
  { value: 'REKLAMACJA', color: 'bg-yellow-200 text-yellow-900' },
];

const WorkOrderTable = ({ workOrders, onAssign, onToggleComplete, onRodzajChange, category }) => {
  const isSurowce = category === 'Surowce wtórne';

  return (
    <table className="min-w-full border rounded mb-6">
      <thead>
        <tr className="bg-gray-700 text-white text-xs">
          <th className="px-2 py-1">Data przyjęcia</th>
          <th className="px-2 py-1">Przyjął</th>
          <th className="px-2 py-1">Odpad</th>
          <th className="px-2 py-1">Rodzaj</th>
          <th className="px-2 py-1">Miejscowość</th>
          <th className="px-2 py-1">Adres (klient)</th>
          <th className="px-2 py-1">Pojazd</th>
          <th className="px-2 py-1">Data wykonania</th>
          <th className="px-2 py-1">Odpowiedzialny</th>
          <th className="px-2 py-1">Uwagi</th>
          <th className="px-2 py-1">Status</th>
        </tr>
      </thead>
      <tbody>
        {workOrders.map(order => (
          <tr key={order.id} className="text-xs">
            <td className="px-2 py-1">{order.dateReceived && new Date(order.dateReceived).toLocaleDateString()}</td>
            <td className="px-2 py-1">{order.receivedBy}</td>
            <td className="px-2 py-1">{order.wasteType}</td>
            <td className="px-2 py-1">
              {isSurowce ? (
                <select
                  className={`rounded px-2 py-1 font-bold ${RODZAJ_OPTIONS.find(opt => opt.value === order.rodzaj)?.color || ''}`}
                  value={order.rodzaj || ''}
                  onChange={e => onRodzajChange(order, e.target.value)}
                >
                  <option value="">Wybierz...</option>
                  {RODZAJ_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.value}</option>
                  ))}
                </select>
              ) : (
                order.rodzaj || ''
              )}
            </td>
            <td className="px-2 py-1">{order.municipality}</td>
            <td className="px-2 py-1">{order.address}</td>
            <td className="px-2 py-1">{order.vehicle}</td>
            <td className="px-2 py-1">{order.executionDate && new Date(order.executionDate).toLocaleDateString()}</td>
            <td className="px-2 py-1">{order.responsible}</td>
            <td className="px-2 py-1">{order.description}</td>
            <td className="px-2 py-1">
              <Switch checked={order.completed} onChange={val => onToggleComplete(order, val)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default WorkOrderTable; 