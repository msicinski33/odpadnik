import React from 'react';

const WorkOrdersPDF = ({ orders, date, title = "Zlecenia pracy" }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Nie określono';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const getStatusText = (order) => {
    if (order.completed) return 'ZREALIZOWANE';
    if (order.cause) return 'NIEZREALIZOWANE';
    return 'OCZEKUJĄCE';
  };

  const getStatusColor = (order) => {
    if (order.completed) return '#dcfce7';
    if (order.cause) return '#fee2e2';
    return '#fef3c7';
  };

  const getStatusTextColor = (order) => {
    if (order.completed) return '#166534';
    if (order.cause) return '#991b1b';
    return '#92400e';
  };

  return (
    <div style={{ 
      fontFamily: 'Noto Sans, Arial, sans-serif', 
      color: '#222', 
      fontSize: 10, 
      padding: 15, 
      margin: 0, 
      width: '210mm', // A4 width
      minHeight: '297mm', // A4 height
      backgroundColor: '#ffffff',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ 
        borderBottom: '2px solid #0ea5e9', 
        paddingBottom: 8, 
        marginBottom: 16, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#0ea5e9' }}>ODPADnik</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#f8fafc', borderRadius: 4 }}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Podsumowanie</div>
        <div style={{ fontSize: 10 }}>Data: <b>{date ? new Date(date).toLocaleDateString('pl-PL') : 'Wszystkie oczekujące zlecenia'}</b></div>
        <div style={{ fontSize: 10 }}>Liczba zleceń: <b>{orders.length}</b></div>
        <div style={{ fontSize: 10 }}>Typ zleceń: <b>{orders[0]?.type?.toUpperCase() || 'RÓŻNE'}</b></div>
      </div>

      {/* Orders */}
      {orders.map((order, index) => (
        <div key={order.id} style={{ 
          marginBottom: 12, 
          padding: 10, 
          border: '1px solid #e5e7eb', 
          borderRadius: 4, 
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          pageBreakInside: 'avoid'
        }}>
          {/* Order Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>
              Zlecenie #{index + 1} - {order.type?.toUpperCase() || 'NIEZNANY TYP'}
            </div>
            <div style={{ 
              padding: '2px 6px', 
              borderRadius: 3, 
              fontSize: 9, 
              fontWeight: 'bold',
              backgroundColor: getStatusColor(order),
              color: getStatusTextColor(order)
            }}>
              {getStatusText(order)}
            </div>
          </div>

          {/* Order Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Left Column */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: '#374151' }}>Dane podstawowe</div>
              
              <div style={{ marginBottom: 3, fontSize: 9 }}>
                <span style={{ fontWeight: 600, color: '#6b7280' }}>Firma:</span>
                <span style={{ marginLeft: 6 }}>{order.company || 'Brak'}</span>
              </div>
              
              <div style={{ marginBottom: 3, fontSize: 9 }}>
                <span style={{ fontWeight: 600, color: '#6b7280' }}>Adres:</span>
                <span style={{ marginLeft: 6 }}>{order.address || 'Brak'}</span>
              </div>
              
              <div style={{ marginBottom: 3, fontSize: 9 }}>
                <span style={{ fontWeight: 600, color: '#6b7280' }}>Przyjął:</span>
                <span style={{ marginLeft: 6 }}>{order.receivedBy || 'Brak'}</span>
              </div>
              
              <div style={{ marginBottom: 3, fontSize: 9 }}>
                <span style={{ fontWeight: 600, color: '#6b7280' }}>Data zgł.:</span>
                <span style={{ marginLeft: 6 }}>{formatDate(order.dateReceived)}</span>
              </div>
              
              {order.realizationDate && (
                <div style={{ marginBottom: 3, fontSize: 9 }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Data realiz.:</span>
                  <span style={{ marginLeft: 6 }}>{formatDate(order.realizationDate)}</span>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: '#374151' }}>Przydział</div>
              
              {order.responsible && (
                <div style={{ marginBottom: 3, fontSize: 9 }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Odpowiedzialny:</span>
                  <span style={{ marginLeft: 6 }}>{order.responsible}</span>
                </div>
              )}
              
              {order.vehicle && (
                <div style={{ marginBottom: 3, fontSize: 9 }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Pojazd:</span>
                  <span style={{ marginLeft: 6 }}>{order.vehicle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Type-specific fields */}
          {(order.type === 'surowce' || order.odpad || order.rodzaj) && (
            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f0f9ff', borderRadius: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: '#0c4a6e' }}>Szczegóły surowców</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {order.odpad && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#0c4a6e' }}>Odpad:</span>
                    <span style={{ marginLeft: 6 }}>{order.odpad}</span>
                  </div>
                )}
                {order.rodzaj && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#0c4a6e' }}>Rodzaj:</span>
                    <span style={{ marginLeft: 6 }}>{order.rodzaj}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.type === 'worki' && (
            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f0fdf4', borderRadius: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: '#166534' }}>Szczegóły worków</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {order.quantity && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#166534' }}>Ilość:</span>
                    <span style={{ marginLeft: 6 }}>{order.quantity}</span>
                  </div>
                )}
                {order.rodzaj && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#166534' }}>Rodzaj:</span>
                    <span style={{ marginLeft: 6 }}>{order.rodzaj}</span>
                  </div>
                )}
                {order.orderNumber && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#166534' }}>Nr zlecenia:</span>
                    <span style={{ marginLeft: 6 }}>{order.orderNumber}</span>
                  </div>
                )}
                {order.bagNumber && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#166534' }}>Nr worka:</span>
                    <span style={{ marginLeft: 6 }}>{order.bagNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(order.type === 'uslugi' || order.type === 'bramy') && (
            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fef3c7', borderRadius: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: '#92400e' }}>Szczegóły usługi</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {order.wasteType && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#92400e' }}>Odpad:</span>
                    <span style={{ marginLeft: 6 }}>{order.wasteType}</span>
                  </div>
                )}
                {order.rodzaj && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#92400e' }}>Rodzaj:</span>
                    <span style={{ marginLeft: 6 }}>{order.rodzaj}</span>
                  </div>
                )}
                {order.kontener && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#92400e' }}>Kontener:</span>
                    <span style={{ marginLeft: 6 }}>{order.kontener}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.type === 'bezpylne' && (
            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f3e8ff', borderRadius: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: '#7c3aed' }}>Szczegóły bezpylne</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {order.rodzaj && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#7c3aed' }}>Rodzaj:</span>
                    <span style={{ marginLeft: 6 }}>{order.rodzaj}</span>
                  </div>
                )}
                {order.zlecenie && (
                  <div style={{ fontSize: 9 }}>
                    <span style={{ fontWeight: 600, color: '#7c3aed' }}>Zlecenie:</span>
                    <div style={{ marginTop: 3, padding: 4, backgroundColor: '#ffffff', borderRadius: 3, border: '1px solid #e5e7eb', fontSize: 8 }}>
                      {order.zlecenie}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes and Cause */}
          {(order.notes || order.cause) && (
            <div style={{ marginTop: 8 }}>
              {order.notes && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 3, color: '#374151' }}>Uwagi:</div>
                  <div style={{ padding: 4, backgroundColor: '#f8fafc', borderRadius: 3, border: '1px solid #e5e7eb', fontSize: 9 }}>
                    {order.notes}
                  </div>
                </div>
              )}
              
              {order.cause && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 3, color: '#dc2626' }}>Powód niezrealizowania:</div>
                  <div style={{ padding: 4, backgroundColor: '#fef2f2', borderRadius: 3, border: '1px solid #fecaca', color: '#991b1b', fontSize: 9 }}>
                    {order.cause}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{ 
        marginTop: 20, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        borderTop: '1px solid #e5e7eb',
        paddingTop: 12
      }}>
        <div>
          <div style={{ fontSize: 10, color: '#888' }}>Sporządził:</div>
          <div style={{ borderBottom: '1px solid #bbb', width: 150, height: 20 }}></div>
        </div>
        <div style={{ fontSize: 9, color: '#aaa' }}>Wygenerowano: {formatDate(new Date())}</div>
      </div>
    </div>
  );
};

export default WorkOrdersPDF; 