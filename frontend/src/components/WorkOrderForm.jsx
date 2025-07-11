import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Input } from './ui/input';
import { Button } from './ui/button';

const rodzajOptions = ['ZABRANIE', 'WSTAWIENIE', 'OPRÓŻNIENIE', 'REKLAMACJA'];
const wasteTypes = ['PAPIER', 'TWORZYWA', 'SZKŁO', 'BIO'];

const WorkOrderForm = ({ onSubmit, orderType, category }) => {
  const isSurowce = category === 'Surowce wtórne';
  const [form, setForm] = useState({
    dateReceived: new Date(),
    executionDate: '',
    receivedBy: '',
    address: '',
    rodzaj: '',
    wasteType: '',
    description: '',
    company: '',
    municipality: '',
  });

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-6">
      <div>
        <label>Data przyjęcia</label>
        <DatePicker selected={form.dateReceived} onChange={date => handleChange('dateReceived', date)} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1" required />
      </div>
      <div>
        <label>Data wykonania *</label>
        <DatePicker selected={form.executionDate} onChange={date => handleChange('executionDate', date)} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1" required />
      </div>
      <div>
        <label>Przyjął *</label>
        <Input value={form.receivedBy} onChange={e => handleChange('receivedBy', e.target.value)} required />
      </div>
      <div>
        <label>Odpad *</label>
        <select value={form.wasteType} onChange={e => handleChange('wasteType', e.target.value)} required className="border rounded px-2 py-1 w-full">
          <option value="">Wybierz...</option>
          {wasteTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      {isSurowce && (
        <div>
          <label>Rodzaj *</label>
          <select value={form.rodzaj} onChange={e => handleChange('rodzaj', e.target.value)} required className="border rounded px-2 py-1 w-full">
            <option value="">Wybierz...</option>
            {rodzajOptions.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label>Miejscowość</label>
        <Input value={form.municipality} onChange={e => handleChange('municipality', e.target.value)} />
      </div>
      <div>
        <label>Adres (klient)</label>
        <Input value={form.address} onChange={e => handleChange('address', e.target.value)} required />
      </div>
      <div>
        <label>Uwagi</label>
        <Input value={form.description} onChange={e => handleChange('description', e.target.value)} />
      </div>
      <Button type="submit">Utwórz zlecenie</Button>
    </form>
  );
};

export default WorkOrderForm; 