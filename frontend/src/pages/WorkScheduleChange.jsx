import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfMonth, endOfMonth, getDay, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';
import { UserContext } from '../UserContext';
import authFetch from '../utils/authFetch';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  AlertCircle,
  Send,
  Eye
} from 'lucide-react';

const shifts = [
  { id: "6-14", label: "Zmiana poranna", time: "6:00 - 14:00", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "7-15", label: "Zmiana poranna (7-15)", time: "7:00 - 15:00", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "14-22", label: "Zmiana popołudniowa", time: "14:00 - 22:00", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { id: "22-6", label: "Zmiana nocna", time: "22:00 - 6:00", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "NU", label: "NU", time: "Wg wymiaru pracy", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "D1", label: "D1", time: "6:00 - 14:00", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "D2", label: "D2", time: "14:00 - 22:00", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "D3", label: "D3", time: "22:00 - 6:00", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "CUSTOM", label: "Własne godziny", time: "Własne", color: "bg-green-100 text-green-800 border-green-200" }
];

const changeTypes = [
  { id: 'SHIFT_CHANGE', label: 'Zmiana zmiany', description: 'Zmień istniejącą zmianę' },
  { id: 'SHIFT_REMOVE', label: 'Usuń zmianę', description: 'Usuń zmianę z kalendarza' },
  { id: 'SHIFT_ADD', label: 'Dodaj zmianę', description: 'Dodaj nową zmianę' },
  { id: 'ABSENCE_ASSIGN', label: 'Przypisz nieobecność', description: 'Przypisz nieobecność (urlop, choroba, itp.)' }
];

export default function WorkScheduleChange() {
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();
  
  // State management
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changeFormData, setChangeFormData] = useState({
    changeType: '',
    newShift: '',
    customHours: '',
    absenceTypeId: '',
    reason: ''
  });
  const [showMyRequests, setShowMyRequests] = useState(false);

  // API queries
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', 'search', searchQuery],
    queryFn: async () => {
      const response = await authFetch(`/api/schedule-changes/employees/search?q=${searchQuery}`);
      return response.json();
    }
  });

  const { data: schedule = [], refetch: refetchSchedule } = useQuery({
    queryKey: ['employee-schedule', selectedEmployee?.id, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      const response = await authFetch(
        `/api/schedule-changes/employees/${selectedEmployee.id}/schedule/${format(currentMonth, 'yyyy-MM')}`
      );
      return response.json();
    },
    enabled: !!selectedEmployee
  });

  const { data: absenceTypes = [] } = useQuery({
    queryKey: ['absence-types'],
    queryFn: async () => {
      const response = await authFetch('/api/schedule-changes/absence-types');
      return response.json();
    }
  });

  const { data: scheduleChangeRequests = [] } = useQuery({
    queryKey: ['schedule-change-requests', showMyRequests ? user?.id : null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (showMyRequests && user?.id) {
        params.set('requestedById', user.id);
      }
      const response = await authFetch(`/api/schedule-changes/requests?${params}`);
      return response.json();
    }
  });

  // Mutations
  const submitRequestMutation = useMutation({
    mutationFn: async (requestData) => {
      const response = await authFetch('/api/schedule-changes/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) throw new Error('Failed to submit request');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Wniosek o zmianę harmonogramu został złożony');
      setIsChangeModalOpen(false);
      setSelectedDates([]);
      setChangeFormData({
        changeType: '',
        newShift: '',
        customHours: '',
        absenceTypeId: '',
        reason: ''
      });
      queryClient.invalidateQueries(['schedule-change-requests']);
    },
    onError: (error) => {
      toast.error('Błąd podczas składania wniosku: ' + error.message);
    }
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, managerNotes }) => {
      const response = await authFetch(`/api/schedule-changes/requests/${requestId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewedById: user.id,
          managerNotes
        })
      });
      if (!response.ok) throw new Error('Failed to review request');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Wniosek został rozpatrzony');
      queryClient.invalidateQueries(['schedule-change-requests']);
      if (selectedEmployee) {
        refetchSchedule();
      }
    },
    onError: (error) => {
      toast.error('Błąd podczas rozpatrywania wniosku: ' + error.message);
    }
  });

  // Calendar helpers
  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = [];
    
    // Add empty cells for days before month start
    const startDay = getDay(start);
    const emptyCells = startDay === 0 ? 6 : startDay - 1; // Adjust for Monday start
    for (let i = 0; i < emptyCells; i++) {
      days.push(null);
    }
    
    // Add days of the month
    let current = start;
    while (current <= end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    
    return days;
  };

  const getScheduleForDate = (date) => {
    if (!date || !schedule.length) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return schedule.find(s => s.date.startsWith(dateString));
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const dateString = format(date, 'yyyy-MM-dd');
    return selectedDates.includes(dateString);
  };

  const toggleDateSelection = (date) => {
    if (!date) return;
    const dateString = format(date, 'yyyy-MM-dd');
    setSelectedDates(prev => 
      prev.includes(dateString) 
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString]
    );
  };

  const handleSubmitRequest = () => {
    if (!selectedEmployee || selectedDates.length === 0 || !changeFormData.changeType) {
      toast.error('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    // Prepare original shifts data
    const originalShifts = {};
    const newShifts = {};
    
    selectedDates.forEach(dateString => {
      const date = new Date(dateString + 'T00:00:00');
      const existingSchedule = getScheduleForDate(date);
      
      if (existingSchedule) {
        originalShifts[dateString] = {
          shift: existingSchedule.shift,
          customHours: existingSchedule.customHours,
          colorCode: existingSchedule.colorCode
        };
      }
      
      if (['SHIFT_CHANGE', 'SHIFT_ADD'].includes(changeFormData.changeType)) {
        newShifts[dateString] = {
          shift: changeFormData.newShift,
          customHours: changeFormData.customHours,
          colorCode: shifts.find(s => s.id === changeFormData.newShift)?.color || ''
        };
      }
    });

    const requestData = {
      employeeId: selectedEmployee.id,
      requestedById: user.id,
      managerId: null, // Will be determined by backend
      affectedDates: selectedDates,
      changeType: changeFormData.changeType,
      originalShifts: Object.keys(originalShifts).length > 0 ? originalShifts : null,
      newShifts: Object.keys(newShifts).length > 0 ? newShifts : null,
      absenceTypeId: changeFormData.absenceTypeId ? parseInt(changeFormData.absenceTypeId) : null,
      reason: changeFormData.reason
    };

    submitRequestMutation.mutate(requestData);
  };

  const getShiftDisplay = (shiftData) => {
    if (!shiftData) return { label: 'Brak zmiany', color: 'bg-gray-100 text-gray-600' };
    
    const shift = shifts.find(s => s.id === shiftData.shift);
    if (shift) {
      return {
        label: shiftData.customHours || shift.label,
        color: shift.color
      };
    }
    
    return {
      label: shiftData.shift,
      color: 'bg-gray-100 text-gray-600'
    };
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canReviewRequests = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zmiany w harmonogramie pracy</h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj zmianami w harmonogramie pracowników
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showMyRequests ? "default" : "outline"}
            onClick={() => setShowMyRequests(!showMyRequests)}
          >
            {showMyRequests ? 'Wszystkie wnioski' : 'Moje wnioski'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Search & Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Wyszukaj pracownika
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Wprowadź imię lub nazwisko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {loadingEmployees ? (
                <p className="text-gray-500">Ładowanie...</p>
              ) : employees.length === 0 ? (
                <p className="text-gray-500">Brak wyników</p>
              ) : (
                employees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmployee?.id === employee.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="font-medium">
                      {employee.name} {employee.surname}
                    </div>
                    <div className="text-sm text-gray-600">
                      {employee.position}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Harmonogram - {format(currentMonth, 'LLLL yyyy', { locale: pl })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
                >
                  →
                </Button>
              </div>
            </CardTitle>
            {selectedEmployee && (
              <CardDescription>
                Harmonogram dla: {selectedEmployee.name} {selectedEmployee.surname}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!selectedEmployee ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Wybierz pracownika, aby wyświetlić harmonogram</p>
              </div>
            ) : (
              <div>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map(day => (
                    <div key={day} className="p-2 text-center font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => {
                    if (!day) {
                      return <div key={index} className="p-2"></div>;
                    }
                    
                    const scheduleData = getScheduleForDate(day);
                    const shiftDisplay = getShiftDisplay(scheduleData);
                    const isSelected = isDateSelected(day);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-100'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleDateSelection(day)}
                      >
                        <div className="text-sm font-medium">
                          {format(day, 'd')}
                        </div>
                        {scheduleData && (
                          <div className={`text-xs px-1 py-0.5 rounded mt-1 ${shiftDisplay.color}`}>
                            {scheduleData.customHours || scheduleData.shift}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Action Buttons */}
                {selectedDates.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    <Dialog open={isChangeModalOpen} onOpenChange={setIsChangeModalOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Edit className="w-4 h-4 mr-2" />
                          Zgłoś zmianę ({selectedDates.length} dni)
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Zgłoś zmianę harmonogramu</DialogTitle>
                          <DialogDescription>
                            Wybrane dni: {selectedDates.join(', ')}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Typ zmiany</Label>
                            <Select 
                              value={changeFormData.changeType} 
                              onValueChange={(value) => setChangeFormData(prev => ({ ...prev, changeType: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Wybierz typ zmiany" />
                              </SelectTrigger>
                              <SelectContent>
                                {changeTypes.map(type => (
                                  <SelectItem key={type.id} value={type.id}>
                                    <div>
                                      <div className="font-medium">{type.label}</div>
                                      <div className="text-xs text-gray-600">{type.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {['SHIFT_CHANGE', 'SHIFT_ADD'].includes(changeFormData.changeType) && (
                            <div>
                              <Label>Nowa zmiana</Label>
                              <Select 
                                value={changeFormData.newShift} 
                                onValueChange={(value) => setChangeFormData(prev => ({ ...prev, newShift: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Wybierz zmianę" />
                                </SelectTrigger>
                                <SelectContent>
                                  {shifts.map(shift => (
                                    <SelectItem key={shift.id} value={shift.id}>
                                      {shift.label} ({shift.time})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {changeFormData.newShift === 'CUSTOM' && (
                            <div>
                              <Label>Własne godziny</Label>
                              <Input
                                placeholder="np. 8:00-16:00"
                                value={changeFormData.customHours}
                                onChange={(e) => setChangeFormData(prev => ({ ...prev, customHours: e.target.value }))}
                              />
                            </div>
                          )}
                          
                          {changeFormData.changeType === 'ABSENCE_ASSIGN' && (
                            <div>
                              <Label>Typ nieobecności</Label>
                              <Select 
                                value={changeFormData.absenceTypeId} 
                                onValueChange={(value) => setChangeFormData(prev => ({ ...prev, absenceTypeId: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Wybierz typ nieobecności" />
                                </SelectTrigger>
                                <SelectContent>
                                  {absenceTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                      {type.name} {type.code && `(${type.code})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          <div>
                            <Label>Uzasadnienie</Label>
                            <Textarea
                              placeholder="Podaj powód zmiany..."
                              value={changeFormData.reason}
                              onChange={(e) => setChangeFormData(prev => ({ ...prev, reason: e.target.value }))}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleSubmitRequest}
                              disabled={submitRequestMutation.isPending}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {submitRequestMutation.isPending ? 'Składanie...' : 'Złóż wniosek'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsChangeModalOpen(false)}
                            >
                              Anuluj
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedDates([])}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Wyczyść zaznaczenie
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Change Requests */}
      <Card>
        <CardHeader>
          <CardTitle>
            {showMyRequests ? 'Moje wnioski o zmiany' : 'Wnioski o zmiany harmonogramu'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleChangeRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Brak wniosków o zmiany</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduleChangeRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        {request.employee.name} {request.employee.surname}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {changeTypes.find(t => t.id === request.changeType)?.label || request.changeType}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dni: {request.affectedDates.join(', ')}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  
                  {request.reason && (
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Uzasadnienie:</strong> {request.reason}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Złożono: {format(new Date(request.submittedAt), 'dd.MM.yyyy HH:mm')}
                    {request.autoApproved && ' (automatycznie zaakceptowane)'}
                  </div>
                  
                  {canReviewRequests && request.status === 'PENDING' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => reviewRequestMutation.mutate({ 
                          requestId: request.id, 
                          status: 'APPROVED',
                          managerNotes: 'Zaakceptowane przez menedżera'
                        })}
                        disabled={reviewRequestMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Zatwierdź
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewRequestMutation.mutate({ 
                          requestId: request.id, 
                          status: 'REJECTED',
                          managerNotes: 'Odrzucone przez menedżera'
                        })}
                        disabled={reviewRequestMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Odrzuć
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}