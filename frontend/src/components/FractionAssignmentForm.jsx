import React, { useState } from 'react';

const containerSizes = [
  '120', '240', '360', '1100', 'W-10', 'W-35', 'W-40', 'W-60', 'W-80', 'W-100', 'W-120'
];
const pickupFrequencies = [
  '1 X MSC.', '2 X W MSC.', '1 X W TYG.', '2 X W TYG.', '3 X W TYG.', 'RAZ NA KWARTAŁ'
];

const FractionAssignmentForm = ({ fractions, initialData, onSubmit, onCancel }) => {
  const [fractionId, setFractionId] = useState(initialData?.fractionId || '');
  const [containerSize, setContainerSize] = useState(initialData?.containerSize || '');
  const [pickupFrequency, setPickupFrequency] = useState(initialData?.pickupFrequency || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fractionId || !containerSize || !pickupFrequency) {
      setError('Wszystkie pola są wymagane.');
      return;
    }
    setError('');
    onSubmit({ fractionId, containerSize, pickupFrequency });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}
      <div>
        <label className="block mb-1 font-medium">Frakcja</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={fractionId}
          onChange={e => setFractionId(e.target.value)}
        >
          <option value="">Wybierz frakcję</option>
          {fractions.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Pojemność pojemnika</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={containerSize}
          onChange={e => setContainerSize(e.target.value)}
        >
          <option value="">Wybierz pojemność</option>
          {containerSizes.map(size => (
            <option key={size} value={size}>{size}L</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Częstotliwość odbioru</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={pickupFrequency}
          onChange={e => setPickupFrequency(e.target.value)}
        >
          <option value="">Wybierz częstotliwość</option>
          {pickupFrequencies.map(freq => (
            <option key={freq} value={freq}>{freq}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Anuluj</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Zapisz</button>
      </div>
    </form>
  );
};

export default FractionAssignmentForm; 