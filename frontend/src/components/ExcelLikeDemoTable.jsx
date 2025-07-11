import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const fractionColors = {
  'PAPIER': 'bg-blue-700 text-white',
  'TWORZYWA': 'bg-yellow-200 text-yellow-900',
  'SZKŁO': 'bg-green-200 text-green-900',
  'BIO': 'bg-red-700 text-white',
};

const initialRows = [
  {
    address: 'Dębina-Jesionowa 1a',
    fraction: 'PAPIER',
    container: 'W-40',
    frequency: '1 X W MSC.',
    startDate: new Date(2025, 6, 1),
    endDate: new Date(2025, 7, 31),
    company: 'SŁODKO SŁONO Żaneta Tęcza',
  },
  {
    address: 'Dębina-Jesionowa 1a',
    fraction: 'TWORZYWA',
    container: 'MGB-120',
    frequency: '1 X W TYG.',
    startDate: new Date(2025, 6, 1),
    endDate: new Date(2025, 7, 31),
    company: 'SŁODKO SŁONO Żaneta Tęcza',
  },
  {
    address: 'Dębina-Jesionowa 1a',
    fraction: 'SZKŁO',
    container: 'W-40',
    frequency: '1 X W MSC.',
    startDate: new Date(2025, 6, 1),
    endDate: new Date(2025, 7, 31),
    company: 'SŁODKO SŁONO Żaneta Tęcza',
  },
  {
    address: 'Dębina-Jesionowa 1a',
    fraction: 'BIO',
    container: 'W-10',
    frequency: '1 X W TYG.',
    startDate: new Date(2025, 6, 1),
    endDate: new Date(2025, 7, 31),
    company: 'SŁODKO SŁONO Żaneta Tęcza',
  },
];

const fractionOptions = ['PAPIER', 'TWORZYWA', 'SZKŁO', 'BIO'];
const containerOptions = ['W-40', 'MGB-120', 'W-10'];
const frequencyOptions = ['1 X W MSC.', '1 X W TYG.'];

const ExcelLikeDemoTable = () => {
  const [rows, setRows] = useState(initialRows);

  const handleChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  return (
    <div className="overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white max-w-5xl mx-auto mt-8">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-700 text-white">
            <th className="px-2 py-1 font-bold text-xs whitespace-normal">NAZWA FIRMY / UWAGI</th>
            <th className="px-2 py-1 font-bold text-xs whitespace-normal">ADRES</th>
            <th className="px-2 py-1 font-bold text-xs whitespace-normal">FRAKCJA</th>
            <th className="px-2 py-1 font-bold text-xs whitespace-normal">POJEMNIK</th>
            <th className="px-2 py-1 font-bold text-xs whitespace-normal">CZĘSTOTLIWOŚĆ</th>
            <th className="px-2 py-1 font-bold text-xs whitespace-normal">OD</th>
            <th className="px-2 py-1 font-bold text-xs whitespace-normal">DO</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-green-50' : ''}>
              <td className="px-2 py-1 font-bold text-green-900 text-xs whitespace-normal">{row.company}</td>
              <td className="px-2 py-1 font-bold text-black text-xs whitespace-normal">{row.address}</td>
              <td className="px-2 py-1 text-xs whitespace-normal">
                <select
                  className={`rounded px-2 py-1 font-bold ${fractionColors[row.fraction] || ''}`}
                  value={row.fraction}
                  onChange={e => handleChange(idx, 'fraction', e.target.value)}
                >
                  {fractionOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1 text-xs whitespace-normal">
                <select
                  className="rounded px-2 py-1 bg-gray-200"
                  value={row.container}
                  onChange={e => handleChange(idx, 'container', e.target.value)}
                >
                  {containerOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1 text-xs whitespace-normal">
                <select
                  className="rounded px-2 py-1 bg-gray-200"
                  value={row.frequency}
                  onChange={e => handleChange(idx, 'frequency', e.target.value)}
                >
                  {frequencyOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1 text-xs whitespace-normal">
                <DatePicker
                  selected={row.startDate}
                  onChange={date => handleChange(idx, 'startDate', date)}
                  dateFormat="dd-MM-yyyy"
                  className="border rounded px-2 py-1"
                />
              </td>
              <td className="px-2 py-1 text-xs whitespace-normal">
                <DatePicker
                  selected={row.endDate}
                  onChange={date => handleChange(idx, 'endDate', date)}
                  dateFormat="dd-MM-yyyy"
                  className="border rounded px-2 py-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExcelLikeDemoTable; 