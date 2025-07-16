import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Truck, 
  Package, 
  CheckCircle, 
  Copy,
  MoreHorizontal,
  Calendar,
  User,
  MapPin,
  Phone,
  FileText,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import OneTimeOrderCard from '../components/OneTimeOrderCard';
import authFetch from '../utils/authFetch';
import OneTimeOrderPdf from '../components/OneTimeOrderPdf';
import { renderToStaticMarkup } from 'react-dom/server';

const STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie statusy' },
  { value: 'AWAITING_EXECUTION', label: 'Oczekuje na realizację' },
  { value: 'CONTAINER_DELIVERED', label: 'Kontener dostarczony' },
  { value: 'AWAITING_COMPLETION', label: 'Oczekuje na odbiór' },
  { value: 'COMPLETED', label: 'Zakończone' },
  { value: 'CANCELLED', label: 'Anulowane' },
];

const CONTAINER_TYPES = ['KP5', 'KP7', 'KP10', 'KP36'];

const STATUS_COLORS = {
  'AWAITING_EXECUTION': 'bg-amber-100 text-amber-800 border-amber-200',
  'CONTAINER_DELIVERED': 'bg-blue-100 text-blue-800 border-blue-200',
  'AWAITING_COMPLETION': 'bg-purple-100 text-purple-800 border-purple-200',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_LABELS = {
  'AWAITING_EXECUTION': 'Oczekuje na realizację',
  'CONTAINER_DELIVERED': 'Kontener dostarczony',
  'AWAITING_COMPLETION': 'Oczekuje na odbiór',
  'COMPLETED': 'Zakończone',
  'CANCELLED': 'Anulowane',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}

interface Order {
  id: number;
  dateReceived: string;
  deliveryDate: string;
  pickupDate?: string;
  clientCode: string;
  orderingPerson: string;
  address: string;
  phone: string;
  containerType: string;
  wasteType: string;
  status: string;
  invoiceNumber?: string;
  pdfFile?: string;
  receivedBy?: { name: string };
  receivedById?: number;
  vehicle?: { registrationNumber: string; brand?: string };
}

interface Vehicle {
  id: number;
  registrationNumber: string;
  brand: string;
}

export default function OneTimeOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dateReceived');
  const [order, setOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    dateReceived: '',
    deliveryDate: '',
    pdfFile: null,
    clientCode: '',
    orderingPerson: '',
    address: '',
    phone: '',
    containerType: '',
    wasteType: '',
    notes: '',
    deliveryVehicleId: '',
    pickupVehicleId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [assignOrder, setAssignOrder] = useState(null);
  const [assignVehicleId, setAssignVehicleId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [pickupOrder, setPickupOrder] = useState(null);
  const [pickupDate, setPickupDate] = useState('');
  const [pickingUp, setPickingUp] = useState(false);
  const [completeOrder, setCompleteOrder] = useState(null);
  const [completeClientCode, setCompleteClientCode] = useState('');
  const [completeInvoiceNumber, setCompleteInvoiceNumber] = useState('');
  const [completing, setCompleting] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelOrder, setCancelOrder] = useState(null);

  const { toast } = useToast();

  // Fetch vehicles when assignOrder modal opens
  useEffect(() => {
    if (assignOrder) {
      authFetch('/api/vehicles')
        .then(res => res.json())
        .then(data => setVehicles(Array.isArray(data) ? data : []));
    }
  }, [assignOrder]);

  useEffect(() => {
    fetchOrders();
  }, [status, clientCode, from, to, search, sortBy, order]);

  // Get logged-in user from localStorage (for demo)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setForm(f => ({ ...f, orderingPerson: payload.name || '' }));
      } catch {}
    }
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (clientCode) params.append('clientCode', clientCode);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (order) params.append('order', order);
    
    try {
      const res = await authFetch(`/api/one-time-orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać zleceń",
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  async function handleAddOrder(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create order (without PDF)
      const { pdfFile, ...orderDataRaw } = form;
      // Convert dates to ISO
      if (orderDataRaw.dateReceived) orderDataRaw.dateReceived = new Date(orderDataRaw.dateReceived).toISOString();
      if (orderDataRaw.deliveryDate) orderDataRaw.deliveryDate = new Date(orderDataRaw.deliveryDate).toISOString();
      // Convert empty string vehicle IDs to null
      const orderData = {
        ...orderDataRaw,
        deliveryVehicleId: orderDataRaw.deliveryVehicleId || null,
        pickupVehicleId: orderDataRaw.pickupVehicleId || null,
      };
      
      const res = await authFetch('/api/one-time-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      if (!res.ok) throw new Error('Nie udało się utworzyć zlecenia');
      const newOrder = await res.json();
      
      // 2. Upload PDF if provided
      if (pdfFile) {
        const fd = new FormData();
        fd.append('file', pdfFile);
        await authFetch(`/api/one-time-orders/${newOrder.id}/upload`, {
          method: 'POST',
          body: fd,
        });
      }
      
      setShowModal(false);
      setForm({ 
        dateReceived: '', 
        deliveryDate: '', 
        pdfFile: null, 
        clientCode: '', 
        orderingPerson: form.orderingPerson, 
        address: '', 
        phone: '', 
        containerType: '', 
        wasteType: '',
        notes: '',
        deliveryVehicleId: '',
        pickupVehicleId: '',
      });
      
      fetchOrders();
      toast({
        title: "Sukces",
        description: "Zlecenie utworzone pomyślnie",
      });
    } catch (err) {
      toast({
        title: "Błąd",
        description: err instanceof Error ? err.message : "Nie udało się utworzyć zlecenia",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  }

  async function handleAssignVehicle(e) {
    e.preventDefault();
    setAssigning(true);
    if (!assignOrder) return;
    try {
      await authFetch(`/api/one-time-orders/${assignOrder.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryVehicleId: Number(assignVehicleId) }),
      });
      setAssignOrder(null);
      setAssignVehicleId('');
      fetchOrders();
      toast({
        title: "Sukces",
        description: "Pojazd przypisany pomyślnie",
      });
    } catch (err) {
      toast({
        title: "Błąd",
        description: "Nie udało się przypisać pojazdu",
        variant: "destructive",
      });
    }
    setAssigning(false);
  }

  async function handlePickup(e) {
    e.preventDefault();
    setPickingUp(true);
    if (!pickupOrder) return;
    try {
      await authFetch(`/api/one-time-orders/${pickupOrder.id}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupDate, pickupVehicleId: Number(pickupOrder.pickupVehicleId) }),
      });
      setPickupOrder(null);
      setPickupDate('');
      fetchOrders();
      toast({
        title: "Sukces",
        description: "Odbiór kontenera zapisany pomyślnie",
      });
    } catch (err) {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać odbioru",
        variant: "destructive",
      });
    }
    setPickingUp(false);
  }

  async function handleComplete(e) {
    e.preventDefault();
    setCompleting(true);
    if (!completeOrder) return;
    try {
      await authFetch(`/api/one-time-orders/${completeOrder.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientCode: completeOrder.clientCode, invoiceNumber: completeInvoiceNumber }),
      });
      setCompleteOrder(null);
      setCompleteClientCode('');
      setCompleteInvoiceNumber('');
      fetchOrders();
      toast({
        title: "Sukces",
        description: "Zlecenie zakończone pomyślnie",
      });
    } catch (err) {
      toast({
        title: "Błąd",
        description: "Nie udało się zakończyć zlecenia",
        variant: "destructive",
      });
    }
    setCompleting(false);
  }

  async function handleDuplicate(order) {
    try {
      const res = await authFetch(`/api/one-time-orders/${order.id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Nie udało się skopiować zlecenia');
      fetchOrders();
      toast({
        title: "Sukces",
        description: "Zlecenie skopiowane pomyślnie",
      });
    } catch (err) {
      toast({
        title: "Błąd",
        description: "Nie udało się skopiować zlecenia",
        variant: "destructive",
      });
    }
  }

  // Upload PDF
  async function handleUploadPdf(order) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = (e.target.files?.[0]);
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await authFetch(`/api/one-time-orders/${order.id}/upload`, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) throw new Error('Nie udało się wgrać pliku PDF');
        fetchOrders();
        toast({
          title: "Sukces",
          description: "Plik PDF wgrany pomyślnie",
        });
      } catch (err) {
        toast({
          title: "Błąd",
          description: "Nie udało się wgrać pliku PDF",
          variant: "destructive",
        });
      }
    };
    input.click();
  }

  // Download PDF
  async function handleDownloadPdf(order) {
    const res = await fetch(`/api/one-time-orders/${order.id}/merged-pdf`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    if (!res.ok) {
      toast({ title: 'Błąd', description: 'Nie udało się pobrać PDF', variant: 'destructive' });
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zlecenie-jednorazowe-${order.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      a.remove();
    }, 10000);
  }

  // View uploaded PDF (not summary)
  async function handleViewOrderPdf(order) {
    if (!order.pdfFile) return;
    try {
      const res = await authFetch(order.pdfFile);
      if (!res.ok) throw new Error('Nie udało się pobrać pliku PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      toast({
        title: "Błąd",
        description: "Nie udało się otworzyć pliku PDF",
        variant: "destructive",
      });
    }
  }

  function handleSort(col) {
    if (sortBy === col) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setOrder('asc');
    }
  }

  const getStatusBadge = (status) => {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
      <Badge variant="outline" className={colorClass}>
        {STATUS_LABELS[status] || status.replace('_', ' ')}
      </Badge>
    );
  };

  function handleEditOrder(order) {
    setEditOrder(order);
    setEditForm({
      dateReceived: order.dateReceived ? order.dateReceived.slice(0, 10) : '',
      deliveryDate: order.deliveryDate ? order.deliveryDate.slice(0, 10) : '',
      clientCode: order.clientCode || '',
      orderingPerson: order.orderingPerson || '',
      address: order.address || '',
      phone: order.phone || '',
      containerType: order.containerType || '',
      wasteType: order.wasteType || '',
      notes: order.notes || '',
      deliveryVehicleId: order.deliveryVehicleId || '',
      pickupVehicleId: order.pickupVehicleId || '',
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditing(true);
    try {
      const data = { ...editForm };
      if (data.dateReceived) data.dateReceived = new Date(data.dateReceived).toISOString();
      if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate).toISOString();
      await authFetch(`/api/one-time-orders/${editOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditOrder(null);
      fetchOrders();
      toast({ title: 'Sukces', description: 'Zlecenie zaktualizowane.' });
    } catch (err) {
      toast({ title: 'Błąd', description: 'Nie udało się zaktualizować zlecenia', variant: 'destructive' });
    }
    setEditing(false);
  }

  function handleCancelOrder(order) {
    setCancelOrder(order);
    setShowCancelDialog(true);
  }

  async function confirmCancelOrder() {
    if (!cancelOrder) return;
    try {
      await authFetch(`/api/one-time-orders/${cancelOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      setShowCancelDialog(false);
      setCancelOrder(null);
      fetchOrders();
      toast({ title: 'Sukces', description: 'Zlecenie anulowane.' });
    } catch (err) {
      toast({ title: 'Błąd', description: 'Nie udało się anulować zlecenia', variant: 'destructive' });
    }
  }

  async function handleDeleteOrder(order) {
    try {
      const res = await fetch(`/api/one-time-orders/${order.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Błąd podczas usuwania zlecenia');
      setOrders(orders => orders.filter(o => o.id !== order.id));
      toast({ title: 'Usunięto', description: 'Zlecenie zostało usunięte', variant: 'success' });
    } catch (err) {
      toast({ title: 'Błąd', description: err.message || 'Nie udało się usunąć zlecenia', variant: 'destructive' });
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Zlecenia jednorazowe</h1>
      <Button className="mb-4" onClick={() => setShowModal(true)}>
        <Plus className="mr-2 h-4 w-4" /> Dodaj nowe zlecenie
      </Button>
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dodaj nowe zlecenie jednorazowe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddOrder} className="space-y-3">
              <div>
                <Label htmlFor="dateReceived">Data otrzymania</Label>
                <Input
                  type="date"
                  id="dateReceived"
                  required
                  value={form.dateReceived}
                  onChange={e => setForm(f => ({ ...f, dateReceived: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Data dostawy</Label>
                <Input
                  type="date"
                  id="deliveryDate"
                  required
                  value={form.deliveryDate}
                  onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="pdfFile">Plik PDF (opcjonalnie)</Label>
                <Input
                  type="file"
                  id="pdfFile"
                  accept="application/pdf"
                  onChange={e => setForm(f => ({ ...f, pdfFile: e.target.files?.[0] }))}
                />
              </div>
              <div>
                <Label htmlFor="clientCode">Kod klienta</Label>
                <Input
                  type="text"
                  id="clientCode"
                  required
                  value={form.clientCode}
                  onChange={e => setForm(f => ({ ...f, clientCode: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="orderingPerson">Zleceniodawca</Label>
                <Input
                  type="text"
                  id="orderingPerson"
                  required
                  value={form.orderingPerson}
                  onChange={e => setForm(f => ({ ...f, orderingPerson: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="address">Adres</Label>
                <Input
                  type="text"
                  id="address"
                  required
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  type="text"
                  id="phone"
                  required
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="containerType">Typ kontenera</Label>
                <Select onValueChange={value => setForm(f => ({ ...f, containerType: value }))} defaultValue={form.containerType}>
                  <SelectTrigger id="containerType">
                    <SelectValue placeholder="Wybierz typ kontenera" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTAINER_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="wasteType">Typ odpadu</Label>
                <Input
                  type="text"
                  id="wasteType"
                  required
                  value={form.wasteType}
                  onChange={e => setForm(f => ({ ...f, wasteType: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Uwagi</Label>
                <Input
                  type="text"
                  id="notes"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Zapisywanie...' : 'Zapisz zlecenie'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {assignOrder && (
        <Dialog open={!!assignOrder} onOpenChange={setAssignOrder}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Przypisz pojazd do zlecenia #{assignOrder.id}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignVehicle} className="space-y-3">
              <div>
                <Label htmlFor="assignVehicle">Pojazd</Label>
                <Select onValueChange={value => setAssignVehicleId(value)} defaultValue={assignVehicleId}>
                  <SelectTrigger id="assignVehicle">
                    <SelectValue placeholder="Wybierz pojazd" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.registrationNumber} - {v.brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={assigning}>
                {assigning ? 'Przypisywanie...' : 'Zapisz przypisanie pojazdu'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {pickupOrder && (
        <Dialog open={!!pickupOrder} onOpenChange={setPickupOrder}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Zapisz odbiór kontenera dla zlecenia #{pickupOrder.id}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePickup} className="space-y-3">
              <div>
                <Label htmlFor="pickupDate">Data odbioru</Label>
                <Input
                  type="date"
                  id="pickupDate"
                  required
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pickupVehicle">Pojazd odbioru</Label>
                <Select onValueChange={value => setPickupOrder(prev => ({ ...prev, pickupVehicleId: value }))} defaultValue={pickupOrder.pickupVehicleId}>
                  <SelectTrigger id="pickupVehicle">
                    <SelectValue placeholder="Wybierz pojazd" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.registrationNumber} - {v.brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={pickingUp}>
                {pickingUp ? 'Zapisywanie...' : 'Zapisz odbiór'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {completeOrder && (
        <Dialog open={!!completeOrder} onOpenChange={setCompleteOrder}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Zakończ zlecenie #{completeOrder.id}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleComplete} className="space-y-3">
              <div>
                <Label htmlFor="completeInvoiceNumber">Numer faktury</Label>
                <Input
                  type="text"
                  id="completeInvoiceNumber"
                  required
                  value={completeInvoiceNumber}
                  onChange={e => setCompleteInvoiceNumber(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={completing} onClick={e => {
                e.preventDefault();
                if (window.confirm('Czy na pewno chcesz zakończyć to zlecenie?')) handleComplete(e);
              }}>
                {completing ? 'Zakończanie...' : 'Oznacz jako zakończone'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {editOrder && (
        <Dialog open={!!editOrder} onOpenChange={setEditOrder}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edytuj zlecenie jednorazowe #{editOrder.id}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <Label htmlFor="editDateReceived">Data otrzymania</Label>
                <Input
                  type="date"
                  id="editDateReceived"
                  required
                  value={editForm.dateReceived}
                  onChange={e => setEditForm(f => ({ ...f, dateReceived: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editDeliveryDate">Data dostawy</Label>
                <Input
                  type="date"
                  id="editDeliveryDate"
                  required
                  value={editForm.deliveryDate}
                  onChange={e => setEditForm(f => ({ ...f, deliveryDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editClientCode">Kod klienta</Label>
                <Input
                  type="text"
                  id="editClientCode"
                  required
                  value={editForm.clientCode}
                  onChange={e => setEditForm(f => ({ ...f, clientCode: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editOrderingPerson">Zleceniodawca</Label>
                <Input
                  type="text"
                  id="editOrderingPerson"
                  required
                  value={editForm.orderingPerson}
                  onChange={e => setEditForm(f => ({ ...f, orderingPerson: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editAddress">Adres</Label>
                <Input
                  type="text"
                  id="editAddress"
                  required
                  value={editForm.address}
                  onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Telefon</Label>
                <Input
                  type="text"
                  id="editPhone"
                  required
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editContainerType">Typ kontenera</Label>
                <Select onValueChange={value => setEditForm(f => ({ ...f, containerType: value }))} defaultValue={editForm.containerType}>
                  <SelectTrigger id="editContainerType">
                    <SelectValue placeholder="Wybierz typ kontenera" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTAINER_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editWasteType">Typ odpadu</Label>
                <Input
                  type="text"
                  id="editWasteType"
                  required
                  value={editForm.wasteType}
                  onChange={e => setEditForm(f => ({ ...f, wasteType: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editNotes">Uwagi</Label>
                <Input
                  type="text"
                  id="editNotes"
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editDeliveryVehicle">Pojazd dostawy</Label>
                <Select onValueChange={value => setEditForm(f => ({ ...f, deliveryVehicleId: value }))} defaultValue={editForm.deliveryVehicleId}>
                  <SelectTrigger id="editDeliveryVehicle">
                    <SelectValue placeholder="Wybierz pojazd" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.registrationNumber} - {v.brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editPickupVehicle">Pojazd odbioru</Label>
                <Select onValueChange={value => setEditForm(f => ({ ...f, pickupVehicleId: value }))} defaultValue={editForm.pickupVehicleId}>
                  <SelectTrigger id="editPickupVehicle">
                    <SelectValue placeholder="Wybierz pojazd" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.registrationNumber} - {v.brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={editing}>
                {editing ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {showCancelDialog && (
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Czy na pewno chcesz anulować to zlecenie?</DialogTitle>
            </DialogHeader>
            <div className="py-2">Ta operacja nie może zostać cofnięta.</div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Nie</Button>
              <Button variant="destructive" onClick={confirmCancelOrder}>Tak, anuluj</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="flex flex-wrap gap-2 items-end mb-4 bg-muted/50 p-3 rounded-lg border border-muted">
        <Select value={status} onValueChange={value => setStatus(value)}>
          <SelectTrigger className="min-w-[140px]">
            <SelectValue placeholder="Wszystkie statusy" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.filter(opt => opt.value !== '').map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Kod klienta"
          value={clientCode}
          onChange={e => setClientCode(e.target.value)}
          className="w-[140px]"
        />
        <Input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          className="w-[140px]"
        />
        <Input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          className="w-[140px]"
        />
        <Input
          type="text"
          placeholder="Szukaj..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px]"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center p-8">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-8 w-3/4 mt-2 mx-auto" />
            <Skeleton className="h-8 w-1/4 mt-2 mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="col-span-full text-center p-8">Nie znaleziono zleceń.</div>
        ) : orders.map(order => (
          <OneTimeOrderCard
            key={order.id}
            order={order}
            onAssign={o => setAssignOrder(o)}
            onPickup={o => setPickupOrder(o)}
            onComplete={o => setCompleteOrder(o)}
            onDuplicate={handleDuplicate}
            onDownloadPdf={handleDownloadPdf}
            onUploadPdf={handleUploadPdf}
            onViewPdf={handleViewOrderPdf}
            onEdit={handleEditOrder}
            onCancel={handleCancelOrder}
            onDelete={() => {
              if (window.confirm('Czy na pewno chcesz usunąć to zlecenie?')) {
                handleDeleteOrder(order);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
} 