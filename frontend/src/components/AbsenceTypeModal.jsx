import React, { useState, useEffect } from 'react';
import SimpleModal from './SimpleModal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Palette } from 'lucide-react';

const emptyForm = { name: '', code: '', color: '', notes: '' };

const AbsenceTypeModal = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm(emptyForm);
  }, [initialData, open]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.code.trim()) return alert('Kod jest wymagany');
    if (!form.name.trim()) return alert('Nazwa jest wymagana');
    onSubmit(form);
  };

  return (
    <SimpleModal open={open} onClose={onClose} title={initialData ? 'Edytuj rodzaj absencji' : 'Dodaj rodzaj absencji'} icon={<Palette className="h-6 w-6 text-white" />}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-semibold">Kod *</label>
          <Input name="code" value={form.code} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Nazwa *</label>
          <Input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Kolor</label>
          <div className="flex gap-2 items-center">
            <input type="color" className="w-10 h-10 p-0 border rounded" value={form.color || '#00aabb'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            <Input name="color" value={form.color || ''} onChange={handleChange} placeholder="#00aabb lub red" />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Notatki</label>
          <textarea name="notes" value={form.notes || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
          <Button type="submit" className="bg-blue-600 text-white">Zapisz</Button>
        </div>
      </form>
    </SimpleModal>
  );
};

export default AbsenceTypeModal; 