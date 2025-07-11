import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SimpleModal from './SimpleModal';
import { Button } from './ui/button';
import { FileText } from 'lucide-react';

const rodzajOptions = ['M', 'M (99 zł)', 'D'];

export default function WorkiGruzoweCreateModal({ open, onClose, onSubmit, initialData, title }) {
  const [form, setForm] = useState({
    dateReceived: new Date(),
    receivedBy: '',
    quantity: '',
    rodzaj: '',
    address: '',
    company: '',
    orderNumber: '',
    bagNumber: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        dateReceived: initialData.dateReceived ? new Date(initialData.dateReceived) : new Date(),
        receivedBy: initialData.receivedBy || '',
        quantity: initialData.quantity || '',
        rodzaj: initialData.rodzaj || '',
        address: initialData.address || '',
        company: initialData.company || '',
        orderNumber: initialData.orderNumber || '',
        bagNumber: initialData.bagNumber || '',
        notes: initialData.notes || '',
      });
    } else {
      setForm({
        dateReceived: new Date(),
        receivedBy: '',
        quantity: '',
        rodzaj: '',
        address: '',
        company: '',
        orderNumber: '',
        bagNumber: '',
        notes: '',
      });
    }
  }, [initialData, open]);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.dateReceived || !form.receivedBy || !form.quantity || !form.rodzaj || !form.address || !form.company || !form.orderNumber || !form.bagNumber) {
      setError('Wszystkie pola oprócz "Uwagi" są wymagane.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <SimpleModal open={open} onClose={onClose} title={title || 'Dodaj zlecenie – Worki gruzowe'} icon={<FileText className="h-6 w-6" />}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label>Data zgłoszenia *</label>
          <DatePicker selected={form.dateReceived} onChange={date => handleChange('dateReceived', date)} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label>Przyjął *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.receivedBy} onChange={e => handleChange('receivedBy', e.target.value)} required />
        </div>
        <div>
          <label>Ilość *</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={form.quantity} onChange={e => handleChange('quantity', e.target.value)} required min={1} />
        </div>
        <div>
          <label>Rodzaj *</label>
          <select className="border rounded px-2 py-1 w-full" value={form.rodzaj} onChange={e => handleChange('rodzaj', e.target.value)} required>
            <option value="">Wybierz...</option>
            {rodzajOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label>Adres *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.address} onChange={e => handleChange('address', e.target.value)} required />
        </div>
        <div>
          <label>Klient *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.company} onChange={e => handleChange('company', e.target.value)} required />
        </div>
        <div>
          <label>Numer zlecenia/KPO *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.orderNumber} onChange={e => handleChange('orderNumber', e.target.value)} required />
        </div>
        <div>
          <label>Numer worka *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.bagNumber} onChange={e => handleChange('bagNumber', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label>Uwagi</label>
          <input className="border rounded px-2 py-1 w-full" value={form.notes} onChange={e => handleChange('notes', e.target.value)} />
        </div>
        {error && <div className="text-red-600 text-sm md:col-span-2">{error}</div>}
        <div className="flex space-x-3 md:col-span-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-gray-300 hover:bg-gray-50">Anuluj</Button>
          <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">Zapisz</Button>
        </div>
      </form>
    </SimpleModal>
  );
} 