import React, { useState, useEffect } from 'react';

const DocumentEditModal = ({ open, onClose, document }) => {
  const [form, setForm] = useState({
    contractNumber: '',
    parties: '',
    description: '',
    tags: ''
  });

  useEffect(() => {
    if (document) {
      setForm({
        contractNumber: document.contractNumber || '',
        parties: document.parties || '',
        description: document.description || '',
        tags: document.tags || ''
      });
    }
  }, [document]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save logic to be implemented
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Edytuj dokument</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Numer umowy</label>
            <input
              type="text"
              name="contractNumber"
              value={form.contractNumber}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Strony</label>
            <input
              type="text"
              name="parties"
              value={form.parties}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Opis</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tagi</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Anuluj</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Zapisz</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentEditModal; 