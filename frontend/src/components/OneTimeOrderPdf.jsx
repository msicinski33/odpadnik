import React from 'react';

export default function OneTimeOrderPdf({ order }) {
  // Helper for date formatting
  const formatDate = d => d ? new Date(d).toLocaleDateString('pl-PL') : '-';
  const STATUS_LABELS = {
    'AWAITING_EXECUTION': 'Oczekuje na realizację',
    'CONTAINER_DELIVERED': 'Kontener dostarczony',
    'AWAITING_COMPLETION': 'Oczekuje na odbiór',
    'COMPLETED': 'Zakończone',
    'CANCELLED': 'Anulowane',
  };
  return (
    <div style={{ fontFamily: 'Noto Sans, Arial, sans-serif', color: '#222', fontSize: 13, padding: 0, margin: 0, width: '100%' }}>
      <div style={{ borderBottom: '2px solid #0ea5e9', paddingBottom: 12, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 22, color: '#0ea5e9' }}>ODPADnik</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Zlecenie jednorazowe</div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Dane zlecenia</div>
        <div>Numer zlecenia: <b>{order.id}</b></div>
        <div>Kod klienta: <b>{order.clientCode}</b></div>
        <div>Status: <b>{STATUS_LABELS[order.status] || order.status}</b></div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Zleceniodawca i kontakt</div>
        <div>Zleceniodawca: <b>{order.orderingPerson}</b></div>
        <div>Adres: <b>{order.address}</b></div>
        <div>Telefon: <b>{order.phone}</b></div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Szczegóły zlecenia</div>
        <div>Typ kontenera: <b>{order.containerType}</b></div>
        <div>Typ odpadu: <b>{order.wasteType}</b></div>
        <div>Pojazd (dostawa): <b>{order.deliveryVehicle ? `${order.deliveryVehicle.registrationNumber}${order.deliveryVehicle.brand ? ' - ' + order.deliveryVehicle.brand : ''}` : '-'}</b></div>
        <div>Pojazd (zabranie): <b>{order.pickupVehicle ? `${order.pickupVehicle.registrationNumber}${order.pickupVehicle.brand ? ' - ' + order.pickupVehicle.brand : ''}` : '-'}</b></div>
        <div>Przyjął: <b>{order.receivedBy?.name || '-'}</b></div>
        <div>Numer faktury: <b>{order.invoiceNumber || '-'}</b></div>
      </div>
      {order.notes && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Uwagi:</div>
          <div>{order.notes}</div>
        </div>
      )}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Terminy</div>
        <div>Data przyjęcia: <b>{formatDate(order.dateReceived)}</b></div>
        <div>Data dostawy: <b>{formatDate(order.deliveryDate)}</b></div>
        <div>Data odbioru: <b>{formatDate(order.pickupDate)}</b></div>
        <div>Data zakończenia: <b>{formatDate(order.completedAt)}</b></div>
      </div>
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 12, color: '#888' }}>Sporządził:</div>
          <div style={{ borderBottom: '1px solid #bbb', width: 220, height: 28 }}></div>
        </div>
        <div style={{ fontSize: 11, color: '#aaa' }}>Wygenerowano: {formatDate(new Date())}</div>
      </div>
    </div>
  );
} 