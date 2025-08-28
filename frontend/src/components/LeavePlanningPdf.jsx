import React from 'react';

const thStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  background: '#f3f4f6',
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  border: '1px solid #ccc',
  padding: '6px',
  textAlign: 'center',
  fontSize: '11px',
  whiteSpace: 'nowrap',
};

const employeeTdStyle = {
  border: '1px solid #ccc',
  padding: '6px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 'bold',
  background: '#f9fafb',
  whiteSpace: 'nowrap',
};

const leaveEntryStyle = {
  border: '1px solid #ccc',
  padding: '4px',
  textAlign: 'center',
  fontSize: '10px',
  background: '#e3f2fd',
  whiteSpace: 'nowrap',
};

function getPolishMonthName(monthIndex) {
  const months = [
    'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
    'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
  ];
  return months[monthIndex];
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
}

function calculateLeaveDays(startDate, endDate) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  } catch (error) {
    console.error('Error calculating leave days:', startDate, endDate, error);
    return 0;
  }
}

export default function LeavePlanningPdf({ 
  employees, 
  leavePlans, 
  year, 
  userName, 
  selectedPositions,
  selectedDepartments 
}) {

  // Filter employees based on selected positions and departments
  const filteredEmployees = employees.filter(emp => {
    const positionMatch = !selectedPositions || selectedPositions.length === 0 || 
                         selectedPositions.includes(emp.position);
    const departmentMatch = !selectedDepartments || selectedDepartments.length === 0 || 
                           selectedDepartments.includes(emp.department || 'Brak działu');
    return positionMatch && departmentMatch;
  }).sort((a, b) => {
    // Sort alphabetically by surname, then by name
    const surnameComparison = a.surname.localeCompare(b.surname, 'pl', { sensitivity: 'base' });
    if (surnameComparison !== 0) return surnameComparison;
    return a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' });
  });



  // Generate month columns
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          PLAN URLOPÓW PRACOWNIKÓW {year}
        </h1>
        <p style={{ fontSize: '14px', marginBottom: '4px' }}>
          {selectedPositions && selectedPositions.length > 0 
            ? `Stanowiska: ${selectedPositions.join(', ')}`
            : 'Wszystkie stanowiska'
          }
        </p>
        <p style={{ fontSize: '14px', marginBottom: '4px' }}>
          {selectedDepartments && selectedDepartments.length > 0 
            ? `Działy: ${selectedDepartments.join(', ')}`
            : 'Wszystkie działy'
          }
        </p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Sporządził: {userName} | Data: {new Date().toLocaleDateString('pl-PL')}
        </p>
      </div>



      {/* Main Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
      }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '120px' }}>Pracownik</th>
            <th style={{ ...thStyle, width: '80px' }}>Stanowisko</th>
            <th style={{ ...thStyle, width: '80px' }}>Dział</th>
            <th style={{ ...thStyle, width: '60px' }}>Dni dostępne</th>
            <th style={{ ...thStyle, width: '60px' }}>Wykorzystane</th>
            <th style={{ ...thStyle, width: '60px' }}>Pozostałe</th>
            {months.map(month => (
              <th key={month} style={{ ...thStyle, width: '60px' }}>
                {getPolishMonthName(month)}
              </th>
            ))}
            <th style={{ ...thStyle, width: '80px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee, index) => {
            const plan = leavePlans.find(p => p.employee.id === employee.id);
            const hasPlan = !!plan;
            

            
            const totalAvailable = hasPlan ? (employee.vacationDays || 26) + (plan.carriedOver || 0) : 0;
            const usedDays = hasPlan && plan.leaveEntries ? 
              plan.leaveEntries.reduce((sum, entry) => {
                // Count all leave entries, not just annual leave
                return sum + calculateLeaveDays(entry.startDate, entry.endDate);
              }, 0) : 0;
            const remainingDays = totalAvailable - usedDays;

            return (
              <tr key={employee.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                {/* Employee Info */}
                <td style={employeeTdStyle}>
                  {employee.surname} {employee.name}
                </td>
                <td style={tdStyle}>{employee.position}</td>
                <td style={tdStyle}>{employee.department || 'Brak działu'}</td>
                <td style={tdStyle}>{totalAvailable}</td>
                <td style={tdStyle}>{usedDays}</td>
                <td style={tdStyle}>{remainingDays}</td>

                {/* Month Columns */}
                {months.map(month => {
                  if (!hasPlan || !plan.leaveEntries) {
                    return <td key={month} style={tdStyle}>-</td>;
                  }

                  const monthLeaveEntries = plan.leaveEntries.filter(entry => {
                    // Show all leave entries (not just annual leave)
                    try {
                      const entryMonth = new Date(entry.startDate).getMonth();
                      return entryMonth === month;
                    } catch (error) {
                      console.error('Error parsing date:', entry.startDate, error);
                      return false;
                    }
                  });

                  if (monthLeaveEntries.length === 0) {
                    return <td key={month} style={tdStyle}>-</td>;
                  }

                  const leaveText = monthLeaveEntries.map(entry => {
                    try {
                      const days = calculateLeaveDays(entry.startDate, entry.endDate);
                      const startDay = new Date(entry.startDate).getDate();
                      const endDay = new Date(entry.endDate).getDate();
                      const status = entry.status === 'APPROVED' ? '✓' : '●';
                      return `${startDay}-${endDay} (${days}d) ${status}`;
                    } catch (error) {
                      console.error('Error processing leave entry:', entry, error);
                      return 'Error';
                    }
                  }).join(', ');

                  return (
                    <td key={month} style={leaveEntryStyle} title={leaveText}>
                      {leaveText}
                    </td>
                  );
                })}

                {/* Status */}
                <td style={tdStyle}>
                  {hasPlan ? (
                    plan.signature ? (
                      <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ Zatwierdzone</span>
                    ) : (
                      <span style={{ color: '#f59e0b' }}>Oczekuje</span>
                    )
                  ) : (
                    <span style={{ color: '#ef4444' }}>Brak planu</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        border: '1px solid #ccc', 
        borderRadius: '4px',
        background: '#f9fafb',
        fontSize: '11px'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Legenda:</div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#e3f2fd', border: '1px solid #ccc' }}></div>
            <span>Zaplanowane urlopy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#059669', fontWeight: 'bold' }}>✓</span>
            <span>Zatwierdzone urlopy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#f59e0b' }}>●</span>
            <span>Oczekujące urlopy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#ef4444' }}>●</span>
            <span>Brak planu</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        border: '1px solid #ccc', 
        borderRadius: '4px',
        background: '#fef3c7',
        fontSize: '11px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Uwagi:</div>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Dni dostępne = Dni podstawowe (26) + Dni przeniesione z poprzedniego roku</li>
          <li>Format dat w miesiącach: "dzień-dzień (liczba_dni) ✓/●" (✓=zatwierdzone, ●=oczekujące)</li>
          <li>Plany urlopów mogą być modyfikowane w trakcie roku</li>
          <li>Status zatwierdzenia wymaga podpisów pracownika i kierownika</li>
        </ul>
      </div>
    </div>
  );
}
