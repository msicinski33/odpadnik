import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SimpleModal from './SimpleModal';
import { Button } from './ui/button';

export default function WorkiGruzoweRealizationDateModal({ open, onClose, onSave, initialDate }) {
  const [date, setDate] = useState(initialDate || new Date());
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!date) {
      setError('Wybierz datę realizacji.');
      return;
    }
    setError('');
    onSave(date);
  };

  return (
    <SimpleModal open={open} onClose={onClose}>
      <h2 className="text-lg font-bold mb-2">Wybierz datę realizacji</h2>
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <DatePicker selected={date} onChange={setDate} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1" required />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit">Zapisz</Button>
      </form>
    </SimpleModal>
  );
} 