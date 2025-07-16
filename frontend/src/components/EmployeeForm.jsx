import React, { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';

const EmployeeForm = ({ initialData, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    surname: '',
    position: '',
    phone: '',
    email: '',
    hiredAt: '',
    hasDisabilityCertificate: false,
    workHours: 8,
    overtimeAllowed: false,
    nightShiftAllowed: false,
  });

  useEffect(() => {
    if (initialData) setForm({
      ...initialData,
      workHours: initialData.workHours ?? 8,
      overtimeAllowed: initialData.overtimeAllowed ?? false,
      nightShiftAllowed: initialData.nightShiftAllowed ?? false,
    });
  }, [initialData]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Fix hiredAt: send as ISO string or null
    let submitData = { ...form };
    if (!form.hiredAt) {
      submitData.hiredAt = null;
    } else {
      // Convert to ISO string (date only, set to midnight UTC)
      submitData.hiredAt = new Date(form.hiredAt).toISOString();
    }
    // Ensure workHours is a number
    submitData.workHours = Number(submitData.workHours);
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-xl px-8 py-5 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <User className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-white text-2xl font-bold flex-1">{initialData ? 'Edytuj pracownika' : 'Dodaj nowego pracownika'}</h2>
          <button onClick={onCancel} className="text-white hover:text-blue-200">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 bg-white rounded-b-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-semibold mb-2">Imię</label>
              <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź imię" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Nazwisko</label>
              <input name="surname" value={form.surname} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź nazwisko" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Stanowisko</label>
              <input name="position" value={form.position} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź stanowisko" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź email" type="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Data zatrudnienia</label>
              <input name="hiredAt" value={form.hiredAt || ''} onChange={handleChange} type="date" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
            </div>
            <div className="flex items-center mt-6">
              <input id="disability" name="hasDisabilityCertificate" type="checkbox" checked={form.hasDisabilityCertificate} onChange={handleChange} className="mr-2" />
              <label htmlFor="disability" className="text-sm font-semibold">Posiada orzeczenie o niepełnosprawności</label>
            </div>
            {/* New fields for work hours and permissions */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Wymiar pracy</label>
              <select name="workHours" value={form.workHours || 8} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base">
                <option value={8}>8 godzin</option>
                <option value={7}>7 godzin</option>
              </select>
            </div>
            <div className="mt-4 flex gap-6">
              <div className="flex items-center">
                <input id="overtimeAllowed" name="overtimeAllowed" type="checkbox" checked={!!form.overtimeAllowed} onChange={handleChange} className="mr-2" />
                <label htmlFor="overtimeAllowed" className="text-sm font-semibold">Praca w godzinach nadliczbowych</label>
              </div>
              <div className="flex items-center">
                <input id="nightShiftAllowed" name="nightShiftAllowed" type="checkbox" checked={!!form.nightShiftAllowed} onChange={handleChange} className="mr-2" />
                <label htmlFor="nightShiftAllowed" className="text-sm font-semibold">Praca w godzinach nocnych</label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Telefon</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" placeholder="Wprowadź telefon" />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 justify-end">
            <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-6 py-3 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50">Anuluj</button>
            <button type="submit" className="flex-1 md:flex-none px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954 8.955c.44.439 1.152.439 1.591 0L21.75 12M12 3v17.25" /></svg>
              {initialData ? 'Zapisz zmiany' : 'Dodaj pracownika'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm; 