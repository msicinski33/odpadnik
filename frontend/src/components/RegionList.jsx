import React from 'react';
import { Edit2, Trash2, Link2, MapPin } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Edit } from 'lucide-react';

const RegionList = ({ regions, onEdit, onDelete, onAssignPoints }) => (
  <div className="w-full flex justify-center">
    <div className="w-full max-w-7xl px-6 flex flex-wrap gap-6 mt-6 justify-center">
      {regions.length === 0 && (
        <div className="text-gray-500 text-center w-full py-8">Brak regionów</div>
      )}
      {regions.map(region => (
        <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-200 w-[340px]">
          <CardHeader className="flex items-center gap-3 pb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <MapPin className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-blue-900">{region.name}</span>
              <div className="text-sm text-blue-900">{region.unitName}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-1">
              <span className="font-bold">Notatki:</span> {region.notes || '-'}
            </div>
            {region.assignedFractions && region.assignedFractions.length > 0 && (
              <div className="mb-2">
                <span className="font-bold text-sm text-gray-700">Frakcje:</span>
                <span className="text-sm text-gray-700"> {region.assignedFractions.map(f => f.name).join(', ')}</span>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => onEdit(region)}>
                <Edit className="h-4 w-4 mr-1" /> Edytuj
              </Button>
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={() => onAssignPoints(region)}>
                <Link2 className="h-4 w-4 mr-1" /> Przypisz
              </Button>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => onDelete(region.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Usuń
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default RegionList; 