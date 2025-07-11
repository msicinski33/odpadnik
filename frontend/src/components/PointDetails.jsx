import React from 'react';
import FractionAssignmentList from './FractionAssignmentList';

const PointDetails = ({ point, onClose }) => {
  if (!point) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
          title="Zamknij"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Szczegóły punktu</h2>
        <div className="mb-4">
          <div><b>ID:</b> {point.id}</div>
          <div><b>Miasto:</b> {point.town}</div>
          <div><b>Ulica:</b> {point.street}</div>
          <div><b>Numer:</b> {point.number}</div>
          <div><b>Nazwa firmy:</b> {point.companyName || '-'}</div>
          <div><b>Region:</b> {point.region?.name || '-'}</div>
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Fractions assigned</h3>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <FractionAssignmentList pointId={point.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointDetails; 