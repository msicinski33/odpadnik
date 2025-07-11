import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Plus, Eye } from 'lucide-react';
import authFetch from '../utils/authFetch';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Home, Building2 } from 'lucide-react';

const PointList = ({ type, onEdit, onAdd, onDelete, onView }) => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`http://localhost:3000/api/points/type/${type}`);
      const data = await res.json();
      setPoints(data);
    } catch (err) {
      setError('Błąd pobierania punktów: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten punkt?')) {
      try {
        await authFetch(`http://localhost:3000/api/points/${id}`, { method: 'DELETE' });
        fetchPoints();
      } catch (err) {
        setError('Błąd usuwania punktu: ' + err.message);
      }
    }
  };

  if (loading) return <div className="text-center p-8">Ładowanie...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Punkty {type === 'zamieszkala' ? 'Zamieszkane' : 'Niezamieszkane'}
          </h2>
          <button
            onClick={onAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj punkt
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Miasto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ulica
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Numer
              </th>
              {type === 'zamieszkala' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kompostownik
                </th>
              )}
              {type === 'niezamieszkala' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nazwa firmy
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {points.map((point) => (
              <tr key={point.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {point.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {point.town}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {point.street}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {point.number}
                </td>
                {type === 'zamieszkala' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {point.kompostownik ? '✔️' : ''}
                  </td>
                )}
                {type === 'niezamieszkala' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {point.companyName || '-'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {point.region?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {type === 'niezamieszkala' && (
                      <button
                        onClick={() => onView(point)}
                        className="text-green-600 hover:text-green-900"
                        title="Zobacz szczegóły"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(point)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(point.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PointList; 