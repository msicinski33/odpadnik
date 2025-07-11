import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SimpleModal from './SimpleModal';
import { Button } from './ui/button';
import { FileText } from 'lucide-react';

const rodzajOptions = ['ZABRANIE', 'WSTAWIENIE', 'OPRÓŻNIENIE', 'REKLAMACJA'];

const SurowceCreateModal = ({ open, onClose, onCreate, initial, deleteButton, title }) => {
  const [form, setForm] = useState({
    dateReceived: new Date(),
    realizationDate: '',
    receivedBy: '',
    odpad: '',
    rodzaj: '',
    address: '',
    klient: '',
    uwagi: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        dateReceived: initial.dateReceived ? new Date(initial.dateReceived) : new Date(),
        realizationDate: initial.realizationDate ? new Date(initial.realizationDate) : '',
        receivedBy: initial.receivedBy || '',
        odpad: initial.odpad || '',
        rodzaj: initial.rodzaj || '',
        address: initial.address || '',
        klient: initial.klient || '',
        uwagi: initial.uwagi || '',
      });
    } else {
      setForm({
        dateReceived: new Date(),
        realizationDate: '',
        receivedBy: '',
        odpad: '',
        rodzaj: '',
        address: '',
        klient: '',
        uwagi: '',
      });
    }
  }, [initial, open]);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onCreate(form);
  };

  return (
    <SimpleModal open={open} onClose={onClose} title={title} icon={<FileText className="h-6 w-6" />}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label>Data przyjęcia *</label>
          <DatePicker selected={form.dateReceived} onChange={date => handleChange('dateReceived', date)} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label>Data realizacji *</label>
          <DatePicker selected={form.realizationDate} onChange={date => handleChange('realizationDate', date)} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label>Przyjął *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.receivedBy} onChange={e => handleChange('receivedBy', e.target.value)} required />
        </div>
        <div>
          <label>Odpad *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.odpad} onChange={e => handleChange('odpad', e.target.value)} required />
        </div>
        <div>
          <label>Rodzaj *</label>
          <select className="border rounded px-2 py-1 w-full" value={form.rodzaj} onChange={e => handleChange('rodzaj', e.target.value)} required>
            <option value="">Wybierz...</option>
            {rodzajOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label>Adres (miejscowość) *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.address} onChange={e => handleChange('address', e.target.value)} required />
        </div>
        <div>
          <label>Klient *</label>
          <input className="border rounded px-2 py-1 w-full" value={form.klient} onChange={e => handleChange('klient', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label>Uwagi</label>
          <input className="border rounded px-2 py-1 w-full" value={form.uwagi} onChange={e => handleChange('uwagi', e.target.value)} />
        </div>
        <div className="flex space-x-3 md:col-span-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-gray-300 hover:bg-gray-50">Anuluj</Button>
          <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">Zapisz</Button>
        </div>
      </form>
    </SimpleModal>
  );
};

export default SurowceCreateModal; 