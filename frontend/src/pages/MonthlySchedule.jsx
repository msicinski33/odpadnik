import { useState, useEffect } from "react";
import authFetch from "../utils/authFetch";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "../components/ui/button";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Calendar, Clock, Users, Save, Trash2, Plus, Info } from "lucide-react";
import { pl } from "date-fns/locale";
import { toast } from "sonner";

const shifts = [
  { id: "6-14", label: "Zmiana poranna", time: "6:00 - 14:00", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "14-22", label: "Zmiana popołudniowa", time: "14:00 - 22:00", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { id: "22-6", label: "Zmiana nocna", time: "22:00 - 6:00", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "NU", label: "Nieobecność", time: "Wolne", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "D1", label: "D1", time: "6:00 - 14:00", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "D2", label: "D2", time: "14:00 - 22:00", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "D3", label: "D3", time: "22:00 - 6:00", color: "bg-red-100 text-red-800 border-red-200" },
  { id: "CUSTOM", label: "Własne godziny", time: "Własne", color: "bg-green-100 text-green-800 border-green-200" }
];

export default function MonthlySchedule(props) {
  const { modalContainer } = props || {};
  const [month, setMonth] = useState(new Date(2025, 6));
  const [allEmployees, setAllEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [position, setPosition] = useState("ALL");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [bulkAssignModal, setBulkAssignModal] = useState({ open: false, employee: null });
  const [modalData, setModalData] = useState({ empId: null, start: "", end: "", shift: "6-14" });
  const [customModalShift, setCustomModalShift] = useState("");
  const [selectedLegendShift, setSelectedLegendShift] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragState, setDragState] = useState({
    isDragging: false,
    empId: null,
    startIdx: null,
    endIdx: null,
  });

  // Tabela wymiaru czasu pracy na 2025 rok (można rozszerzyć na inne lata)
  const requiredHours2025 = {
    0: 168, // Styczeń
    1: 160, // Luty
    2: 168, // Marzec
    3: 168, // Kwiecień
    4: 160, // Maj
    5: 160, // Czerwiec
    6: 184, // Lipiec
    7: 160, // Sierpień
    8: 176, // Wrzesień
    9: 184, // Październik
    10: 144, // Listopad
    11: 160, // Grudzień
  };

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [mismatchedEmployees, setMismatchedEmployees] = useState([]);
  const [pendingSave, setPendingSave] = useState(false);

  // Funkcja do obliczania godzin dla pracownika
  function getEmployeeHours(empId) {
    const days = Object.keys(schedule[empId] || {});
    let total = 0;
    days.forEach(day => {
      const shift = schedule[empId][day];
      if (["6-14", "14-22", "22-6", "CUSTOM"].includes(shift)) {
        total += 8;
      }
      // D1, D2, D3, NU = 0h (nieobecność)
    });
    return total;
  }

  // Zmodyfikowana funkcja zapisu
  const handleSave = async () => {
    const monthIdx = month.getMonth();
    const required = requiredHours2025[monthIdx];
    const mismatches = employees.filter(emp => getEmployeeHours(emp.id) !== required);
    if (mismatches.length > 0) {
      setMismatchedEmployees(mismatches);
      setShowWarningModal(true);
      setPendingSave(true);
      return;
    }
    await doSave();
  };

  // Funkcja do faktycznego zapisu
  const doSave = async () => {
    setIsLoading(true);
    try {
      await Promise.all(Object.entries(schedule).map(async ([empId, daysMap]) => {
        const shiftsArr = Object.entries(daysMap).map(([date, shift]) => ({ date, shift }));
        await authFetch(`/api/employees/${empId}/schedule`, {
          method: "POST",
          body: JSON.stringify({ shifts: shiftsArr }),
          headers: { "Content-Type": "application/json" },
        });
      }));
      toast.success("Grafik zapisany pomyślnie.");
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Błąd podczas zapisywania grafiku. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
      setShowWarningModal(false);
      setPendingSave(false);
    }
  };

  // Potwierdzenie w modalu
  const handleConfirmSave = async () => {
    await doSave();
  };

  // Fetch all employees and their schedules for the selected month
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all employees
        const resEmp = await authFetch("/api/employees");
        const allEmps = await resEmp.json();
        setAllEmployees(allEmps);
        
        // Filter by position on frontend
        const filtered = allEmps
          .filter(e => position === 'ALL' || (e.position && e.position.toLowerCase() === position.toLowerCase()))
          .sort((a, b) => {
            const sA = (a.surname || '').localeCompare(b.surname || '', 'pl');
            if (sA !== 0) return sA;
            return (a.name || '').localeCompare(b.name || '', 'pl');
          });
        setEmployees(filtered);
        
        // Fetch schedules for each employee
        const scheduleObj = {};
        await Promise.all(filtered.map(async (emp) => {
          const resSched = await authFetch(`/api/employees/${emp.id}/schedule?month=${format(month, "yyyy-MM")}`);
          const empSchedule = await resSched.json();
          scheduleObj[emp.id] = {};
          empSchedule.forEach(s => {
            scheduleObj[emp.id][format(new Date(s.date), "yyyy-MM-dd")] = s.shift;
          });
        }));
        setSchedule(scheduleObj);
        setSelectedEmployeeId(null);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [month, position]);

  const days = [];
  let current = startOfMonth(month);
  const end = endOfMonth(month);
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }

  const updateShift = (employeeId, dateStr, shift) => {
    setSchedule((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [dateStr]: shift,
      },
    }));
  };

  const handleCellClick = (emp, dateStr, shift) => {
    if (!selectedLegendShift) return;
    if (selectedLegendShift === 'DELETE') {
      updateShift(emp.id, dateStr, undefined);
      return;
    }
    if (selectedLegendShift === "CUSTOM") {
      const custom = window.prompt("Wprowadź własne godziny (np. 5-13):");
      if (custom && custom.trim()) {
        updateShift(emp.id, dateStr, custom.trim());
      }
      return;
    }
    updateShift(emp.id, dateStr, selectedLegendShift);
  };

  const handleCellMouseDown = (empId, dayIdx) => {
    if (!selectedLegendShift) return;
    setDragState({ isDragging: true, empId, startIdx: dayIdx, endIdx: dayIdx });
  };

  const handleCellMouseEnter = (empId, dayIdx) => {
    if (!dragState.isDragging || dragState.empId !== empId) return;
    setDragState((prev) => ({ ...prev, endIdx: dayIdx }));
  };

  const handleCellMouseUp = (empId, dayIdx) => {
    if (!dragState.isDragging || dragState.empId !== empId) return;
    const { startIdx, endIdx } = dragState;
    let from = Math.min(startIdx, endIdx);
    let to = Math.max(startIdx, endIdx);
    let shiftValue = selectedLegendShift;
    if (shiftValue === "CUSTOM") {
      const custom = window.prompt("Wprowadź własne godziny (np. 5-13):");
      if (!custom || !custom.trim()) {
        setDragState({ isDragging: false, empId: null, startIdx: null, endIdx: null });
        return;
      }
      shiftValue = custom.trim();
    }
    if (shiftValue === 'DELETE') shiftValue = undefined;
    applyShiftRange(empId, from, to, shiftValue);
    setDragState({ isDragging: false, empId: null, startIdx: null, endIdx: null });
  };

  const handleTableMouseLeave = () => {
    if (dragState.isDragging) {
      setDragState({ isDragging: false, empId: null, startIdx: null, endIdx: null });
    }
  };

  const getShiftBadge = (shift) => {
    const shiftConfig = shifts.find(s => s.id === shift);
    if (shiftConfig) {
      return (
        <Badge
          variant="outline"
          className={`${shiftConfig.color} text-xs font-medium lg:text-[10px] lg:px-1 lg:py-0.5 lg:max-w-[48px] lg:whitespace-nowrap lg:overflow-hidden lg:text-ellipsis lg:flex lg:justify-center`}
        >
          {shift}
        </Badge>
      );
    }
    if (shift && !shifts.some(s => s.id === shift)) {
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 border-gray-200 text-xs font-medium lg:text-[10px] lg:px-1 lg:py-0.5 lg:max-w-[48px] lg:whitespace-nowrap lg:overflow-hidden lg:text-ellipsis lg:flex lg:justify-center"
        >
          {shift}
        </Badge>
      );
    }
    return null;
  };

  const applyShiftRange = (employeeId, startIdx, endIdx, shift) => {
    const newData = { ...schedule[employeeId] };
    for (let i = startIdx; i <= endIdx; i++) {
      const dateStr = format(days[i], "yyyy-MM-dd");
      newData[dateStr] = shift;
    }
    setSchedule((prev) => ({
      ...prev,
      [employeeId]: newData,
    }));
  };

  const filteredEmployees = selectedEmployeeId
    ? employees.filter((emp) => emp.id === selectedEmployeeId)
    : employees;

  const openBulkAssignModal = (employee) => {
    setBulkAssignModal({ open: true, employee });
    setModalData({ empId: employee.id, start: "", end: "", shift: "6-14" });
    setCustomModalShift("");
  };

  const applyModalRange = () => {
    const empId = modalData.empId;
    const startIdx = days.findIndex((d) => format(d, "yyyy-MM-dd") === modalData.start);
    const endIdx = days.findIndex((d) => format(d, "yyyy-MM-dd") === modalData.end);
    let shiftValue = modalData.shift;
    if (shiftValue === "CUSTOM") shiftValue = customModalShift.trim() || "6-14";
    if (startIdx >= 0 && endIdx >= startIdx) {
      applyShiftRange(empId, startIdx, endIdx, shiftValue);
      setBulkAssignModal({ open: false, employee: null });
      setCustomModalShift("");
    } else {
      toast.error("Nieprawidłowy zakres dat.");
    }
  };

  // Compute unique positions from all employees
  const allPositions = Array.from(new Set((allEmployees.length ? allEmployees : []).map(e => e.position).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pl'));
  const TABS = [{ key: 'ALL', label: 'Wszyscy pracownicy' }, ...allPositions.map(pos => ({ key: pos, label: pos }))];
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    setPosition(activeTab);
  }, [activeTab]);

  // Add Polish day abbreviations
  const polishDayShort = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-bold">Grafik miesięczny</CardTitle>
                <CardDescription>
                  Zarządzaj grafikiem pracy pracowników. Kliknij na komórki, aby przypisać zmianę, użyj masowego przypisania dla wielu dni.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Month Selector */}
              <div className="space-y-2">
                <Label htmlFor="month-selector" className="text-sm font-medium">Wybierz miesiąc</Label>
                <Input
                  id="month-selector"
                  type="month"
                  value={month ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}` : ''}
                  onChange={e => {
                    const [y, m] = e.target.value.split('-');
                    setMonth(new Date(Number(y), Number(m) - 1));
                  }}
                  className="w-40"
                />
              </div>

              {/* Employee Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filtruj po pracowniku</Label>
                <Select
                  value={selectedEmployeeId !== null ? selectedEmployeeId.toString() : "ALL"}
                  onValueChange={(val) => setSelectedEmployeeId(val === "ALL" ? null : parseInt(val))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Wszyscy pracownicy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Wszyscy pracownicy</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.surname} {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              <Button onClick={handleSave} disabled={isLoading} className="ml-auto">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Zapisywanie..." : "Zapisz grafik"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Position Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Filtruj po stanowisku
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TABS.map(tab => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.key)}
                  className="transition-all duration-200"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shift Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Typy zmian i wybór
            </CardTitle>
            <CardDescription>
              Wybierz typ zmiany poniżej, następnie kliknij na komórki grafiku, aby przypisać. Przeciągnij myszą, aby przypisać do wielu dni.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {shifts.map((shift) => (
                <Button
                  key={shift.id}
                  variant={selectedLegendShift === shift.id ? "default" : "outline"}
                  onClick={() => setSelectedLegendShift(selectedLegendShift === shift.id ? null : shift.id)}
                  className="h-auto p-3 flex flex-col items-start gap-1 transition-all duration-200"
                >
                  <div className="font-semibold text-sm">{shift.label}</div>
                  <div className="text-xs opacity-70">{shift.time}</div>
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant={selectedLegendShift === 'DELETE' ? "destructive" : "outline"}
                onClick={() => setSelectedLegendShift(selectedLegendShift === 'DELETE' ? null : 'DELETE')}
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Usuń zmianę
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedLegendShift(null)}
                size="sm"
              >
                Wyczyść wybór
              </Button>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 border rounded"></div>
                <span className="text-sm">Niedziela / Święto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 border rounded"></div>
                <span className="text-sm">Sobota</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grafik - {format(month, "MMMM yyyy", { locale: pl })}</CardTitle>
            <CardDescription>
              Kliknij lub przeciągnij po komórkach, aby przypisać zmiany.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Ładowanie danych grafiku...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto lg:overflow-x-visible">
                <table
                  className="w-full border-collapse border border-gray-200 bg-white rounded-lg shadow-sm lg:table-fixed"
                  style={{ tableLayout: 'fixed' }}
                  onMouseLeave={handleTableMouseLeave}
                >
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 bg-gray-50 z-10 p-3 text-left font-semibold border-b border-gray-200 min-w-[120px] lg:w-[160px] lg:min-w-0 lg:max-w-[160px] lg:p-1 lg:text-xs">
                        Pracownik
                      </th>
                      {days.map((day, i) => (
                        <th key={i} className="p-2 text-center font-medium border-b border-gray-200 min-w-[60px] lg:min-w-0 lg:w-auto lg:p-1 lg:text-xs">
                          <div className="text-sm lg:text-xs">{polishDayShort[day.getDay()]}</div>
                          <div className="text-lg font-bold lg:text-base">{format(day, "d")}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="sticky left-0 bg-white z-10 p-3 border-b border-gray-200 border-r lg:w-[160px] lg:min-w-0 lg:max-w-[160px] lg:p-1 lg:text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm lg:text-xs">
                                {emp.surname} {emp.name}
                              </div>
                              <div className="text-xs text-gray-500 lg:text-[10px]">{emp.position}</div>
                            </div>
                          </div>
                        </td>
                        {days.map((day, i) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const shift = schedule[emp.id]?.[dateStr] || "";
                          
                          let bgClass = "";
                          if (!shift) {
                            if (day.getDay() === 0) bgClass = "bg-red-50 hover:bg-red-100";
                            else if (day.getDay() === 6) bgClass = "bg-green-50 hover:bg-green-100";
                            else bgClass = "hover:bg-blue-50";
                          } else {
                            bgClass = "hover:bg-gray-100";
                          }
                          
                          // Highlight drag range
                          let dragHighlight = "";
                          if (
                            dragState.isDragging &&
                            dragState.empId === emp.id &&
                            dragState.startIdx !== null &&
                            dragState.endIdx !== null
                          ) {
                            const from = Math.min(dragState.startIdx, dragState.endIdx);
                            const to = Math.max(dragState.startIdx, dragState.endIdx);
                            if (i >= from && i <= to) {
                              dragHighlight = "ring-2 ring-blue-400 bg-blue-100";
                            }
                          }
                          return (
                            <td
                              key={dateStr}
                              className={`p-2 text-center cursor-pointer border-b border-gray-200 transition-colors ${bgClass} ${dragHighlight} lg:p-1 lg:text-xs lg:min-w-0 lg:w-auto`}
                              onClick={() => handleCellClick(emp, dateStr, shift)}
                              onMouseDown={() => handleCellMouseDown(emp.id, i)}
                              onMouseEnter={() => handleCellMouseEnter(emp.id, i)}
                              onMouseUp={() => handleCellMouseUp(emp.id, i)}
                              title={`${format(day, "EEEE, MMMM d", { locale: pl })} - Kliknij, aby przypisać zmianę`}
                              style={{ userSelect: 'none' }}
                            >
                              {shift && getShiftBadge(shift)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Assign Modal */}
        <Dialog open={bulkAssignModal.open} onOpenChange={(open) => setBulkAssignModal({ open, employee: null })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Masowe przypisanie zmian
              </DialogTitle>
              <DialogDescription>
                Przypisz zmiany dla {bulkAssignModal.employee?.surname} {bulkAssignModal.employee?.name} w wybranym zakresie dat.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-from">Data od</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={modalData.start}
                    onChange={(e) => setModalData({ ...modalData, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">Data do</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={modalData.end}
                    onChange={(e) => setModalData({ ...modalData, end: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Wybierz typ zmiany</Label>
                <div className="grid grid-cols-2 gap-2">
                  {shifts.map((shift) => (
                    <Button
                      key={shift.id}
                      variant={modalData.shift === shift.id ? "default" : "outline"}
                      onClick={() => {
                        setModalData({ ...modalData, shift: shift.id });
                        if (shift.id !== "CUSTOM") setCustomModalShift("");
                      }}
                      className="h-auto p-3 text-left flex flex-col items-start gap-1"
                    >
                      <div className="font-semibold text-sm">{shift.label}</div>
                      <div className="text-xs opacity-70">{shift.time}</div>
                    </Button>
                  ))}
                </div>
              </div>
              
              {modalData.shift === "CUSTOM" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-hours">Własne godziny</Label>
                  <Input
                    id="custom-hours"
                    type="text"
                    placeholder="np. 5-13 lub 7:30-15:30"
                    value={customModalShift}
                    onChange={e => setCustomModalShift(e.target.value)}
                  />
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={applyModalRange} className="flex-1">
                  Zastosuj zmiany
                </Button>
                <Button variant="outline" onClick={() => setBulkAssignModal({ open: false, employee: null })}>
                  Anuluj
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warning Modal */}
        <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
          <DialogContent className="max-h-[70vh]">
            <DialogHeader>
              <DialogTitle>Ostrzeżenie: Niezgodność godzin pracy</DialogTitle>
              <DialogDescription>
                U niektórych pracowników liczba przypisanych godzin nie zgadza się z wymiarem czasu pracy dla tego miesiąca ({requiredHours2025[month.getMonth()]}h).<br />
                <ul className="mt-2 mb-4 list-disc list-inside text-sm overflow-y-auto max-h-[50vh] pr-2">
                  {mismatchedEmployees.map(emp => {
                    const empHours = getEmployeeHours(emp.id);
                    const required = requiredHours2025[month.getMonth()];
                    const diff = empHours - required;
                    return (
                      <li key={emp.id}>
                        {emp.surname} {emp.name}: {empHours}h (
                        {diff > 0 ? `za dużo godzin o ${diff}` : `za mało godzin o ${-diff}`})
                      </li>
                    );
                  })}
                </ul>
                Czy na pewno chcesz zapisać grafik mimo niezgodności?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => { setShowWarningModal(false); setPendingSave(false); }}>Anuluj</Button>
              <Button variant="destructive" onClick={handleConfirmSave}>Zapisz mimo to</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 