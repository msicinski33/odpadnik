import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Edit, Trash2, Fuel, Calendar, MapPin } from 'lucide-react';

const VehicleList = ({ vehicles, onEdit, onDelete }) => {
  const [niesprawnyMap, setNiesprawnyMap] = useState({});

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
  };

  const getFuelIcon = (fuelType) => {
    return <Fuel className="h-4 w-4" />;
  };

  const handleToggleNiesprawny = (vehicleId) => {
    setNiesprawnyMap((prev) => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  };

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-dashed border-gray-300">
        <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Vehicles Found</h3>
        <p className="text-gray-500">Start by adding your first waste collection vehicle</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className={`group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-gray-50 ${niesprawnyMap[vehicle.id] ? 'opacity-70 grayscale' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">{vehicle.brand}</CardTitle>
                  <p className="text-sm text-gray-500 font-medium">{vehicle.registrationNumber}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={`${getStatusColor(vehicle.isActive)} font-semibold`}>
                  {vehicle.isActive ? 'Aktywny' : 'Nieaktywny'}
                </Badge>
                {niesprawnyMap[vehicle.id] && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold mt-1">Niesprawny</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Typ</p>
                  <p className="font-semibold text-gray-800">{vehicle.vehicleType}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getFuelIcon(vehicle.fuelType)}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Paliwo</p>
                  <p className="font-semibold text-gray-800">{vehicle.fuelType}</p>
                </div>
              </div>
            </div>
            
            {vehicle.capacity && (
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pojemność</p>
                <p className="font-bold text-gray-800 text-lg">{vehicle.capacity}</p>
              </div>
            )}

            <hr className="my-2" />
            <div className="flex items-center gap-3 pb-2">
              <span className="text-xs text-gray-600">Niesprawny:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!niesprawnyMap[vehicle.id]}
                  onChange={() => handleToggleNiesprawny(vehicle.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-red-500 transition-all duration-200"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 peer-checked:translate-x-5"></div>
              </label>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(vehicle)}
                className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edytuj
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(vehicle.id)}
                className="flex-1 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Usuń
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VehicleList;
