import React, { useState, useEffect } from 'react';
import SimpleModal from './SimpleModal';
import { Button } from './ui/button';

const RegionFractionModal = ({ open, onClose, onSave, initial, regionOptions, getFractionsForRegion }) => {
  const [rejon, setRejon] = useState(initial?.rejon || '');
  const [frakcja, setFrakcja] = useState(initial?.frakcja || '');
  const [fractions, setFractions] = useState([]);

  useEffect(() => {
    setRejon(initial?.rejon || '');
    setFrakcja(initial?.frakcja || '');
  }, [initial, open]);

  useEffect(() => {
    if (rejon && rejon.id && getFractionsForRegion) {
      setFractions(getFractionsForRegion(rejon.id));
    } else {
      setFractions([]);
    }
  }, [rejon, getFractionsForRegion]);

  const handleSave = () => {
    if (rejon && frakcja) {
      onSave({ rejon, frakcja });
    }
  };

  return (
    <SimpleModal open={open} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Wybierz Rejon i Frakcję</h2>
        <div className="mb-4">
          <label className="block mb-1">Rejon *</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={rejon && rejon.id ? rejon.id : ''}
            onChange={e => {
              const selected = regionOptions.find(r => String(r.id) === e.target.value);
              setRejon(selected || '');
              setFrakcja('');
            }}
          >
            <option value="">Wybierz...</option>
            {regionOptions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Frakcja *</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={frakcja && frakcja.id ? frakcja.id : ''}
            onChange={e => {
              const selected = fractions.find(f => String(f.id) === e.target.value);
              setFrakcja(selected || '');
            }}
            disabled={!rejon || !rejon.id}
          >
            <option value="">Wybierz...</option>
            {fractions.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleSave} disabled={!rejon || !frakcja}>Zapisz</Button>
        </div>
      </div>
    </SimpleModal>
  );
};

export default RegionFractionModal; 