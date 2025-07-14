import React from 'react';

const thStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  background: '#f3f4f6',
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '14px',
  whiteSpace: 'nowrap',
};
const tdStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'center',
  fontSize: '14px',
  whiteSpace: 'nowrap',
};
const employeeTdStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'left',
  fontSize: '14px',
  fontWeight: 'bold',
  background: '#f9fafb',
  whiteSpace: 'nowrap',
};

function pad2(n) { return n < 10 ? '0' + n : n.toString(); }

function getPolishMonthName(monthStr) {
  const months = [
    'STYCZEŃ', 'LUTY', 'MARZEC', 'KWIECIEŃ', 'MAJ', 'CZERWIEC',
    'LIPIEC', 'SIERPIEŃ', 'WRZESIEŃ', 'PAŹDZIERNIK', 'LISTOPAD', 'GRUDZIEŃ'
  ];
  const [year, month] = monthStr.split('-');
  return `${months[Number(month) - 1]} ${year}`;
}

function getShiftLabel(shift) {
  const shiftMap = {
    '6-14': '6-14',
    '7-15': '7-15',
    '14-22': '14-22',
    '22-6': '22-6',
    'NU': 'NU',
    'D1': 'D1',
    'D2': 'D2',
    'D3': 'D3',
    'CUSTOM': 'Własne'
  };
  return shiftMap[shift] || shift;
}

function adjustShiftForDisability(shift) {
  // Adjust shifts for employees with disability certificates (7 hours instead of 8)
  const shiftAdjustments = {
    '6-14': '6-13',
    '14-22': '14-21',
    '22-6': '22-5'
  };
  return shiftAdjustments[shift] || shift;
}

function getShiftLabelWithDisability(shift, hasDisabilityCertificate) {
  const adjustedShift = hasDisabilityCertificate ? adjustShiftForDisability(shift) : shift;
  const shiftMap = {
    '6-14': '6-14',
    '7-15': '7-15',
    '14-22': '14-22',
    '22-6': '22-6',
    '6-13': '6-13',
    '14-21': '14-21',
    '22-5': '22-5',
    'NU': 'NU',
    'D1': 'D1',
    'D2': 'D2',
    'D3': 'D3',
    'CUSTOM': 'Własne'
  };
  return shiftMap[adjustedShift] || adjustedShift;
}

function getShiftColor(shift) {
  if (shift === '6-14' || shift === '7-15') return '#ffffff';
  const colorMap = {
    '14-22': '#fef3c7',
    '22-6': '#e9d5ff',
    'NU': '#fee2e2',
    'D1': '#fee2e2',
    'D2': '#fee2e2',
    'D3': '#fee2e2',
    'CUSTOM': '#dcfce7'
  };
  return colorMap[shift] || '#f3f4f6';
}

function getDayColor(day) {
  // day: { isHoliday, date, dayOfWeek }
  if (day.isHoliday || day.dayOfWeek === 0) return '#fee2e2'; // Sunday or holiday: red
  if (day.dayOfWeek === 6) return '#dcfce7'; // Saturday: green
  return '#f3f4f6';
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

function isWeekend(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function isHoliday(dateStr) {
  return polishHolidays2025.includes(dateStr);
}

export default function MonthlySchedulePdf({ employees, schedule, month, userName, selectedPositions }) {
  const daysInMonth = new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate();
  const year = Number(month.split('-')[0]);
  const mon = Number(month.split('-')[1]);
  
  // Generate days array
  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad2(mon)}-${pad2(day)}`;
    const date = new Date(dateStr);
    days.push({
      day,
      dateStr,
      date,
      isWeekend: isWeekend(dateStr),
      isHoliday: isHoliday(dateStr),
      dayOfWeek: date.getDay()
    });
  }

  // Calculate working days in the month
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; ++day) {
    const dateStr = `${year}-${pad2(mon)}-${pad2(day)}`;
    if (isWorkingDay(dateStr)) workingDays++;
  }

  // Calculate total hours for each employee
  const employeeTotals = employees.map(emp => {
    let totalHours = 0;
    days.forEach(day => {
      const shift = schedule[emp.id]?.[day.dateStr];
      if (shift && ['6-14', '7-15', '14-22', '22-6', 'CUSTOM', 'NU'].includes(shift)) {
        // Employees with disability certificates work 7 hours instead of 8
        totalHours += emp.hasDisabilityCertificate ? 7 : 8;
      }
    });
    return { employeeId: emp.id, totalHours };
  });

  const totalEmployees = employees.length;
  const totalWorkingDays = workingDays;
  // Calculate total nominal hours accounting for disability certificates
  const totalNominalHours = employees.reduce((total, emp) => {
    return total + (emp.hasDisabilityCertificate ? 7 : 8) * totalWorkingDays;
  }, 0);

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Top attachment info above summary, right-aligned and styled like summary statistics */}
      <div style={{ textAlign: 'right', fontSize: '12px', lineHeight: 1.3, margin: '0 0 8px 0' }}>
        Załącznik Nr 1 do Zarządzenia<br />
        Wewnętrznego Nr 65/2021 z dnia<br />
        01.12.2021r.
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
      HARMONOGRAM PRACY ZAKŁADU UTRZYMANIA CZYSTOŚCI NA MIESIĄC {getPolishMonthName(month)}
      </h2>

      {/* Summary Statistics */}
      <div style={{ marginBottom: '16px', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>
            {selectedPositions && selectedPositions.length > 0 
              ? `Stanowiska: ${selectedPositions.join(', ')}`
              : `Liczba pracowników: ${totalEmployees}`
            }
          </span>
          <span>Dni robocze: {totalWorkingDays}</span>
        </div>
      </div>

      {/* Main Schedule Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '160px' }}>Pracownik</th>
            {days.map(day => (
              <th key={day.day} style={{
                ...thStyle,
                width: '35px',
                backgroundColor: getDayColor(day),
                fontSize: '12px'
              }}>
                <div>{day.day}</div>
                <div style={{ fontSize: '10px', fontWeight: 'normal' }}>
                  {day.isHoliday ? 'Ś' : day.dayOfWeek === 0 ? 'Nd' : day.dayOfWeek === 6 ? 'Sb' : ['Pn', 'Wt', 'Śr', 'Cz', 'Pt'][day.dayOfWeek - 1]}
                </div>
              </th>
            ))}
            <th style={{ ...thStyle, width: '80px' }}>Razem</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td style={employeeTdStyle}>
                <div>{emp.surname} {emp.name}</div>
              </td>
              {days.map(day => {
                const shift = schedule[emp.id]?.[day.dateStr];
                let backgroundColor;
                if (shift) {
                  backgroundColor = getShiftColor(shift);
                } else if (day.isHoliday || day.dayOfWeek === 0) {
                  backgroundColor = '#fee2e2'; // Sunday or holiday: red
                } else if (day.dayOfWeek === 6) {
                  backgroundColor = '#dcfce7'; // Saturday: green
                } else {
                  backgroundColor = '#ffffff';
                }
                return (
                  <td key={day.day} style={{
                    ...tdStyle,
                    backgroundColor,
                    fontSize: '12px',
                    padding: '6px'
                  }}>
                    {shift ? (
                      <div style={{ 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: shift === 'NU' ? '#dc2626' : '#000',
                        whiteSpace: 'nowrap'
                      }}>
                        {getShiftLabelWithDisability(shift, emp.hasDisabilityCertificate)}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>—</div>
                    )}
                  </td>
                );
              })}
              <td style={{ ...tdStyle, fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
                {employeeTotals.find(t => t.employeeId === emp.id)?.totalHours || 0}h
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div style={{ marginTop: '16px', fontSize: '11px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Legenda:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}></div>
            <span>6-14</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}></div>
            <span>7-15</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#fef3c7', border: '1px solid #ccc' }}></div>
            <span>14-22</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#e9d5ff', border: '1px solid #ccc' }}></div>
            <span>22-6</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}></div>
            <span>6-13* (dla osób z orzeczeniem)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#fef3c7', border: '1px solid #ccc' }}></div>
            <span>14-21* (dla osób z orzeczeniem)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#e9d5ff', border: '1px solid #ccc' }}></div>
            <span>22-5* (dla osób z orzeczeniem)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#fee2e2', border: '1px solid #ccc' }}></div>
            <span>NU</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#fee2e2', border: '1px solid #ccc' }}></div>
            <span>D1 (Dyżur domowy 6:00-14:00)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#fee2e2', border: '1px solid #ccc' }}></div>
            <span>D2 (Dyżur domowy 14:00-22:00)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#fee2e2', border: '1px solid #ccc' }}></div>
            <span>D3 (Dyżur domowy 22:00-6:00)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#dcfce7', border: '1px solid #ccc' }}></div>
            <span>Własne</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#fee2e2', border: '1px solid #ccc' }}></div>
            <span>Niedziela / Święto</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#dcfce7', border: '1px solid #ccc' }}></div>
            <span>Sobota</span>
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '10px', fontStyle: 'italic' }}>
          * - Zmienione godziny dla pracowników z orzeczeniem o niepełnosprawności (7h zamiast 8h)
        </div>
      </div>

      {/* Explanations and Notes */}
      <div style={{ marginTop: '18px', fontSize: '11px', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>WYJAŚNIENIA:</div>
        <div>- w polach oznaczających poszczególne dni miesiąca należy wpisywać godzinę rozpoczęcia i zakończenia pracy</div>
        <div style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '2px' }}>UWAGA:</div>
        <div>- ze względu na szczególne okoliczności, które nie były znane w dniu sporządzania Harmonogramu Czasu Pracy, może on ulec zmianie, o czym pracownik zostanie powiadomiony w najkrótszym czasie</div>
      </div>

      {/* Footer */}
      {/* Move this block after signatures */}

      {/* Signatures */}
      <div style={{ marginTop: '32px', width: '100%' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>{(() => {
              const now = new Date();
              const pad = n => n < 10 ? '0' + n : n;
              const dzien = pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear();
              return `Słupsk, ${dzien}`;
            })()}</div>
            <div style={{ fontSize: '12px', marginBottom: '32px' }}>Sporządził:</div>
            <div style={{ height: '40px' }}></div>
            <div style={{ fontSize: '12px' }}>.......................................................</div>
          </div>
          <div style={{ flex: 1 }}></div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '12px', marginBottom: '32px' }}>Zatwierdził:</div>
            <div style={{ height: '40px' }}></div>
            <div style={{ fontSize: '12px' }}>.......................................................</div>
          </div>
        </div>
      </div>

      {/* Wygenerowano info after signatures */}
      <div style={{ fontSize: '11px', marginTop: '10px' }}>
        {(() => {
          const now = new Date();
          const pad = n => n < 10 ? '0' + n : n;
          const godzina = pad(now.getHours()) + ':' + pad(now.getMinutes());
          const dzien = pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear();
          return `Wygenerowano ${dzien}, ${godzina} przez ${userName || ''} w systemie ODPADnik`;
        })()}
      </div>
    </div>
  );
} 