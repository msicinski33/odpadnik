import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Edit, Trash2, Check, X, User, CalendarDays, TrendingUp, AlertCircle, Clock, MapPin, Phone, Filter, Download, FileText, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import YearlyLeaveGridModal from '../components/YearlyLeaveGridModal';
import authFetch from '../utils/authFetch';
import { toast } from 'sonner';

// Constants
const MONTHS = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
];

const LEAVE_TYPE_LABELS = {
  ANNUAL_LEAVE: 'Wypoczynek roczny',
  SICK_LEAVE: 'Zwolnienie lekarskie',
  UNPAID_LEAVE: 'Urlop bezpłatny',
  MATERNITY_LEAVE: 'Urlop macierzyński',
  PATERNITY_LEAVE: 'Urlop ojcowski',
  OTHER: 'Inne'
};

const LEAVE_TYPE_VARIANTS = {
  ANNUAL_LEAVE: 'default',
  SICK_LEAVE: 'destructive',
  UNPAID_LEAVE: 'secondary',
  MATERNITY_LEAVE: 'outline',
  PATERNITY_LEAVE: 'outline',
  OTHER: 'secondary'
};

const STATUS_VARIANTS = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
  CANCELLED: 'outline'
};

const STATUS_LABELS = {
  PENDING: 'Oczekujące',
  APPROVED: 'Zatwierdzone',
  REJECTED: 'Odrzucone',
  CANCELLED: 'Anulowane'
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, variant = 'default' }) => (
  <Card className="border-border/50">
    <CardContent className="flex items-center p-4">
      <div className={`p-2 rounded-lg mr-3 ${
        variant === 'success' ? 'bg-green-100 text-green-600' :
        variant === 'warning' ? 'bg-yellow-100 text-yellow-600' :
        variant === 'info' ? 'bg-blue-100 text-blue-600' :
        'bg-muted text-muted-foreground'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const LeavePlanning = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const [showYearlyGridModal, setShowYearlyGridModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'ANNUAL_LEAVE',
    notes: ''
  });
  const [planForm, setPlanForm] = useState({
    carriedOver: 0,
    notes: ''
  });

  const [yearlyGridForm, setYearlyGridForm] = useState({
    carriedOver: 0,
    notes: '',
    selectedDates: []
  });



  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await authFetch('/api/employees');
      if (!res.ok) throw new Error('Błąd pobierania pracowników');
      return res.json();
    }
  });

  // Fetch leave plans for selected year
  const { data: leavePlans = [], isLoading: loadingPlans, error: leavePlansError } = useQuery({
    queryKey: ['leave-plans', selectedYear],
    queryFn: async () => {
      const res = await authFetch(`/api/leave-planning/year/${selectedYear}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Brak uprawnień do przeglądania planów urlopów');
        }
        throw new Error('Błąd pobierania planów urlopów');
      }
      return res.json();
    }
  });

  // Fetch leave statistics
  const { data: statistics, error: statisticsError } = useQuery({
    queryKey: ['leave-statistics', selectedYear],
    queryFn: async () => {
      const res = await authFetch(`/api/leave-planning/statistics/${selectedYear}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Brak uprawnień do przeglądania statystyk urlopów');
        }
        throw new Error('Błąd pobierania statystyk');
      }
      return res.json();
    }
  });

  // Get unique positions and departments for filtering
  const uniquePositions = [...new Set(employees.map(emp => emp.position))].sort();
  const uniqueDepartments = [...new Set(employees.map(emp => emp.department || 'Brak działu'))].sort();

  // Filter employees by position and department
  const filteredEmployees = employees.filter(emp => {
    const positionMatch = !selectedPosition || selectedPosition === 'all' || emp.position === selectedPosition;
    const departmentMatch = !selectedDepartment || selectedDepartment === 'all' || (emp.department || 'Brak działu') === selectedDepartment;
    return positionMatch && departmentMatch;
  }).sort((a, b) => {
    // Sort alphabetically by surname, then by name
    if (a.surname !== b.surname) {
      return a.surname.localeCompare(b.surname, 'pl');
    }
    return a.name.localeCompare(b.name, 'pl');
  });

  // Calculate leave statistics for each employee
  const employeeStats = filteredEmployees.map(emp => {
    const plan = leavePlans.find(p => p.employee.id === emp.id);
    const baseEntitlement = emp.vacationDays || 26;
    const carriedOver = plan?.carriedOver || 0;
    const totalEntitlement = baseEntitlement + carriedOver;
    

    
    const usedDays = plan?.leaveEntries ? plan.leaveEntries.reduce((total, entry) => {
      // Count all leave entries (pending, approved, etc.) as they all consume leave days
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      

      
      return total + days;
    }, 0) : 0;
    
    const remainingDays = totalEntitlement - usedDays;
    

    
    return {
      ...emp,
      plan,
      totalEntitlement,
      usedDays,
      remainingDays,
      carriedOver
    };
  });

  // Mutations
  const createLeaveEntryMutation = useMutation({
    mutationFn: async (entryData) => {
      const response = await authFetch('/api/leave-planning/leave-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd tworzenia wpisu urlopu');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries(['leave-plans', selectedYear]);
      queryClient.invalidateQueries(['leave-statistics', selectedYear]);
      queryClient.invalidateQueries(['employees']);
      
      toast.success('Wpis urlopu utworzony pomyślnie');
      setShowLeaveModal(false);
      setLeaveForm({
        startDate: '',
        endDate: '',
        leaveType: 'ANNUAL_LEAVE',
        notes: ''
      });
      setEditingLeave(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Błąd podczas tworzenia wpisu urlopu');
    }
  });

  const updateLeaveEntryMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await authFetch(`/api/leave-planning/leave-entry/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd aktualizacji wpisu urlopu');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries(['leave-plans', selectedYear]);
      queryClient.invalidateQueries(['leave-statistics', selectedYear]);
      queryClient.invalidateQueries(['employees']);
      
      toast.success('Wpis urlopu zaktualizowany pomyślnie');
      setShowLeaveModal(false);
      setLeaveForm({
        startDate: '',
        endDate: '',
        leaveType: 'ANNUAL_LEAVE',
        notes: ''
      });
      setEditingLeave(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Błąd podczas aktualizacji wpisu urlopu');
    }
  });

  const deleteLeaveEntryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await authFetch(`/api/leave-planning/leave-entry/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd usuwania wpisu urlopu');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries(['leave-plans', selectedYear]);
      queryClient.invalidateQueries(['leave-statistics', selectedYear]);
      queryClient.invalidateQueries(['employees']);
      
      toast.success('Wpis urlopu usunięty pomyślnie');
    },
    onError: (error) => {
      toast.error(error.message || 'Błąd podczas usuwania wpisu urlopu');
    }
  });

  const createLeavePlanMutation = useMutation({
    mutationFn: async (planData) => {
      const response = await authFetch(`/api/leave-planning/employee/${planData.employeeId}/year/${planData.year}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd tworzenia planu urlopu');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries(['leave-plans', selectedYear]);
      queryClient.invalidateQueries(['leave-statistics', selectedYear]);
      queryClient.invalidateQueries(['employees']);
      
      toast.success('Plan urlopu utworzony pomyślnie');
      setShowPlanModal(false);
      setPlanForm({
        carriedOver: 0,
        notes: ''
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Błąd podczas tworzenia planu urlopu');
    }
  });

  const updateLeavePlanMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await authFetch(`/api/leave-planning/employee/${data.employeeId}/year/${data.year}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd aktualizacji planu urlopu');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries(['leave-plans', selectedYear]);
      queryClient.invalidateQueries(['leave-statistics', selectedYear]);
      queryClient.invalidateQueries(['employees']);
      
      toast.success('Plan urlopu zaktualizowany pomyślnie');
      setShowPlanModal(false);
      setPlanForm({
        carriedOver: 0,
        notes: ''
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Błąd podczas aktualizacji planu urlopu');
    }
  });



  // Handlers
  const handleSubmitLeave = async () => {
    if (!selectedEmployee) return;
    
    const entryData = {
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      leaveType: leaveForm.leaveType,
      notes: leaveForm.notes
    };

    if (editingLeave) {
      await updateLeaveEntryMutation.mutateAsync({ id: editingLeave.id, ...entryData });
    } else {
      // Check if employee has a leave plan for the year
      let plan = leavePlans.find(p => p.employee.id === selectedEmployee.id);
      
      if (!plan) {
        // Create a basic plan first
        const planData = {
          employeeId: selectedEmployee.id,
          year: selectedYear,
          carriedOver: 0,
          notes: ''
        };
        
        const createdPlan = await createLeavePlanMutation.mutateAsync(planData);
        plan = createdPlan;
      }
      
      // Use the returned plan data to get the leavePlanId
      entryData.leavePlanId = plan.id;
      await createLeaveEntryMutation.mutateAsync(entryData);
    }
  };

  const handleSubmitPlan = async () => {
    if (!selectedEmployee) return;
    
    const planData = {
      employeeId: selectedEmployee.id,
      year: selectedYear,
      carriedOver: planForm.carriedOver,
      notes: planForm.notes
    };

    const existingPlan = leavePlans.find(p => p.employee.id === selectedEmployee.id);
    
    if (existingPlan) {
      await updateLeavePlanMutation.mutateAsync({ id: existingPlan.id, ...planData });
    } else {
      await createLeavePlanMutation.mutateAsync(planData);
    }
  };



  const handleEditLeave = (leave) => {
    setEditingLeave(leave);
    setLeaveForm({
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveType: leave.leaveType,
      notes: leave.notes || ''
    });
    setShowLeaveModal(true);
  };

  const handleDeleteLeave = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wpis urlopu?')) {
      await deleteLeaveEntryMutation.mutateAsync(id);
    }
  };

  const handleApproveLeave = async (id) => {
    if (window.confirm('Czy na pewno chcesz zatwierdzić ten wpis urlopu?')) {
      await updateLeaveEntryMutation.mutateAsync({ 
        id, 
        status: 'APPROVED' 
      });
    }
  };

  const handleExportExcel = () => {
    if (leavePlansError) {
      toast.error('Brak uprawnień do eksportu planów urlopów');
      return;
    }
    
    // TODO: Implement Excel export
    toast.info('Eksport do Excel - funkcja w trakcie implementacji');
  };

  const handleExportPDF = async () => {
    // Check if user has access to leave planning data
    if (leavePlansError) {
      toast.error('Brak uprawnień do eksportu planów urlopów');
      return;
    }
    
    setIsExportingPDF(true);
    try {
      // Import ReactDOMServer dynamically to avoid SSR issues
      const ReactDOMServer = await import('react-dom/server');
      
      // Import the PDF component dynamically
      const LeavePlanningPdf = (await import('../components/LeavePlanningPdf')).default;
      
      // Debug: Log the data being passed to PDF
      console.log('PDF Export - Employees:', filteredEmployees);
      console.log('PDF Export - Leave Plans:', leavePlans);
      console.log('PDF Export - Year:', selectedYear);
      
      // Generate HTML using the PDF component
      const htmlContent = ReactDOMServer.renderToString(
        React.createElement(LeavePlanningPdf, {
          employees: filteredEmployees,
          leavePlans: leavePlans || [],
          year: selectedYear,
          userName: 'Użytkownik', // You can get this from user context if available
          selectedPositions: selectedPosition && selectedPosition !== 'all' ? [selectedPosition] : [],
          selectedDepartments: selectedDepartment && selectedDepartment !== 'all' ? [selectedDepartment] : []
        })
      );
      
      // Create complete HTML document
      const fullHtml = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Plan urlopów PDF</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 24px; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `;

      const response = await authFetch('/api/pdf/leave-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: fullHtml,
          fileName: `plan-urlopow_${selectedYear}.pdf`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plan-urlopow_${selectedYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF wygenerowany pomyślnie.");
      } else {
        throw new Error('Błąd generowania PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Błąd podczas generowania PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSubmitYearlyGrid = async (data) => {
    try {
      const existingPlan = leavePlans.find(p => p.employee.id === selectedEmployee.id);
      
      if (existingPlan) {
        await updateLeavePlanMutation.mutateAsync({
          id: existingPlan.id,
          carriedOver: data.carriedOver,
          notes: data.notes
        });
      } else {
        await createLeavePlanMutation.mutateAsync({
          employeeId: selectedEmployee.id,
          year: selectedYear,
          carriedOver: data.carriedOver,
          notes: data.notes
        });
      }
      
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries(['leave-plans', selectedYear]);
      queryClient.invalidateQueries(['leave-statistics', selectedYear]);
      queryClient.invalidateQueries(['employees']);
      
      // TODO: Handle leave entries from the grid
      toast.success('Plan urlopu zaktualizowany pomyślnie');
      setShowYearlyGridModal(false);
    } catch (error) {
      toast.error('Błąd podczas aktualizacji planu urlopu');
    }
  };

  return (
    <div className="h-screen bg-background p-4 overflow-hidden">
      <div className="h-full flex flex-col space-y-4">
        {/* Header */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Planowanie Urlopów</CardTitle>
                <p className="text-muted-foreground">Zarządzanie harmonogramem urlopów pracowników</p>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!leavePlansError && (
                  <>
                    <Select value={selectedPosition || 'all'} onValueChange={setSelectedPosition}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Wszystkie stanowiska" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Wszystkie stanowiska</SelectItem>
                        {uniquePositions.map(position => (
                          <SelectItem key={position} value={position}>{position}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedDepartment || 'all'} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Wszystkie działy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Wszystkie działy</SelectItem>
                        {uniqueDepartments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                {!leavePlansError && (
                  <>
                    <Button onClick={() => setShowPlanModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Dodaj Plan
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={handleExportExcel}>
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleExportPDF}
                        disabled={isExportingPDF}
                      >
                        {isExportingPDF ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 mr-2 border-2 border-primary border-t-transparent"></div>
                            Generowanie...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Access Denied Message */}
          {(leavePlansError || statisticsError) && (
            <CardContent className="pt-0">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <h3 className="font-semibold text-destructive">Brak uprawnień</h3>
                    <p className="text-sm text-destructive/80">
                      Nie masz uprawnień do przeglądania planów urlopów. Skontaktuj się z administratorem, aby uzyskać dostęp.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}

          {/* Statistics */}
          {!leavePlansError && !statisticsError && statistics && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  icon={User}
                  label="Pracownicy"
                  value={filteredEmployees.length}
                  variant="info"
                />
                <StatCard
                  icon={CalendarDays}
                  label="Plany utworzone"
                  value={leavePlans.length}
                  variant="success"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Średnie dni urlopu"
                  value={statistics.averageLeaveDays?.toFixed(1) || '0'}
                  variant="warning"
                />
                <StatCard
                  icon={Clock}
                  label="Oczekujące wnioski"
                  value={statistics.pendingRequests || 0}
                  variant="info"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex space-x-4">
            {/* Employee List */}
            <div className="w-1/3 bg-background border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold">Lista Pracowników</h3>
                <p className="text-sm text-muted-foreground">
                  {filteredEmployees.length} pracowników
                </p>
              </div>
              <div className="overflow-y-auto h-full">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedEmployee?.id === employee.id ? 'bg-muted border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.surname} {employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                          {employee.department && (
                            <p className="text-xs text-muted-foreground">{employee.department}</p>
                          )}
                        </div>
                      </div>
                                             <div className="text-right">
                         <p className="text-sm font-medium">{employee.vacationDays || 26} dni</p>
                         {employeeStats.find(stat => stat.id === employee.id) && (
                           <p className="text-xs text-muted-foreground">
                             Pozostało: {employeeStats.find(stat => stat.id === employee.id)?.remainingDays || 0}
                           </p>
                         )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Employee Details */}
            <div className="flex-1 bg-background border border-border rounded-lg overflow-hidden">
              {selectedEmployee ? (
                <div className="h-full flex flex-col">
                  {/* Employee Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">
                            {selectedEmployee.surname} {selectedEmployee.name}
                          </h3>
                          <p className="text-muted-foreground">{selectedEmployee.position}</p>
                          {selectedEmployee.department && (
                            <p className="text-sm text-muted-foreground">{selectedEmployee.department}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowYearlyGridModal(true)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Harmonogram roczny
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPlanModal(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edytuj plan
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowLeaveModal(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Dodaj urlop
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Employee Stats */}
                  <div className="p-4 border-b border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {employeeStats.find(stat => stat.id === selectedEmployee.id)?.totalEntitlement || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Dni przysługujące</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {employeeStats.find(stat => stat.id === selectedEmployee.id)?.usedDays || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Dni wykorzystane</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {employeeStats.find(stat => stat.id === selectedEmployee.id)?.remainingDays || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Dni pozostałe</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {employeeStats.find(stat => stat.id === selectedEmployee.id)?.carriedOver || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Przeniesione</p>
                      </div>
                    </div>
                  </div>

                  {/* Leave Entries */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">Wpisy urlopowe</h4>
                        <Button
                          size="sm"
                          onClick={() => setShowLeaveModal(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Dodaj urlop
                        </Button>
                      </div>
                      
                      {employeeStats.find(stat => stat.id === selectedEmployee.id)?.plan?.leaveEntries?.length > 0 ? (
                        <div className="space-y-3">
                          {employeeStats.find(stat => stat.id === selectedEmployee.id)?.plan?.leaveEntries
                            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                            .map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                                             <div className="flex items-center space-x-3">
                                 <div className={`w-3 h-3 rounded-full ${
                                   entry.status === 'APPROVED' ? 'bg-green-500' :
                                   entry.status === 'PENDING' ? 'bg-yellow-500' :
                                   entry.status === 'REJECTED' ? 'bg-red-500' :
                                   'bg-gray-500'
                                 }`} />
                                 <div>
                                   <p className="font-medium">
                                     {new Date(entry.startDate).toLocaleDateString('pl-PL')} - {new Date(entry.endDate).toLocaleDateString('pl-PL')}
                                   </p>
                                   <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                     <span>{LEAVE_TYPE_LABELS[entry.leaveType]}</span>
                                     <span>•</span>
                                     <span className="font-medium text-primary">
                                       {(() => {
                                         const start = new Date(entry.startDate);
                                         const end = new Date(entry.endDate);
                                         const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                                         return `${days} ${days === 1 ? 'dzień' : days < 5 ? 'dni' : 'dni'}`;
                                       })()}
                                     </span>
                                     {entry.notes && (
                                       <>
                                         <span>•</span>
                                         <span>{entry.notes}</span>
                                       </>
                                     )}
                                   </div>
                                 </div>
                               </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={STATUS_VARIANTS[entry.status]}>
                                  {STATUS_LABELS[entry.status]}
                                </Badge>
                                                                                                   <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditLeave(entry)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    {entry.status === 'PENDING' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleApproveLeave(entry.id)}
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteLeave(entry.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Brak wpisów urlopowych</p>
                          <p className="text-sm">Kliknij "Dodaj urlop" aby utworzyć pierwszy wpis</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Wybierz pracownika z listy</p>
                    <p className="text-sm">aby zobaczyć szczegóły i zarządzać urlopami</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Entry Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLeave ? 'Edytuj wpis urlopu' : 'Dodaj nowy wpis urlopu'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data rozpoczęcia</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data zakończenia</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="leaveType">Rodzaj urlopu</Label>
              <Select value={leaveForm.leaveType} onValueChange={(value) => setLeaveForm({ ...leaveForm, leaveType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="leaveNotes">Uwagi</Label>
              <Textarea
                id="leaveNotes"
                value={leaveForm.notes}
                onChange={(e) => setLeaveForm({ ...leaveForm, notes: e.target.value })}
                placeholder="Dodatkowe informacje..."
                rows={3}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowLeaveModal(false)} className="flex-1">
                Anuluj
              </Button>
              <Button 
                onClick={handleSubmitLeave}
                disabled={!selectedEmployee || !leaveForm.startDate || !leaveForm.endDate}
                className="flex-1"
              >
                {editingLeave ? 'Zaktualizuj' : 'Dodaj'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {leavePlans.find(p => p.employee.id === selectedEmployee?.id) ? 'Edytuj plan urlopu' : 'Utwórz plan urlopu'} - {selectedEmployee?.surname} {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="carriedOver">Dni przeniesione z poprzedniego roku</Label>
              <Input
                id="carriedOver"
                type="number"
                min="0"
                max="26"
                value={planForm.carriedOver}
                onChange={(e) => setPlanForm({ ...planForm, carriedOver: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="planNotes">Uwagi</Label>
              <Textarea
                id="planNotes"
                value={planForm.notes}
                onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                placeholder="Dodatkowe informacje..."
                rows={3}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowPlanModal(false)} className="flex-1">
                Anuluj
              </Button>
              <Button 
                onClick={handleSubmitPlan}
                disabled={!selectedEmployee}
                className="flex-1"
              >
                Zapisz plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Yearly Grid Modal */}
      <YearlyLeaveGridModal
        isOpen={showYearlyGridModal}
        onClose={() => setShowYearlyGridModal(false)}
        employee={selectedEmployee}
        year={selectedYear}
        initialData={yearlyGridForm}
        onSubmit={handleSubmitYearlyGrid}
        existingLeaveEntries={leavePlans.find(p => p.employee.id === selectedEmployee?.id)?.leaveEntries || []}
        isEditing={yearlyGridForm.selectedDates.length > 0}
      />
    </div>
  );
};

export default LeavePlanning;

