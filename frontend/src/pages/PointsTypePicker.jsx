import React from 'react';
import { useNavigate } from 'react-router-dom';

const PointsTypePicker = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-8">Wybierz typ punktów</h1>
      <div className="flex gap-8">
        <button
          onClick={() => navigate('/punkty/zamieszkale')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xl px-10 py-6 rounded-2xl shadow-lg transition-all duration-200"
        >
          Zamieszkane
        </button>
        <button
          onClick={() => navigate('/punkty/niezamieszkale')}
          className="bg-gray-600 hover:bg-gray-700 text-white text-xl px-10 py-6 rounded-2xl shadow-lg transition-all duration-200"
        >
          Niezamieszkane
        </button>
      </div>
    </div>
  );
};

export default PointsTypePicker; 