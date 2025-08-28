import React, { useState, useEffect, useContext } from 'react';
import { format, addDays, startOfMonth, endOfMonth, isToday, isSameMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import authFetch from '../utils/authFetch';
import { UserContext } from '../UserContext';
import { hasPermission } from '../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Calendar, Clock, Users, Plus, Check, X, Eye, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_LABELS = {
  PENDING: 'Oczekujące',
  APPROVED: 'Zatwierdzone',
  REJECTED: 'Odrzucone',
  AUTO_APPROVED: 'Auto-zatwierdzone'
};

const STATUS_VARIANTS = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
  AUTO_APPROVED: 'outline'
};

const CHANGE_TYPE_LABELS = {
  SHIFT_CHANGE: 'Zmiana zmiany',
  SHIFT_REMOVAL: 'Usunięcie zmiany',
  ABSENCE: 'Przypisanie nieobecności',
  OTHER_EVENT: 'Inne zdarzenie'
};

const ScheduleChanges = () => {
  const { user } = useContext(UserContext);
  const [scheduleChanges, setScheduleChanges] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [absenceTypes, setAbsenceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    employeeId: 'all',
    changeType: 'all'
  });

  // New request form
  const [newRequest, setNewRequest] = useState({
    employeeId: '',
    changeType: 'SHIFT_CHANGE',
    startDate: '',
    endDate: '',
    originalShift: '',
    newShift: '',
    absenceTypeId: '',
    reason: '',
    description: ''
  });

  const canCreateAll = hasPermission(user, 'scheduleChanges:create_all');
  const canApprove = hasPermission(user, 'scheduleChanges:approve');
  const canViewAll = hasPermission(user, 'scheduleChanges:read_all');

  useEffect(() => {
    loadData();
  }, [filters, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Build query parameters, excluding 'all' values
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });
      
      const [changesRes, employeesRes, absenceTypesRes] = await Promise.all([
        authFetch(`/api/schedule-changes?${queryParams.toString()}`),
        authFetch('/api/employees'),
        authFetch('/api/absence-types')
      ]);

      if (changesRes.ok) {
        const changesData = await changesRes.json();
        setScheduleChanges(changesData.data || changesData);
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
      }

      if (absenceTypesRes.ok) {
        const absenceTypesData = await absenceTypesRes.json();
        setAbsenceTypes(absenceTypesData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Błąd podczas wczytywania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!newRequest.employeeId || !newRequest.reason || !newRequest.startDate || !newRequest.endDate) {
      toast.error('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    try {
      const response = await authFetch('/api/schedule-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });

      if (response.ok) {
        toast.success('Wniosek o zmianę grafiku został złożony');
        setShowNewRequestModal(false);
        setNewRequest({
          employeeId: '',
          changeType: 'SHIFT_CHANGE',
          startDate: '',
          endDate: '',
          originalShift: '',
          newShift: '',
          absenceTypeId: '',
          reason: '',
          description: ''
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(`Błąd: ${error.error || 'Nie udało się złożyć wniosku'}`);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Błąd podczas składania wniosku');
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await authFetch(`/api/schedule-changes/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success('Wniosek został zatwierdzony');
        loadData();
      } else {
        const error = await response.json();
        toast.error(`Błąd: ${error.error || 'Nie udało się zatwierdzić wniosku'}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Błąd podczas zatwierdzania wniosku');
    }
  };

  const handleReject = async (id, reason) => {
    if (!reason) {
      toast.error('Proszę podać powód odrzucenia');
      return;
    }

    try {
      const response = await authFetch(`/api/schedule-changes/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast.success('Wniosek został odrzucony');
        loadData();
      } else {
        const error = await response.json();
        toast.error(`Błąd: ${error.error || 'Nie udało się odrzucić wniosku'}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Błąd podczas odrzucania wniosku');
    }
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'dd.MM.yyyy', { locale: pl });
    }
    
    return `${format(start, 'dd.MM.yyyy', { locale: pl })} - ${format(end, 'dd.MM.yyyy', { locale: pl })}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl font-bold">Zmiany grafiku pracy</CardTitle>
                  <CardDescription>
                    Zarządzaj wnioskami o zmiany w harmonogramie pracy pracowników
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => loadData()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Odśwież
                </Button>
                
                <Dialog open={showNewRequestModal} onOpenChange={setShowNewRequestModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nowy wniosek
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nowy wniosek o zmianę grafiku</DialogTitle>
                      <DialogDescription>
                        Wypełnij formularz, aby złożyć wniosek o zmianę harmonogramu pracy
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleCreateRequest} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="employeeId">Pracownik *</Label>
                          <Select
                            value={newRequest.employeeId}
                            onValueChange={(value) => setNewRequest(prev => ({ ...prev, employeeId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz pracownika" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees
                                .filter(emp => canCreateAll || emp.id === user.employeeId)
                                .map(employee => (
                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                  {employee.surname} {employee.name} - {employee.position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="changeType">Typ zmiany *</Label>
                          <Select
                            value={newRequest.changeType}
                            onValueChange={(value) => setNewRequest(prev => ({ ...prev, changeType: value }))}
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
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Data rozpoczęcia *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newRequest.startDate}
                            onChange={(e) => setNewRequest(prev => ({ ...prev, startDate: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="endDate">Data zakończenia *</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newRequest.endDate}
                            onChange={(e) => setNewRequest(prev => ({ ...prev, endDate: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      
                      {(newRequest.changeType === 'SHIFT_CHANGE' || newRequest.changeType === 'SHIFT_REMOVAL') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="originalShift">Oryginalna zmiana</Label>
                            <Input
                              id="originalShift"
                              value={newRequest.originalShift}
                              onChange={(e) => setNewRequest(prev => ({ ...prev, originalShift: e.target.value }))}
                              placeholder="np. 6-14"
                            />
                          </div>
                          
                          {newRequest.changeType === 'SHIFT_CHANGE' && (
                            <div>
                              <Label htmlFor="newShift">Nowa zmiana</Label>
                              <Input
                                id="newShift"
                                value={newRequest.newShift}
                                onChange={(e) => setNewRequest(prev => ({ ...prev, newShift: e.target.value }))}
                                placeholder="np. 14-22"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {newRequest.changeType === 'ABSENCE' && (
                        <div>
                          <Label htmlFor="absenceTypeId">Typ nieobecności</Label>
                          <Select
                            value={newRequest.absenceTypeId}
                            onValueChange={(value) => setNewRequest(prev => ({ ...prev, absenceTypeId: value }))}
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
                      
                      <div>
                        <Label htmlFor="reason">Powód zmiany *</Label>
                        <Textarea
                          id="reason"
                          value={newRequest.reason}
                          onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Opisz powód zmiany grafiku..."
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Dodatkowe informacje</Label>
                        <Textarea
                          id="description"
                          value={newRequest.description}
                          onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Dodatkowe uwagi lub szczegóły..."
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewRequestModal(false)}
                        >
                          Anuluj
                        </Button>
                        <Button type="submit">
                          Złóż wniosek
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wszystkie statusy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie statusy</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {canViewAll && (
                <div>
                  <Label>Pracownik</Label>
                  <Select
                    value={filters.employeeId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, employeeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszyscy pracownicy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszyscy pracownicy</SelectItem>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.surname} {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>Typ zmiany</Label>
                <Select
                  value={filters.changeType}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, changeType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wszystkie typy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie typy</SelectItem>
                    {Object.entries(CHANGE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Changes List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wnioski o zmiany grafiku</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Ładowanie...</span>
              </div>
            ) : scheduleChanges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Brak wniosków spełniających kryteria wyszukiwania
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleChanges.map((change) => (
                  <ScheduleChangeCard
                    key={change.id}
                    change={change}
                    canApprove={canApprove}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Schedule Change Card Component
const ScheduleChangeCard = ({ change, canApprove, onApprove, onReject }) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectSubmit = () => {
    onReject(change.id, rejectReason);
    setShowRejectDialog(false);
    setRejectReason('');
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">
              {change.employee.surname} {change.employee.name}
            </h3>
            <Badge variant="outline" className="text-xs">
              {change.employee.position}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Wnioskujący: {change.requestedBy.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANTS[change.status]}>
            {STATUS_LABELS[change.status]}
          </Badge>
          
          {canApprove && change.status === 'PENDING' && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApprove(change.id)}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              
              <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Odrzuć wniosek</DialogTitle>
                    <DialogDescription>
                      Podaj powód odrzucenia wniosku o zmianę grafiku
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Powód odrzucenia..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectDialog(false)}
                      >
                        Anuluj
                      </Button>
                      <Button
                        onClick={handleRejectSubmit}
                        disabled={!rejectReason.trim()}
                      >
                        Odrzuć wniosek
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="font-medium">Typ zmiany:</span>
          <p>{CHANGE_TYPE_LABELS[change.changeType]}</p>
        </div>
        
        <div>
          <span className="font-medium">Zakres dat:</span>
          <p>{formatDateRange(change.startDate, change.endDate)}</p>
        </div>
        
        {change.originalShift && (
          <div>
            <span className="font-medium">Oryginalna zmiana:</span>
            <p>{change.originalShift}</p>
          </div>
        )}
        
        {change.newShift && (
          <div>
            <span className="font-medium">Nowa zmiana:</span>
            <p>{change.newShift}</p>
          </div>
        )}
      </div>
      
      <div>
        <span className="font-medium text-sm">Powód:</span>
        <p className="text-sm text-muted-foreground mt-1">{change.reason}</p>
      </div>
      
      {change.description && (
        <div>
          <span className="font-medium text-sm">Dodatkowe informacje:</span>
          <p className="text-sm text-muted-foreground mt-1">{change.description}</p>
        </div>
      )}
      
      {change.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <span className="font-medium text-sm text-red-800">Powód odrzucenia:</span>
          <p className="text-sm text-red-700 mt-1">{change.rejectionReason}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
        <span>Utworzono: {format(new Date(change.createdAt), 'dd.MM.yyyy HH:mm', { locale: pl })}</span>
        {change.approvedAt && (
          <span>
            Zatwierdzono: {format(new Date(change.approvedAt), 'dd.MM.yyyy HH:mm', { locale: pl })}
            {change.approvedBy && ` przez ${change.approvedBy.name}`}
          </span>
        )}
      </div>
    </div>
  );
};

const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return format(start, 'dd.MM.yyyy', { locale: pl });
  }
  
  return `${format(start, 'dd.MM.yyyy', { locale: pl })} - ${format(end, 'dd.MM.yyyy', { locale: pl })}`;
};

export default ScheduleChanges;