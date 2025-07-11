import React, { useEffect, useState, useCallback } from 'react';
import authFetch from '../utils/authFetch';
import FractionAssignmentForm from './FractionAssignmentForm';

const FractionAssignmentList = ({ pointId }) => {
  const [assignments, setAssignments] = useState([]);
  const [fractions, setFractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/points/${pointId}/fractions`);
      const data = await res.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Błąd pobierania przypisań frakcji: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [pointId]);

  const fetchFractions = useCallback(async () => {
    try {
      const res = await authFetch('/api/fractions');
      const data = await res.json();
      setFractions(data);
    } catch (err) {
      setError('Błąd pobierania frakcji: ' + err.message);
    }
  }, []);

  useEffect(() => {
    if (pointId) fetchAssignments();
  }, [pointId, fetchAssignments]);

  useEffect(() => {
    fetchFractions();
  }, [fetchFractions]);

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (assignment) => {
    setEditing(assignment);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć to przypisanie?')) {
      try {
        await authFetch(`/api/point-fractions/${id}`, { method: 'DELETE' });
        fetchAssignments();
      } catch (err) {
        setError('Błąd usuwania przypisania: ' + err.message);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editing) {
        // Edit
        await authFetch(`/api/point-fractions/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // Add
        await authFetch(`/api/points/${pointId}/fractions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      setEditing(null);
      fetchAssignments();
    } catch (err) {
      setError('Błąd zapisu przypisania: ' + err.message);
    }
  };

  if (loading) return <div>Ładowanie frakcji...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <ul className="mb-4">
        {assignments.length === 0 && <li className="text-gray-400">Brak przypisanych frakcji.</li>}
        {assignments.map(a => (
          <li key={a.id} className="flex items-center gap-2 mb-2">
            <span className="text-green-700 font-semibold">{a.fraction?.name}</span>
            <span className="text-gray-700">– {a.containerSize}L</span>
            <span className="text-gray-500">– {a.pickupFrequency}</span>
            <button className="ml-2 text-blue-600 hover:underline text-xs" onClick={() => handleEdit(a)}>Edytuj</button>
            <button className="ml-1 text-red-600 hover:underline text-xs" onClick={() => handleDelete(a.id)}>Usuń</button>
          </li>
        ))}
      </ul>
      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm" onClick={handleAdd}>Dodaj frakcję</button>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="absolute top-2 right-4 text-gray-500 hover:text-gray-800 text-2xl"
              title="Zamknij"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edytuj przypisanie' : 'Dodaj przypisanie'}</h3>
            <FractionAssignmentForm
              fractions={fractions}
              initialData={editing ? {
                fractionId: editing.fractionId,
                containerSize: editing.containerSize,
                pickupFrequency: editing.pickupFrequency,
              } : null}
              onSubmit={handleFormSubmit}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FractionAssignmentList; 