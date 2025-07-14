import React, { useEffect, useState, useContext } from 'react';
import authFetch from '../utils/authFetch';
import { UserContext } from '../UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/Checkbox';
import { Clock, User, Calendar, FileText, Save, Calculator, Moon } from 'lucide-react';

function pad2(n) { return n < 10 ? '0' + n : n.toString(); }
function formatNum(n) { return n.toFixed(2).replace('.', ','); }

export default function WorkCard() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  });
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [absenceTypes, setAbsenceTypes] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [workCard, setWorkCard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const daysInMonth = new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate();
  const [absenceModal, setAbsenceModal] = useState({ open: false, rowIdx: null });
  const [validationModal, setValidationModal] = useState({ open: false, messages: [], allowOverride: false });
  const [restWarning, setRestWarning] = useState(false);
  const [restWarningMessages, setRestWarningMessages] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const { user } = useContext(UserContext);

  useEffect(() => {
    authFetch('/api/employees').then(res => res.json()).then(setEmployees);
    authFetch('/api/absence-types').then(res => res.json()).then(setAbsenceTypes);
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    Promise.all([
      authFetch(`/api/employees/${employeeId}/schedule?month=${month}`).then(res => res.json()),
      authFetch(`/api/work-card/${employeeId}?month=${month}`).then(res => res.json())
    ]).then(([sched, card]) => {
      setSchedule(sched);
      setWorkCard(card);
      setLoading(false);
    });
  }, [employeeId, month]);

  function parseShift(shiftStr) {
    if (!shiftStr) return null;
    const match = shiftStr.match(/(\d{1,2})-(\d{1,2})/);
    if (match) {
      const fromH = match[1].padStart(2, '0');
      const toH = match[2].padStart(2, '0');
      const from = `${fromH}:00`;
      const to = `${toH}:00`;
      let total = Number(toH) - Number(fromH);
      if (total < 0) total += 24;
      return { from, to, total };
    }
    return null;
  }

  function adjustShiftForDisability(shift, hasDisabilityCertificate) {
    if (!hasDisabilityCertificate) return shift;
    if (shift === '6-14') return '6-13';
    if (shift === '14-22') return '14-21';
    if (shift === '22-6') return '22-5';
    return shift;
  }

  // Polish public holidays (fixed and variable for 2025)
  const polishHolidays2025 = [
    '2025-01-01', // Nowy Rok
    '2025-01-06', // Trzech Króli
    '2025-04-20', // Wielkanoc
    '2025-04-21', // Poniedziałek Wielkanocny
    '2025-05-01', // Święto Pracy
    '2025-05-03', // Święto Konstytucji 3 Maja
    '2025-06-08', // Zielone Świątki
    '2025-06-19', // Boże Ciało
    '2025-08-15', // Wniebowzięcie NMP
    '2025-11-01', // Wszystkich Świętych
    '2025-11-11', // Święto Niepodległości
    '2025-12-25', // Boże Narodzenie
    '2025-12-26', // Drugi dzień Bożego Narodzenia
  ];

  function isWorkingDay(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return false;
    if (polishHolidays2025.includes(dateStr)) return false;
    return true;
  }

  // Build table rows for each day
  const rows = [];
  for (let day = 1; day <= daysInMonth; ++day) {
    const dateStr = `${month}-${pad2(day)}`;
    const sched = schedule.find(s => s.date.startsWith(dateStr));
    let planned = null;
    let isDyzurowy = false;
    if (sched && (sched.customHours || sched.shift)) {
      if (["D1", "D2", "D3"].includes(sched.shift)) {
        isDyzurowy = true;
        planned = null; // do not show planned time
      } else {
        // ADJUSTMENT: use adjusted shift for disability before parsing
        const selectedEmployee = employees.find(emp => emp.id === Number(employeeId));
        const adjustedShift = adjustShiftForDisability(sched.customHours || sched.shift || '', selectedEmployee?.hasDisabilityCertificate);
        planned = parseShift(adjustedShift);
      }
    }
    const entry = workCard.find(e => e.date.startsWith(dateStr)) || {};
    rows.push({
      day,
      dateStr, // add for working day calculation
      scheduled: planned,
      scheduledRaw: sched ? (sched.customHours || sched.shift) : null,
      actualFrom: entry.actualFrom || '',
      actualTo: entry.actualTo || '',
      actualTotal: entry.actualTotal || '',
      absenceTypeId: entry.absenceTypeId != null ? entry.absenceTypeId : null,
      onCall: entry.onCall || false,
      id: entry.id,
      shiftCode: sched ? sched.shift : null,
      isDyzurowy,
    });
  }

  const updateRow = (idx, field, value) => {
    setWorkCard(prev => {
      const copy = [...prev];
      let entry = copy.find(e => e.date.startsWith(`${month}-${pad2(idx + 1)}`));
      if (!entry) {
        entry = {
          date: `${month}-${pad2(idx + 1)}T00:00:00.000Z`,
          employeeId: Number(employeeId),
          actualFrom: '',
          actualTo: '',
          actualTotal: '',
          absenceTypeId: null,
          onCall: false,
        };
        copy.push(entry);
      }
      entry[field] = value;
      entry.day = idx + 1; // Ensure day is always set
      if ((field === 'actualFrom' || field === 'actualTo') && entry.actualFrom && entry.actualTo) {
        const [fh, fm] = entry.actualFrom.split(':').map(Number);
        const [th, tm] = entry.actualTo.split(':').map(Number);
        let total = (th + tm/60) - (fh + fm/60);
        if (total < 0) total += 24;
        entry.actualTotal = Math.round(total * 100) / 100;
      }
      return copy;
    });
  };

  function calcNightHours(row) {
    if (!row.actualFrom || !row.actualTo) return 0;
    const [fh, fm] = row.actualFrom.split(':').map(Number);
    const [th, tm] = row.actualTo.split(':').map(Number);
    let from = fh * 60 + fm;
    let to = th * 60 + tm;
    if (to <= from) to += 24 * 60;
    let night = 0;
    for (let t = from; t < to; t += 15) {
      const hour = Math.floor((t % (24 * 60)) / 60);
      if (hour >= 22 || hour < 6) night += 15;
    }
    return Math.round((night / 60) * 100) / 100;
  }

  // Calculate nominalnyCzasPracy as working days * hours (8 for normal, 7 for disability)
  const workingDays = rows.filter(row => isWorkingDay(row.dateStr)).length;
  const selectedEmployee = employees.find(emp => emp.id === Number(employeeId));
  const hoursPerDay = selectedEmployee?.hasDisabilityCertificate ? 7 : 8;
  const nominalnyCzasPracy = workingDays * hoursPerDay;
  const planPracy = rows.reduce((sum, row) => sum + (row.scheduled && !row.isDyzurowy ? row.scheduled.total : 0), 0);
  const wykonanie = rows.reduce((sum, row) => {
    if ((row.absenceTypeId && !row.actualFrom && !row.actualTo)) {
      // Always count absence as hoursPerDay, even if no planned shift
      return sum + hoursPerDay;
    }
    return sum + (row.actualTotal ? Number(row.actualTotal) : 0);
  }, 0);
  const pracaWNocnych = rows.reduce((sum, row) => sum + calcNightHours(row), 0);
  const totalPlanned = planPracy;
  const totalDyzurowy = rows.reduce((sum, row) => {
    // Only count dyżur if there is a dyżur shift and NO actual work
    if (row.isDyzurowy && !(row.actualFrom && row.actualTo && row.actualTotal)) {
      return sum + hoursPerDay;
    }
    return sum;
  }, 0);
  const totalActual = rows.reduce((sum, row) => {
    if (row.actualFrom && row.actualTo && row.actualTotal) {
      return sum + Number(row.actualTotal);
    }
    return sum;
  }, 0);
  const totalAbsence = rows.reduce((sum, row) => {
    if (row.absenceTypeId && !row.actualFrom && !row.actualTo) {
      // Always count absence as hoursPerDay, even if no planned shift
      return sum + hoursPerDay;
    }
    return sum;
  }, 0);
  // Overtime/Idle sums
  let total50 = 0, total100 = 0, totalPostojowe = 0;
  rows.forEach(row => {
    const planned = row.scheduled ? row.scheduled.total : null;
    const actual = row.actualTotal ? Number(row.actualTotal) : null;
    if (!actual) return;
    if (!planned) {
      if (actual <= hoursPerDay) total100 += actual;
      else { total100 += hoursPerDay; total50 += (actual - hoursPerDay); }
    } else if (actual > planned) {
      total50 += (actual - planned);
    } else if (actual < planned) {
      totalPostojowe += (planned - actual);
    }
  });
  // Offset total50 and totalPostojowe for the month
  let net50 = 0, netPostojowe = 0;
  if (total50 > totalPostojowe) {
    net50 = total50 - totalPostojowe;
    netPostojowe = 0;
  } else if (totalPostojowe > total50) {
    netPostojowe = totalPostojowe - total50;
    net50 = 0;
  } // if equal, both are 0

  function getOvertimeCell(row) {
    if (row.absenceTypeId) return '—';
    const planned = row.scheduled ? row.scheduled.total : null;
    const actual = row.actualTotal ? Number(row.actualTotal) : null;
    if (!actual) return '—';
    if (!planned) {
      if (actual <= hoursPerDay) return `${actual}h x 100`;
      else return `${hoursPerDay}h x 100, ${(actual - hoursPerDay)}h x 50`;
    } else if (actual > planned) {
      return `${(actual - planned)}h x 50`;
    } else if (actual < planned) {
      return `${(planned - actual)}h x postojowe`;
    }
    return '—';
  }

  function validateRestRules() {
    const messages = [];
    let hasViolation = false;

    // Daily rest (11h) validation
    for (let i = 0; i < rows.length - 1; i++) {
      const current = rows[i];
      const next = rows[i + 1];
      // Only consider days with actual work, not absence
      if (
        current.actualTo && next.actualFrom &&
        !current.absenceTypeId && !next.absenceTypeId
      ) {
        const [ch, cm] = current.actualTo.split(':').map(Number);
        const [nh, nm] = next.actualFrom.split(':').map(Number);
        let rest = (nh + nm/60) - (ch + cm/60);
        if (rest < 0) rest += 24;
        if (rest < 11) {
          messages.push(`Dzień ${current.day}-${next.day}: Odpoczynek dzienny ${rest.toFixed(2)}h < 11h`);
          hasViolation = true;
        }
      }
    }

    // Weekly rest (35h) validation
    for (let start = 0; start < rows.length - 6; start++) {
      const week = rows.slice(start, start + 7);
      // Only count days with actual work, not absence
      const workDays = week.filter(row => row.actualFrom && row.actualTo && !row.absenceTypeId);
      if (workDays.length >= 2) {
        const firstWorkDay = workDays[0];
        const lastWorkDay = workDays[workDays.length - 1];
        const [fh, fm] = firstWorkDay.actualFrom.split(':').map(Number);
        const [lh, lm] = lastWorkDay.actualTo.split(':').map(Number);
        let rest = (lh + lm/60) - (fh + fm/60);
        if (rest < 0) rest += 24;
        if (rest < 35) {
          messages.push(`Tydzień ${firstWorkDay.day}-${lastWorkDay.day}: Odpoczynek tygodniowy ${rest.toFixed(2)}h < 35h`);
          hasViolation = true;
        }
      }
    }

    return { hasViolation, messages };
  }

  async function handleSave() {
    const { hasViolation, messages } = validateRestRules();
    if (hasViolation) {
      setValidationModal({ open: true, messages, allowOverride: true });
      return;
    }
    await saveWorkCard();
  }

  async function saveWorkCard() {
    setSaving(true);
    try {
      const validEntries = workCard.filter(
        e => typeof e.day === 'number' && e.day >= 1 && e.day <= 31
      ).map(e => ({
        ...e,
        actualTotal: e.actualTotal === "" || e.actualTotal == null ? null : Number(e.actualTotal)
      }));
      const response = await authFetch(`/api/work-card/${employeeId}?month=${month}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: validEntries })
      });
      if (response.ok) {
        setRestWarning(false);
        setRestWarningMessages([]);
      }
    } catch (error) {
      console.error('Error saving work card:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWithOverride() {
    setValidationModal({ open: false, messages: [], allowOverride: false });
    setRestWarning(true);
    setRestWarningMessages(validationModal.messages);
    await saveWorkCard();
  }

  async function handleExportPDF() {
    if (!selectedEmployee) return;
    
    try {
      // Import ReactDOMServer dynamically to avoid SSR issues
      const ReactDOMServer = await import('react-dom/server');
      
      // Import the PDF component dynamically
      const WorkCardPdf = (await import('./WorkCardPdf')).default;
      
      // Generate HTML using the PDF component
      const htmlContent = ReactDOMServer.renderToString(
        React.createElement(WorkCardPdf, {
          rows,
          employee: selectedEmployee,
          month,
          absenceTypes,
          userName: user?.name || ''
        })
      );
      
      // Create complete HTML document
      const fullHtml = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Karta pracy PDF</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 24px; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `;

      const response = await authFetch('/api/pdf/work-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: fullHtml,
          fileName: `${selectedEmployee.surname}-${selectedEmployee.name}_${month}.pdf`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedEmployee.surname}-${selectedEmployee.name}_${month}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  }

  const holidays = []; // Add holidays as needed

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Karta pracy pracownika</CardTitle>
                <CardDescription className="text-lg">
                  Rejestruj godziny pracy, nadgodziny i nieobecności pracowników
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="month" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Miesiąc
                </Label>
                <Input
                  id="month"
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeFilter" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Filtruj po nazwisku
                </Label>
                <Input
                  id="employeeFilter"
                  type="text"
                  placeholder="Wpisz nazwisko..."
                  value={employeeFilter}
                  onChange={e => setEmployeeFilter(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Pracownik
                </Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Wybierz pracownika" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(emp => emp.surname.toLowerCase().includes(employeeFilter.toLowerCase()))
                      .map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          <div className="flex flex-col">
                            <span>{emp.name} {emp.surname}</span>
                            {emp.position && (
                              <span className="text-xs text-muted-foreground">{emp.position}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saving || !employeeId}
                size="lg"
                className="ml-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
              <Button 
                onClick={handleExportPDF} 
                disabled={!employeeId}
                size="lg"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Eksportuj PDF
              </Button>
            </div>
            {selectedEmployee && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Wybrany:</span>
                  <span>{selectedEmployee.name} {selectedEmployee.surname}</span>
                  {selectedEmployee.position && (
                    <Badge variant="outline">{selectedEmployee.position}</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {employeeId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nominalna praca</p>
                    <p className="text-2xl font-bold">{formatNum(nominalnyCzasPracy)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Plan pracy</p>
                    <p className="text-2xl font-bold">{formatNum(planPracy)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Wykonanie</p>
                    <p className="text-2xl font-bold">{formatNum(wykonanie)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Praca w godzinach nocnych</p>
                    <p className="text-2xl font-bold">{formatNum(pracaWNocnych)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Persistent warning above work card */}
        {restWarning && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            <b>Ostrzeżenie:</b>
            {restWarningMessages && restWarningMessages.length > 0 ? (
              <ul className="mt-1 ml-4 list-disc">
                {restWarningMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            ) : (
              <> Minimalny czas odpoczynku tygodniowego nie został osiągnięty dla {selectedEmployee?.name} {selectedEmployee?.surname}. Sprawdź grafik.</>
            )}
          </div>
        )}

        {/* Work Card Table */}
        {loading ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <div className="text-lg text-muted-foreground">Ładowanie danych karty pracy...</div>
              </div>
            </CardContent>
          </Card>
        ) : employeeId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Dzienna ewidencja czasu pracy
              </CardTitle>
              <CardDescription>
                Rejestruj godziny rozpoczęcia, zakończenia pracy i zarządzaj nieobecnościami
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center p-3 font-semibold">Dzień</th>
                      <th className="text-center p-3 font-semibold">Czas planowany</th>
                      <th className="text-center p-3 font-semibold">Czas rzeczywisty</th>
                      <th className="text-center p-3 font-semibold">Nieobecność</th>
                      <th className="text-center p-3 font-semibold">Dyżur</th>
                      <th className="text-center p-3 font-semibold">Nadgodziny / Postojowe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const dateStr = `${month}-${pad2(row.day)}`;
                      const dateObj = new Date(`${month}-${pad2(row.day)}`);
                      const isSunday = dateObj.getDay() === 0;
                      const isSaturday = dateObj.getDay() === 6;
                      const isHoliday = holidays.includes(dateStr);
                      let rowClass = "border-b hover:bg-muted/25 transition-colors";
                      if (isSunday || isHoliday) rowClass += " bg-red-50";
                      else if (isSaturday) rowClass += " bg-green-50";
                      const hoursPerDay = selectedEmployee?.hasDisabilityCertificate ? 7 : 8;
                      return (
                        <tr key={row.day} className={rowClass}>
                          <td className="text-center p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{row.day}</span>
                            </div>
                          </td>
                          <td className="text-center p-3">
                            {row.isDyzurowy ? (
                              <span style={{ color: '#888' }}>—</span>
                            ) : row.scheduled ? (
                              <span>{row.scheduled.from}–{row.scheduled.to} ({row.scheduled.total}h)</span>
                            ) : (
                              <span style={{ color: '#888' }}>—</span>
                            )}
                          </td>
                          <td className="text-center p-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={row.actualFrom}
                                onChange={e => updateRow(idx, 'actualFrom', e.target.value)}
                                className="w-24 h-8"
                              />
                              <span className="text-muted-foreground">–</span>
                              <Input
                                type="time"
                                value={row.actualTo}
                                onChange={e => updateRow(idx, 'actualTo', e.target.value)}
                                className="w-24 h-8"
                              />
                              {row.actualFrom && row.actualTo && row.actualTotal && (
                                <Badge variant="outline" className="text-xs ml-2">
                                  {row.actualTotal}h
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-center p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAbsenceModal({ open: true, rowIdx: idx })}
                              className="h-8"
                            >
                              {row.absenceTypeId
                                ? <>{absenceTypes.find(a => a.id === row.absenceTypeId)?.code || 'ABS'} <span>({hoursPerDay}h)</span></>
                                : <span className="text-muted-foreground">Ustaw nieobecność</span>
                              }
                            </Button>
                          </td>
                          <td className="text-center p-3">
                            {(row.shiftCode === 'D1' || row.shiftCode === 'D2' || row.shiftCode === 'D3') && !(row.actualFrom && row.actualTo && row.actualTotal) ? (
                              <Badge variant="outline" className="text-xs">
                                {row.shiftCode === 'D1' && 'Dyżur 6:00-14:00'}
                                {row.shiftCode === 'D2' && 'Dyżur 14:00-22:00'}
                                {row.shiftCode === 'D3' && 'Dyżur 22:00-6:00'}
                              </Badge>
                            ) : (
                              <Checkbox
                                checked={row.onCall}
                                onCheckedChange={(checked) => updateRow(idx, 'onCall', checked)}
                              />
                            )}
                          </td>
                          <td className="text-center p-3">
                            <span className="text-sm">{getOvertimeCell(row)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-muted/25 font-semibold">
                      <td className="text-center p-3">OGÓŁEM:</td>
                      <td className="text-center p-3">{formatNum(totalPlanned)}h</td>
                      <td className="text-center p-3">{formatNum(totalActual)}h</td>
                      <td className="text-center p-3">{formatNum(totalAbsence)}h</td>
                      <td className="text-center p-3">{formatNum(totalDyzurowy)}h</td>
                      <td className="text-center p-3">
                        {total100 > 0 && <span>{formatNum(total100)}h x 100</span>}
                        {net50 > 0 && <span>{total100 > 0 ? ', ' : ''}{formatNum(net50)}h x 50</span>}
                        {netPostojowe > 0 && <span>{(total100 > 0 || net50 > 0) ? ', ' : ''}{formatNum(netPostojowe)}h x postojowe</span>}
                        {total100 === 0 && net50 === 0 && netPostojowe === 0 && '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <div className="text-lg text-muted-foreground">Wybierz pracownika, aby wyświetlić kartę pracy</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Absence Type Modal */}
      <Dialog open={absenceModal.open} onOpenChange={() => setAbsenceModal({ open: false, rowIdx: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wybierz typ nieobecności</DialogTitle>
            <DialogDescription>
              Wybierz kod nieobecności dla dnia {absenceModal.rowIdx !== null ? rows[absenceModal.rowIdx]?.day : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
            {absenceTypes.map(type => (
              <Button
                key={type.id}
                variant="outline"
                className="justify-start"
                onClick={() => {
                  updateRow(absenceModal.rowIdx, 'absenceTypeId', type.id);
                  setAbsenceModal({ open: false, rowIdx: null });
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{type.code}</span>
                  <span className="text-sm text-muted-foreground">{type.name}</span>
                </div>
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={() => {
                updateRow(absenceModal.rowIdx, 'absenceTypeId', null);
                setAbsenceModal({ open: false, rowIdx: null });
              }}
            >
              Usuń nieobecność
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Modal */}
      <Dialog open={validationModal.open} onOpenChange={() => setValidationModal({ open: false, messages: [], allowOverride: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ostrzeżenie - Naruszenie przepisów o czasie pracy</DialogTitle>
            <DialogDescription>
              Wykryto naruszenia przepisów o czasie pracy:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {validationModal.messages.map((message, idx) => (
              <div key={idx} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                {message}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setValidationModal({ open: false, messages: [], allowOverride: false })}
            >
              Anuluj
            </Button>
            {validationModal.allowOverride && (
              <Button
                onClick={handleSaveWithOverride}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Zapisz mimo ostrzeżenia
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 