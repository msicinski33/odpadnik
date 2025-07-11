import React from 'react';
import { Edit2, Trash2, Layers } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const FractionList = ({ fractions, onEdit, onDelete }) => (
  <div className="w-full flex justify-center">
    <div className="w-full max-w-7xl px-6 flex flex-wrap gap-6 mt-6 justify-center">
      {fractions.length === 0 && (
        <div className="text-gray-500 text-center w-full py-8">Brak frakcji</div>
      )}
      {fractions.map(fraction => (
        <Card className="w-[340px] border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-200 relative" key={fraction.id}>
          {fraction.color && (
            <span style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, background: fraction.color, borderRadius: 6, border: '1px solid #ccc', display: 'inline-block' }} />
          )}
          <CardHeader className="flex items-center gap-3 pb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Layers className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-blue-900">{fraction.name}</span>
              <Badge className="bg-blue-50 text-blue-700 ml-2">{fraction.code}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-semibold">Kolor:</span>
              <span>{fraction.color || '-'}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => onEdit(fraction)}>
                <Edit2 className="h-4 w-4 mr-1" /> Edytuj
              </Button>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => onDelete(fraction.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Usuń
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default FractionList; 