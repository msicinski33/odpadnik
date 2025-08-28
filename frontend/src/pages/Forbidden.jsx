import React from 'react';
import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white shadow rounded-xl p-8 text-center">
        <div className="text-6xl font-black text-slate-300">403</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Brak dostępu</h1>
        <p className="mt-2 text-slate-600">
          Nie masz uprawnień do wyświetlenia tej strony. Skontaktuj się z administratorem, jeśli uważasz, że to błąd.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Wróć do panelu
        </Link>
      </div>
    </div>
  );
}














