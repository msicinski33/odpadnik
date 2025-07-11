import React, { useState } from 'react';
import { CardContent } from './ui/card';
import { Button } from './ui/button';
import { X, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const REQUIRED_COLUMNS = [
  'Nazwa',
  'Nazwa jednostki',
  'Notatki',
];

const TEMPLATE_FILENAME = 'region_import_template.xlsx';

const RegionImportModal = ({ open, onClose, onImport }) => {
  const [pendingImportData, setPendingImportData] = useState(null);

  if (!open) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        setPendingImportData(jsonData);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleConfirmImport = () => {
    if (pendingImportData) {
      onImport(pendingImportData);
      setPendingImportData(null);
      onClose();
    }
  };

  const handleCancelImport = () => {
    setPendingImportData(null);
  };

  if (pendingImportData) {
    const columns = pendingImportData.length > 0 ? Object.keys(pendingImportData[0]) : [];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl px-6 py-4 flex items-center justify-between">
            <h2 className="text-white text-xl font-bold">Potwierdź import regionów</h2>
            <button onClick={handleCancelImport} className="text-white hover:text-blue-200">
              <X className="h-6 w-6" />
            </button>
          </div>
          <CardContent className="p-6">
            <p className="text-gray-700 mb-4 text-center">Czy na pewno chcesz dodać poniższe dane?</p>
            <div className="overflow-auto max-h-96 border rounded mb-6">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-blue-50">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-2 py-1 font-semibold text-blue-800 border-b">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingImportData.map((row, idx) => (
                    <tr key={idx} className="even:bg-blue-50">
                      {columns.map(col => (
                        <td key={col} className="px-2 py-1 border-b">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleCancelImport}>Anuluj</Button>
              <Button className="bg-blue-600 text-white" onClick={handleConfirmImport}>Dodaj</Button>
            </div>
          </CardContent>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative animate-fade-in">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl px-6 py-4 flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">Import regionów</h2>
          <button onClick={onClose} className="text-white hover:text-blue-200">
            <X className="h-6 w-6" />
          </button>
        </div>
        <CardContent className="p-6">
          <p className="text-gray-700 mb-4 text-center">Prześlij plik Excel z informacjami o regionach</p>
          <div className="flex flex-col gap-4 items-center mb-6">
            <a
              href={`/${TEMPLATE_FILENAME}`}
              download
              className="w-full"
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="outline"
                className="w-full border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center justify-center"
                type="button"
                as="span"
              >
                <Download className="h-5 w-5 mr-2" />
                Pobierz Szablon
              </Button>
            </a>
            <label className="w-full">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
                id="import-excel-input-region"
              />
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center"
                type="button"
                onClick={() => document.getElementById('import-excel-input-region').click()}
              >
                <Upload className="h-5 w-5 mr-2" />
                Prześlij Plik Excel
              </Button>
            </label>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="font-semibold text-blue-800 mb-2">Wymagane Kolumny:</div>
            <ul className="list-disc list-inside text-blue-700">
              {REQUIRED_COLUMNS.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </div>
    </div>
  );
};

export default RegionImportModal; 