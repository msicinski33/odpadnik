import React, { useState } from 'react';
import { Edit2, Trash2, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import Switch from './ui/switch';
import FaultReportModal from './FaultReportModal';
import authFetch from '../utils/authFetch';
import { Card, CardHeader, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const VehicleList = ({ vehicles, onEdit, onDelete, onVehicleUpdate }) => {
  const [faultModalOpen, setFaultModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFaultToggle = (vehicle) => {
    if (vehicle.faultStatus === 'operational') {
      // Open fault report modal
      setSelectedVehicle(vehicle);
      setFaultModalOpen(true);
    } else {
      // Resolve fault
      resolveVehicleFault(vehicle.id);
    }
  };

  const resolveVehicleFault = async (vehicleId) => {
    try {
      setIsSubmitting(true);
      const response = await authFetch(`http://localhost:3000/api/vehicles/${vehicleId}/fault/resolve`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        // Update the vehicle in the parent component
        onVehicleUpdate();
      } else {
        console.error('Failed to resolve vehicle fault');
      }
    } catch (error) {
      console.error('Error resolving vehicle fault:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFaultReportSubmit = async (description) => {
    if (!selectedVehicle) return;

    try {
      setIsSubmitting(true);
      const response = await authFetch(`http://localhost:3000/api/vehicles/${selectedVehicle.id}/fault`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description,
          reportedBy: 'User' // You can get this from user context
        })
      });

      if (response.ok) {
        setFaultModalOpen(false);
        setSelectedVehicle(null);
        // Update the vehicle in the parent component
        onVehicleUpdate();
      } else {
        console.error('Failed to submit fault report');
      }
    } catch (error) {
      console.error('Error submitting fault report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (vehicle) => {
    const isFaulty = vehicle.faultStatus === 'faulty';
    const isActive = vehicle.isActive ?? vehicle.active;
    
    if (isFaulty) {
      return (
        <div className="flex items-center gap-2">
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Niesprawny
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <CheckCircle className="h-3 w-3" />
          {isActive ? 'Aktywny' : 'Nieaktywny'}
        </span>
      </div>
    );
  };

  const getCardStyles = (vehicle) => {
    const isFaulty = vehicle.faultStatus === 'faulty';
    
    if (isFaulty) {
      return "flex flex-col w-full sm:w-[340px] bg-red-50 rounded-2xl shadow border-2 border-red-300 hover:border-red-400 transition-all p-6 relative";
    }
    
    return "flex flex-col w-full sm:w-[340px] bg-white rounded-2xl shadow border-2 border-blue-200 hover:border-blue-500 transition-all p-6 relative";
  };

  return (
  <div className="w-full flex justify-center">
    <div className="w-full max-w-7xl px-6 flex flex-wrap gap-6 mt-6 justify-center">
      {vehicles.length === 0 && (
        <div className="text-gray-500 text-center w-full py-8">Brak pojazdów</div>
      )}
      {vehicles.map(vehicle => {
        const isFaulty = vehicle.faultStatus === 'faulty';
        return (
          <Card className={`w-[340px] shadow-md hover:shadow-lg transition-shadow duration-200 ${isFaulty ? 'border-red-300 bg-red-50' : 'border-blue-200'}`}> 
            <CardHeader className="flex items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Truck className="h-7 w-7 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-blue-900 leading-tight">{vehicle.brand}</span>
                  <span className="text-base text-blue-900 leading-tight">{vehicle.registrationNumber}</span>
                </div>
              </div>
              {getStatusBadge(vehicle)}
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 mb-2 mt-1">
                <div className="flex gap-1 items-center">
                  <span className="font-semibold text-gray-700">TYP</span>
                  <span className="text-gray-700">{vehicle.vehicleType}</span>
                </div>
                <div className="flex gap-1 items-center">
                  <span className="font-semibold text-gray-700">PALIWO</span>
                  <span className="text-gray-700">{vehicle.fuelType || '-'}</span>
                </div>
              </div>
              <div className="text-gray-700 mb-2">
                <span className="font-semibold text-xs text-gray-400">POJEMNOŚĆ</span>
                <div className="text-xl font-bold text-blue-900">{vehicle.capacity || '-'}</div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-gray-600 text-sm">Status techniczny:</span>
                <Switch
                  checked={vehicle.faultStatus === 'operational'}
                  onChange={() => handleFaultToggle(vehicle)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => onEdit(vehicle)}>
                  <Edit2 className="h-4 w-4 mr-1" /> Edytuj
                </Button>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => onDelete(vehicle.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Usuń
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>

      {/* Fault Report Modal */}
      <FaultReportModal
        isOpen={faultModalOpen}
        onClose={() => {
          setFaultModalOpen(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        onSubmit={handleFaultReportSubmit}
        isLoading={isSubmitting}
      />
  </div>
);
};

export default VehicleList; 