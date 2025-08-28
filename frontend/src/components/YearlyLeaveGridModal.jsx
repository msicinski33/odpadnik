import React, { useState, useEffect } from 'react';
import { Calendar, X, Plus, Minus, Trash2, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
const DAYS_OF_WEEK = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N'];

const YearlyLeaveGridModal = ({ 
  isOpen, 
  onClose, 
  employee, 
  year, 
  initialData = { carriedOver: 0, notes: '', selectedDates: [] },
  onSubmit,
  existingLeaveEntries = [],
  isEditing = false
}) => {
  const [formData, setFormData] = useState(initialData);
  const [selectionMode, setSelectionMode] = useState('single');
  const [rangeStart, setRangeStart] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleDateClick = (date) => {
    if (selectionMode === 'single') {
      toggleSingleDate(date);
    } else if (selectionMode === 'range') {
      handleRangeSelection(date);
    }
  };

  const toggleSingleDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    setFormData(prev => {
      const existingDate = prev.selectedDates.find(d => 
        d.startDate === dateString || d.endDate === dateString ||
        (new Date(d.startDate) <= date && new Date(d.endDate) >= date)
      );
      
      if (existingDate) {
        return {
          ...prev,
          selectedDates: prev.selectedDates.filter(d => d !== existingDate)
        };
      } else {
        return {
          ...prev,
          selectedDates: [...prev.selectedDates, {
            startDate: dateString,
            endDate: dateString,
            leaveType: 'ANNUAL_LEAVE',
            notes: ''
          }]
        };
      }
    });
  };

  const handleRangeSelection = (date) => {
    if (!rangeStart) {
      setRangeStart(date);
    } else {
      const start = rangeStart < date ? rangeStart : date;
      const end = rangeStart < date ? date : rangeStart;
      
      const startYear = start.getFullYear();
      const startMonth = String(start.getMonth() + 1).padStart(2, '0');
      const startDay = String(start.getDate()).padStart(2, '0');
      const startString = `${startYear}-${startMonth}-${startDay}`;
      
      const endYear = end.getFullYear();
      const endMonth = String(end.getMonth() + 1).padStart(2, '0');
      const endDay = String(end.getDate()).padStart(2, '0');
      const endString = `${endYear}-${endMonth}-${endDay}`;
      
      setFormData(prev => {
        const filteredDates = prev.selectedDates.filter(d => {
          const dStart = new Date(d.startDate);
          const dEnd = new Date(d.endDate);
          return !(dStart <= end && dEnd >= start);
        });
        
        return {
          ...prev,
          selectedDates: [...filteredDates, {
            startDate: startString,
            endDate: endString,
            leaveType: 'ANNUAL_LEAVE',
            notes: ''
          }]
        };
      });
      
      setRangeStart(null);
    }
  };

  const handleMouseEnter = (date) => {
    if (selectionMode === 'range' && rangeStart) {
      setHoveredDate(date);
    }
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  const clearSelection = () => {
    setFormData(prev => ({ ...prev, selectedDates: [] }));
    setRangeStart(null);
  };

  const removeDateRange = (index) => {
    setFormData(prev => ({
      ...prev,
      selectedDates: prev.selectedDates.filter((_, i) => i !== index)
    }));
  };

  const getMonthCalendar = (monthIndex) => {
    const days = [];
    const firstDay = new Date(year, monthIndex, 1);
    const startDate = new Date(firstDay);
    
    const firstDayOfWeek = firstDay.getDay();
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - adjustedFirstDay);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === monthIndex;
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isSelected = formData.selectedDates.some(d => {
        const start = new Date(d.startDate);
        const end = new Date(d.endDate);
        return currentDate >= start && currentDate <= end;
      });
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const isInRange = rangeStart && hoveredDate && 
        currentDate >= new Date(Math.min(rangeStart.getTime(), hoveredDate.getTime())) && 
        currentDate <= new Date(Math.max(rangeStart.getTime(), hoveredDate.getTime()));
      
      const existingLeave = existingLeaveEntries.find(entry => {
        const start = new Date(entry.startDate);
        const end = new Date(entry.endDate);
        return currentDate >= start && currentDate <= end;
      });
      
      days.push({
        date: currentDate,
        isCurrentMonth,
        isWeekend,
        isSelected,
        isToday,
        isInRange,
        existingLeave
      });
    }
    
    return days;
  };

  const getTotalDays = () => {
    return formData.selectedDates.reduce((total, dateRange) => {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return total + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] h-[96vh] max-w-none max-h-none p-3">
                 {/* Compact Header */}
         <div className="flex items-center justify-between pb-2 border-b">
           <div className="flex items-center gap-2">
             <Calendar className="h-5 w-5 text-primary" />
             <div>
               <h2 className="text-lg font-semibold">
                 {isEditing ? 'Edycja Planu Urlopów' : 'Planowanie Urlopów'} {year}
               </h2>
               <p className="text-sm text-muted-foreground">{employee?.surname} {employee?.name} • {employee?.position}</p>
             </div>
           </div>
           <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
             <X className="h-4 w-4" />
           </Button>
         </div>

        {/* Main Content - Compact Layout */}
        <div className="flex gap-3 h-full pt-2">
          {/* Left Sidebar - Ultra Compact */}
          <div className="w-48 space-y-2">
            {/* Employee Stats */}
            <Card className="p-2">
              <div className="text-center space-y-1">
                <div className="text-lg font-bold text-blue-600">{(formData.carriedOver || 0) + 26}</div>
                <div className="text-xs text-blue-700">Dostępne dni</div>
              </div>
            </Card>
            
            <Card className="p-2">
              <div className="text-center space-y-1">
                <div className="text-lg font-bold text-amber-600">{getTotalDays()}</div>
                <div className="text-xs text-amber-700">Użyte</div>
              </div>
            </Card>
            
            <Card className="p-2">
              <div className="text-center space-y-1">
                <div className="text-lg font-bold text-green-600">{(formData.carriedOver || 0) + 26 - getTotalDays()}</div>
                <div className="text-xs text-green-700">Pozostałe</div>
              </div>
            </Card>

            {/* Controls */}
            <Card className="p-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tryb wyboru</Label>
                <div className="flex gap-1">
                  <Button
                    variant={selectionMode === 'single' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectionMode('single')}
                    className="flex-1 text-xs px-1 h-6"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Dni
                  </Button>
                  <Button
                    variant={selectionMode === 'range' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectionMode('range')}
                    className="flex-1 text-xs px-1 h-6"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Zakres
                  </Button>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Dni przeniesione</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.carriedOver}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      carriedOver: parseInt(e.target.value) || 0 
                    }))}
                    className="h-6 text-xs"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={formData.selectedDates.length === 0}
                  className="w-full text-destructive hover:text-destructive h-6 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Wyczyść
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Side - Calendar & Summary */}
          <div className="flex-1 space-y-2">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Kalendarz {year}</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMonth(Math.max(0, selectedMonth - 1))}
                  disabled={selectedMonth === 0}
                  className="h-6 w-6 p-0"
                >
                  ‹
                </Button>
                <Badge variant="secondary" className="px-2 text-xs">
                  {MONTHS[selectedMonth]}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMonth(Math.min(11, selectedMonth + 1))}
                  disabled={selectedMonth === 11}
                  className="h-6 w-6 p-0"
                >
                  ›
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <Card className="p-2">
              <div className="space-y-1">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-0.5">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="h-5 w-5 flex items-center justify-center text-[9px] font-medium text-muted-foreground bg-muted/30 rounded">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {getMonthCalendar(selectedMonth).map((day, index) => (
                    <div
                      key={index}
                      className={`h-5 w-5 rounded flex items-center justify-center cursor-pointer text-[9px] font-medium transition-all duration-200 ${
                        !day.isCurrentMonth ? 'text-muted-foreground/20 cursor-not-allowed' :
                        day.isSelected ? 'bg-primary text-primary-foreground shadow-sm' :
                        day.isInRange ? 'bg-primary/20 text-primary-foreground' :
                        day.existingLeave ? 'bg-destructive text-destructive-foreground shadow-sm' :
                        day.isToday ? 'bg-accent text-accent-foreground font-bold ring-1 ring-accent/50' :
                        day.isWeekend ? 'bg-muted/30 text-muted-foreground hover:bg-muted/50' :
                        'bg-background hover:bg-accent/50 hover:text-accent-foreground'
                      }`}
                      onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                      onMouseEnter={() => handleMouseEnter(day.date)}
                      onMouseLeave={handleMouseLeave}
                      title={`${day.date.toLocaleDateString('pl-PL')}`}
                    >
                      {day.date.getDate()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick month navigation */}
              <div className="mt-2 grid grid-cols-6 gap-0.5">
                {MONTHS.map((month, index) => (
                  <Button
                    key={month}
                    variant={selectedMonth === index ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedMonth(index)}
                    className="text-[9px] px-1 py-0 h-5"
                  >
                    {month}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Selected Dates Summary */}
            {formData.selectedDates.length > 0 && (
              <Card className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Info className="h-3 w-3 text-primary" />
                    Wybrane daty urlopu
                  </h4>
                  <Badge variant="default" className="px-2 py-0 text-xs">
                    {getTotalDays()} dni
                  </Badge>
                </div>
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {formData.selectedDates.map((dateRange, index) => {
                    const start = new Date(dateRange.startDate);
                    const end = new Date(dateRange.endDate);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-1 bg-primary/5 rounded border border-primary/20">
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-primary rounded-full"></div>
                          <div>
                            <div className="font-medium text-xs">
                              {start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              {days} {days === 1 ? 'dzień' : days < 5 ? 'dni' : 'dni'}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDateRange(index)}
                          className="h-4 w-4 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>

                 {/* Compact Footer */}
         <div className="flex justify-end gap-2 pt-2 border-t">
           <Button variant="outline" onClick={onClose} size="sm" className="h-7">
             Anuluj
           </Button>
           <Button 
             onClick={handleSubmit}
             disabled={!employee || formData.selectedDates.length === 0}
             size="sm"
             className="h-7"
           >
             <Calendar className="h-3 w-3 mr-1" />
             {isEditing ? 'Zaktualizuj plan' : 'Zapisz plan urlopu'}
           </Button>
         </div>
      </DialogContent>
    </Dialog>
  );
};

export default YearlyLeaveGridModal;
