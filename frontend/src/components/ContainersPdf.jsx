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
  textAlign: 'left',
  fontSize: '11px',
  whiteSpace: 'nowrap',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  fontSize: '18px',
  fontWeight: 'bold',
};

const summaryStyle = {
  marginBottom: '20px',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#374151',
};

const ContainersPdf = ({ containers, status, stats }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'PENDING': 'Oczekujące',
      'COMPLETED': 'Zrealizowane',
      'PERSONAL_PICKUP': 'Odbiór osobisty'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': '#fef3c7',
      'COMPLETED': '#dcfce7',
      'PERSONAL_PICKUP': '#fef3c7'
    };
    return colorMap[status] || '#f3f4f6';
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
             {/* Header */}
       <div style={headerStyle}>
         RAPORT POJEMNIKÓW - {status ? getStatusLabel(status) : 'WSZYSTKIE STATUSY'}
       </div>

       {/* Summary Statistics */}
       <div style={summaryStyle}>
         <div>Liczba pojemników: {containers.length}</div>
         <div>Status: {status ? getStatusLabel(status) : 'Wszystkie statusy'}</div>
         <div>Data generowania: {new Date().toLocaleDateString('pl-PL')}</div>
       </div>

      {/* Containers Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={thStyle}>DATA WPISU</th>
            <th style={thStyle}>NAZWA FIRMY</th>
            <th style={thStyle}>MIASTO</th>
            <th style={thStyle}>ADRES</th>
            <th style={thStyle}>TYP POJEMNIKA</th>
            <th style={thStyle}>SZT.</th>
            <th style={thStyle}>POWÓD</th>
            <th style={thStyle}>NR RW</th>
            <th style={thStyle}>DATA REALIZACJI</th>
            <th style={thStyle}>STATUS</th>
            <th style={thStyle}>NR FV</th>
            <th style={thStyle}>DANE WPISUJĄCEGO</th>
          </tr>
        </thead>
        <tbody>
          {containers.map((container, index) => (
            <tr key={container.id} style={{ 
              backgroundColor: container.personalPickup ? '#fef3c7' : 'white',
              pageBreakInside: 'avoid'
            }}>
              <td style={tdStyle}>{formatDate(container.entryDate)}</td>
              <td style={tdStyle}>{container.companyName}</td>
              <td style={tdStyle}>{container.city}</td>
              <td style={tdStyle}>{container.propertyAddress}</td>
              <td style={tdStyle}>{container.containerType}</td>
              <td style={tdStyle}>{container.quantity}</td>
              <td style={tdStyle}>{container.reason}</td>
              <td style={tdStyle}>{container.recordNumber || '-'}</td>
              <td style={tdStyle}>
                {container.completionDate ? formatDate(container.completionDate) : '-'}
              </td>
              <td style={tdStyle}>
                <span style={{ 
                  backgroundColor: getStatusColor(container.status),
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}>
                  {getStatusLabel(container.status)}
                </span>
              </td>
              <td style={tdStyle}>{container.invoiceNumber || '-'}</td>
              <td style={tdStyle}>{container.entryPersonData}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer with additional info */}
      <div style={{ 
        marginTop: '30px', 
        fontSize: '12px', 
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '15px'
      }}>
        <div>Uwagi:</div>
        <div>• Pojemniki z odbiorem osobistym są wyróżnione żółtym tłem</div>
        <div>• Pola NR RW i DATA REALIZACJI są wymagane dla zrealizowanych pojemników</div>
        <div>• Raport wygenerowany automatycznie przez system ODPADNIK</div>
      </div>
    </div>
  );
};

export default ContainersPdf;
