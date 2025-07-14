import React from 'react';

const thStyle = {
  border: '1px solid #ccc',
  padding: '4px',
  background: '#f3f4f6',
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '11px',
};
const tdStyle = {
  border: '1px solid #ccc',
  padding: '4px',
  textAlign: 'center',
  fontSize: '11px',
};

function formatNum(n) { return n.toFixed(2).replace('.', ','); }
function pad2(n) { return n < 10 ? '0' + n : n.toString(); }
function getPolishMonthName(monthStr) {
  const months = [
    'STYCZEŃ', 'LUTY', 'MARZEC', 'KWIECIEŃ', 'MAJ', 'CZERWIEC',
    'LIPIEC', 'SIERPIEŃ', 'WRZESIEŃ', 'PAŹDZIERNIK', 'LISTOPAD', 'GRUDZIEŃ'
  ];
  const [year, month] = monthStr.split('-');
  return `${months[Number(month) - 1]} ${year}`;
}
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

function getOvertimeCell(row, employee) {
  if (row.absenceTypeId) return '—';
  const planned = row.scheduled ? row.scheduled.total : null;
  const actual = row.actualTotal ? Number(row.actualTotal) : null;
  if (!actual) return '—';
  const hoursPerDay = employee?.hasDisabilityCertificate ? 7 : 8;
  if (!planned) {
    if (actual <= hoursPerDay) return `${actual}h x 100`;
    else return `${hoursPerDay}h x 100, ${(actual - hoursPerDay)}h x 50`;
  } else if (actual > planned) {
    return `${(actual - planned)}h x 50`;
  } else if (actual < planned) {
    return `${(planned - actual)}h x post.`;
  }
  return '—';
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

export default function WorkCardPdf({ rows, employee, month, absenceTypes, userName }) {
  const daysInMonth = new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate();
  // Calculate working days in the month
  const year = Number(month.split('-')[0]);
  const mon = Number(month.split('-')[1]);
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; ++day) {
    const dateStr = `${year}-${pad2(mon)}-${pad2(day)}`;
    if (isWorkingDay(dateStr)) workingDays++;
  }
  const hoursPerDay = employee?.hasDisabilityCertificate ? 7 : 8;
  const nominalnyCzasPracy = workingDays * hoursPerDay;
  const totalPlanned = rows.reduce((sum, row) => sum + (row.scheduled && !row.isDyzurowy ? row.scheduled.total : 0), 0);
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
    // If absenceTypeId is set (and no actualFrom/actualTo), count hoursPerDay as actual
    if (row.absenceTypeId && !row.actualFrom && !row.actualTo) {
      return sum + hoursPerDay;
    }
    return sum;
  }, 0);
  const totalAbsence = rows.reduce((sum, row) => {
    if (row.absenceTypeId && !row.actualFrom && !row.actualTo && row.scheduled) {
      return sum + row.scheduled.total;
    }
    return sum;
  }, 0);
  const pracaWNocnych = rows.reduce((sum, row) => sum + calcNightHours(row), 0);

  // Calculate overtime/idle totals for summary row
  let total50 = 0, total100 = 0, totalPostojowe = 0;
  rows.forEach(row => {
    if (row.absenceTypeId) return;
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
  function overtimeSummary() {
    const parts = [];
    if (total100 > 0) parts.push(`${formatNum(total100)}h x 100`);
    if (net50 > 0) parts.push(`${formatNum(net50)}h x 50`);
    if (netPostojowe > 0) parts.push(`${formatNum(netPostojowe)}h x post.`);
    return parts.length ? parts.join(', ') : '—';
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* First page content */}
      <div style={{ width: '100%', textAlign: 'left', fontSize: '11px', lineHeight: '1.3', fontWeight: 'normal', marginBottom: '8px' }}>
        Zakład Utrzymania Czystości<br />
        Przedsiębiorstwo Gospodarki Komunalnej Spółka z o.o.<br />
        ul. Szczecińska 112<br />
        76-200 Słupsk<br />
        NIP: 839-000-56-23
      </div>
      <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: 4, textAlign: 'center' }}>
        KARTA PRACY ZA MIESIĄC {getPolishMonthName(month)} {employee?.name && employee?.surname ? (employee.name + ' ' + employee.surname).toUpperCase() : ''}
      </h2>
      {/* Main table and rest of the content */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
      }}>
        <thead>
          <tr>
            <th style={thStyle}>Dzień</th>
            <th style={thStyle}>Czas planowany</th>
            <th style={thStyle}>Czas rzeczywisty</th>
            <th style={thStyle}>Nieobecność</th>
            <th style={thStyle}>Dyżur</th>
            <th style={thStyle}>Nadgodziny / Postojowe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.day}>
              <td style={tdStyle}>{row.day}</td>
              <td style={tdStyle}>
                {row.isDyzurowy ? (
                  <span style={{ color: '#888' }}>—</span>
                ) : row.scheduled ? (
                  <span>{row.scheduled.from}–{row.scheduled.to} ({row.scheduled.total}h)</span>
                ) : (
                  <span style={{ color: '#888' }}>{row.scheduledRaw || '—'}</span>
                )}
              </td>
              <td style={tdStyle}>
                {row.actualFrom && row.actualTo
                  ? `${row.actualFrom}–${row.actualTo} (${row.actualTotal}h)`
                  : '—'}
              </td>
              <td style={tdStyle}>
                {row.absenceTypeId ? (
                  <>
                    {absenceTypes.find(a => a.id === row.absenceTypeId)?.code || 'ABS'} <span>({hoursPerDay}h)</span>
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td style={tdStyle}>
                {(row.shiftCode === 'D1' || row.shiftCode === 'D2' || row.shiftCode === 'D3') && !(row.actualFrom && row.actualTo && row.actualTotal)
                  ? (
                    row.shiftCode === 'D1' ? '6:00-14:00' :
                    row.shiftCode === 'D2' ? '14:00-22:00' :
                    row.shiftCode === 'D3' ? '22:00-6:00' : '—'
                  )
                  : (row.onCall ? '✔' : '—')}
              </td>
              <td style={tdStyle}>
                {getOvertimeCell(row, employee)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ ...tdStyle, fontWeight: 'bold' }}>OGÓŁEM:</td>
            <td style={tdStyle}>{formatNum(totalPlanned)}h</td>
            <td style={tdStyle}>{formatNum(totalActual)}h</td>
            <td style={tdStyle}>{formatNum(totalAbsence)}h</td>
            <td style={tdStyle}>{formatNum(totalDyzurowy)}h</td>
            <td style={tdStyle}>{overtimeSummary()}</td>
          </tr>
        </tfoot>
      </table>
      <table style={{ width: '100%', border: 'none', marginTop: '6px' }}>
        <tbody>
          <tr>
            <td style={{ border: 'none', fontWeight: 'normal', fontSize: '9px', textAlign: 'center', padding: 0, whiteSpace: 'nowrap' }}>
              nominalny czas pracy: {formatNum(nominalnyCzasPracy)}&nbsp;
              plan pracy: {formatNum(totalPlanned)}&nbsp;
              wykonanie: {formatNum(totalActual)}&nbsp;
              nocnych: {formatNum(pracaWNocnych)}
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '20px', width: '100%' }}>
        <div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: '4px' }}>Uwagi:</div>
        <div style={{ borderBottom: '1px dotted #333', width: '100%', height: '12px', marginBottom: '6px' }}></div>
        <div style={{ borderBottom: '1px dotted #333', width: '100%', height: '12px', marginBottom: '6px' }}></div>
  
        <div style={{ borderBottom: '1px dotted #333', width: '100%', height: '12px', marginBottom: '6px' }}></div>
        <div style={{ fontSize: '9px', marginTop: '10px' }}>
          {(() => {
            const now = new Date();
            const pad = n => n < 10 ? '0' + n : n;
            const godzina = pad(now.getHours()) + ':' + pad(now.getMinutes());
            const dzien = pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear();
            return `Wygenerowano ${dzien}, ${godzina} przez ${userName || ''} w systemie ODPADnik`;
          })()}
        </div>
      </div>
      {/* Time-off request and signature fields, no bold, right-aligned signature */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '32px', width: '100%' }}>
        <div style={{ fontWeight: 'normal', fontSize: '11px', width: '100%' }}>
          *Wnioskuję o udzielenie czasu wolnego w dniu ….................... w ilości godzin …...............    w zamian za wykonywanie pracy w godzinach nadliczbowych zgodnie z kartą pracy.
        </div>
        <div style={{ marginTop: '24px', fontSize: '10px', textAlign: 'right', width: '100%' }}>
          .......................................................<br />
          Podpis pracownika
        </div>
      </div>
      {/* Supervisor remarks and signatures section - improved vertical spacing and placement */}
      <div style={{ marginTop: '64px', width: '100%' }}>
        <div style={{ fontSize: '11px', marginBottom: '40px' }}>Uwagi bezpośredniego przełożonego:</div>
        <div style={{ height: '60px' }}></div>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '32px' }}>
          <div style={{ minWidth: '320px' }}>
            <div style={{ fontSize: '10px', textAlign: 'left' }}>.......................................................</div>
            <div style={{ fontSize: '10px', textAlign: 'left', marginTop: '2px' }}>(podpis bezpośredniego przełożonego/kierownika jednostki organizacyjnej)</div>
          </div>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '96px' }}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '10px' }}>.......................................................</div>
            <div style={{ fontSize: '10px', textAlign: 'left', marginTop: '2px' }}>podpis Sekcja Kadr</div>
          </div>
          <div style={{ flex: 1 }}></div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {/* Empty for spacing */}
          </div>
        </div>
        {/* Akceptacja signature row */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginTop: '60px' }}>
          <div style={{ flex: 1 }}></div>
          <div style={{ flex: 1 }}></div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '10px' }}>.......................................................</div>
            <div style={{ fontSize: '10px', textAlign: 'right', marginTop: '2px' }}>Akceptacja</div>
          </div>
        </div>
        {/* Legal basis row, further down */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', marginTop: '60px' }}>
          <div style={{ flex: 1, textAlign: 'left', fontSize: '10px' }}>
            Podstawa prawna art. 151<sup>2</sup> § 1<sup>3</sup> ustawy z dnia 26 czerwca 1974 r.
          </div>
        </div>
      </div>
    </div>
  );
} 