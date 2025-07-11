import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Noto Sans font for Polish characters
Font.register({ family: 'NotoSans', src: '/fonts/NotoSans-Regular.ttf' });

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: 'NotoSans', fontSize: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  orderBlock: { marginBottom: 18, paddingBottom: 12, borderBottom: '1 solid #bbb' },
  label: { fontWeight: 'bold', marginRight: 4 },
  value: {},
  line: { flexDirection: 'row', marginBottom: 2 },
});

// Polish labels for visible fields (customize as needed)
const FIELD_LABELS = {
  number: 'Numer zlecenia',
  receivedBy: 'Przyjął',
  wasteType: 'Odpad',
  rodzaj: 'Rodzaj',
  kontener: 'Kontener',
  address: 'Adres',
  dateReceived: 'Zgłoszenie',
  realizationDate: 'Realizacja',
  notes: 'Uwagi',
};

// Helper to get visible fields from a work order
function getVisibleFields(order) {
  return {
    number: order.number,
    receivedBy: order.receivedBy,
    wasteType: order.wasteType,
    rodzaj: order.rodzaj,
    kontener: order.kontener,
    address: order.address,
    dateReceived: order.dateReceived ? new Date(order.dateReceived).toLocaleDateString('pl-PL') : '',
    realizationDate: order.realizationDate ? new Date(order.realizationDate).toLocaleDateString('pl-PL') : '',
    notes: order.notes,
  };
}

const WorkOrdersPDF = ({ orders, title = 'Zlecenia pracy' }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>
      {orders.map((order, idx) => {
        const fields = getVisibleFields(order);
        return (
          <View key={order.id || idx} style={styles.orderBlock}>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.number}:</Text><Text style={styles.value}>{fields.number || ''}</Text></View>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.receivedBy}:</Text><Text style={styles.value}>{fields.receivedBy || ''}</Text></View>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.wasteType}:</Text><Text style={styles.value}>{fields.wasteType || ''}</Text></View>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.rodzaj}:</Text><Text style={styles.value}>{fields.rodzaj || ''}</Text></View>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.kontener}:</Text><Text style={styles.value}>{fields.kontener || ''}</Text></View>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.address}:</Text><Text style={styles.value}>{fields.address || ''}</Text></View>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.dateReceived}:</Text><Text style={styles.value}>{fields.dateReceived || ''}</Text></View>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.realizationDate}:</Text><Text style={styles.value}>{fields.realizationDate || ''}</Text></View>
            <View style={styles.line}><Text style={styles.label}>{FIELD_LABELS.notes}:</Text><Text style={styles.value}>{fields.notes || ''}</Text></View>
          </View>
        );
      })}
    </Page>
  </Document>
);

export default WorkOrdersPDF; 