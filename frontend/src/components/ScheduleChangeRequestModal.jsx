import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import authFetch from '../utils/authFetch';

const CHANGE_TYPE_LABELS = {
  SHIFT_CHANGE: 'Zmiana zmiany',
  SHIFT_REMOVAL: 'Usunięcie zmiany',
  ABSENCE: 'Przypisanie nieobecności',
  OTHER_EVENT: 'Inne zdarzenie'
};

const ScheduleChangeRequestModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  scheduleChangeRequest, 
  employees 
}) => {
  const [formData, setFormData] = useState({
    changeType: 'SHIFT_CHANGE',
    newShift: '',
    absenceTypeId: '',
    reason: '',
    description: ''
  });
  
  const [absenceTypes, setAbsenceTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load absence types
  useEffect(() => {
    if (isOpen) {
      loadAbsenceTypes();
    }
  }, [isOpen]);

  // Reset form when request changes
  useEffect(() => {
    if (scheduleChangeRequest) {
      setFormData({
        changeType: scheduleChangeRequest.changeType || 'SHIFT_CHANGE',
        newShift: '',
        absenceTypeId: '',
        reason: '',
        description: ''
      });
    }
  }, [scheduleChangeRequest]);

  const loadAbsenceTypes = async () => {
    try {
      const response = await authFetch('/api/absence-types');
      if (response.ok) {
        const data = await response.json();
        setAbsenceTypes(data);
      }
    } catch (error) {
      console.error('Error loading absence types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      changeType: 'SHIFT_CHANGE',
      newShift: '',
      absenceTypeId: '',
      reason: '',
      description: ''
    });
    onClose();
  };

  if (!scheduleChangeRequest) return null;

  const employee = employees.find(emp => emp.id === scheduleChangeRequest.employeeId);
  const requestDate = new Date(scheduleChangeRequest.date);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wniosek o zmianę grafiku</DialogTitle>
          <DialogDescription>
            Składanie wniosku o zmianę grafiku dla pracownika {employee?.surname} {employee?.name} 
            na dzień {format(requestDate, 'dd MMMM yyyy (EEEE)', { locale: pl })}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current shift info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Aktualne informacje</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Pracownik:</span>
                <p>{employee?.surname} {employee?.name}</p>
              </div>
              <div>
                <span className="font-medium">Data:</span>
                <p>{format(requestDate, 'dd.MM.yyyy', { locale: pl })}</p>
              </div>
              <div>
                <span className="font-medium">Obecna zmiana:</span>
                <p>{scheduleChangeRequest.currentShift || 'Brak przypisanej zmiany'}</p>
              </div>
            </div>
          </div>

          {/* Change type */}
          <div>
            <Label htmlFor="changeType">Typ zmiany *</Label>
            <Select
              value={formData.changeType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, changeType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANGE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New shift (for change type) */}
          {formData.changeType === 'SHIFT_CHANGE' && (
            <div>
              <Label htmlFor="newShift">Nowa zmiana</Label>
              <Input
                id="newShift"
                value={formData.newShift}
                onChange={(e) => setFormData(prev => ({ ...prev, newShift: e.target.value }))}
                placeholder="np. 14-22, 7:30-15:30"
              />
            </div>
          )}

          {/* Absence type (for absence) */}
          {formData.changeType === 'ABSENCE' && (
            <div>
              <Label htmlFor="absenceTypeId">Typ nieobecności</Label>
              <Select
                value={formData.absenceTypeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, absenceTypeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz typ nieobecności" />
                </SelectTrigger>
                <SelectContent>
                  {absenceTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Powód zmiany *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Opisz powód zmiany grafiku..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Dodatkowe informacje</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Dodatkowe uwagi lub szczegóły..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.reason.trim()}
            >
              {loading ? 'Składanie...' : 'Złóż wniosek'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleChangeRequestModal;