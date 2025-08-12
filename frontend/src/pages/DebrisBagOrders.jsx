import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader as DHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, MapPin, User, Phone, FileText, Package, Truck, CreditCard, Hash, StickyNote, CheckCircle2, Plus, BarChart3, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import authFetch from '../utils/authFetch';

function StatusBadge({ status }) {
  return (
    <Badge 
      variant={status === 'COMPLETED' ? 'default' : 'secondary'}
      className={status === 'COMPLETED' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}
    >
      {status === 'COMPLETED' ? 'Zakończone' : 'Do realizacji'}
    </Badge>
  );
}

function InfoRow({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="font-medium text-muted-foreground min-w-0 flex-shrink-0">{label}:</span>
      <span className="text-foreground break-words">{value || '-'}</span>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pl-PL');
}

function DebrisBagOrderCard({ order, onComplete }) {
  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 border-l-4 
      ${order.status === 'COMPLETED' ? 'opacity-75 border-l-green-500 bg-green-50' : 'border-l-yellow-400'}
    `}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            <Hash className="inline h-5 w-5 mr-1" />
            {order.id} - {order.clientName}
          </CardTitle>
          <StatusBadge status={order.status} />
        </div>
        <div className="text-sm text-muted-foreground">
          Numer klienta: {order.clientRecordNumber}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Client Information */}
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">Informacje o kliencie</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={Phone} label="Telefon" value={order.clientPhone} />
            <InfoRow icon={CreditCard} label="Typ płatności" value={order.paymentType} />
            <InfoRow icon={MapPin} label="Adres zamieszkania" value={order.clientAddress} />
            <InfoRow icon={MapPin} label="Adres remontu" value={order.renovationAddress} />
          </div>
        </div>

        {/* Order Details */}
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">Szczegóły zlecenia</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={Hash} label="Numer zlecenia" value={order.orderNumber} />
            <InfoRow icon={Calendar} label="Data przyjęcia" value={formatDate(order.dateReceived)} />
            <InfoRow icon={Package} label="Liczba worków" value={order.numberOfBags} />
            <InfoRow icon={Package} label="Typ worka" value={order.bagType} />
            <InfoRow icon={Hash} label="Numer worka" value={order.bagNumber} />
            <InfoRow icon={CreditCard} label="Cena" value={order.price ? `${order.price} zł` : '-'} />
          </div>
          {order.notes && (
            <div className="mt-3">
              <InfoRow icon={StickyNote} label="Uwagi" value={order.notes} />
            </div>
          )}
        </div>

        {/* Execution Details */}
        {(order.serviceExecutionDate || order.kpoNumber || order.vehicle || order.bagsCollected || order.invoiceNumber) && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">Realizacja</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow icon={Calendar} label="Data realizacji" value={formatDate(order.serviceExecutionDate)} />
              <InfoRow icon={FileText} label="KPO" value={order.kpoNumber} />
              <InfoRow icon={Truck} label="Pojazd" value={order.vehicle?.registrationNumber} />
              <InfoRow icon={Package} label="Worki odebrane" value={order.bagsCollected} />
              <InfoRow icon={Calendar} label="Data faktury" value={formatDate(order.invoiceIssueDate)} />
              <InfoRow icon={FileText} label="Numer faktury" value={order.invoiceNumber} />
            </div>
          </div>
        )}

        {/* Actions */}
        {order.status !== 'COMPLETED' && (
          <div className="pt-4 border-t">
            <Button onClick={() => onComplete(order)} size="sm" className="w-full sm:w-auto">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Oznacz jako zakończone
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DebrisBagOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showComplete, setShowComplete] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [form, setForm] = useState({
    clientRecordNumber: '', clientName: '', clientPhone: '', clientAddress: '', renovationAddress: '', paymentType: '', paymentAmount: '', orderNumber: '', dateReceived: '', numberOfBags: '', bagType: '', bagNumber: '', price: '', notes: ''
  });
  const [completeForm, setCompleteForm] = useState({ serviceExecutionDate: '', kpoNumber: '', vehicleId: '', bagsCollected: '', invoiceIssueDate: '', invoiceNumber: '' });
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => { fetchOrders(); }, []);
  
  function fetchOrders() {
    setLoading(true);
    authFetch('/api/debris-bag-orders')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]); // or handle error, e.g. set an error state
          // Optionally: show a toast or log the error
          // console.error('Failed to fetch orders:', data.error || data);
        }
      })
      .finally(() => setLoading(false));
  }
  
  function handleCreate(e) {
    e.preventDefault();
    const data = { ...form, numberOfBags: Number(form.numberOfBags), price: form.price ? Number(form.price) : null, paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : null, dateReceived: form.dateReceived ? new Date(form.dateReceived).toISOString() : null };
    authFetch('/api/debris-bag-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(r => r.ok && fetchOrders())
      .then(() => setShowCreate(false));
  }
  
  function handleComplete(e) {
    e.preventDefault();
    const data = { ...completeForm, bagsCollected: completeForm.bagsCollected ? Number(completeForm.bagsCollected) : null, serviceExecutionDate: completeForm.serviceExecutionDate ? new Date(completeForm.serviceExecutionDate).toISOString() : null, invoiceIssueDate: completeForm.invoiceIssueDate ? new Date(completeForm.invoiceIssueDate).toISOString() : null, vehicleId: completeForm.vehicleId ? Number(completeForm.vehicleId) : null };
    authFetch(`/api/debris-bag-orders/${showComplete.id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(r => r.ok && fetchOrders())
      .then(() => setShowComplete(null));
  }

  function fetchMonthlyReport() {
    setReportLoading(true);
    authFetch(`/api/debris-bag-orders/report/monthly?year=${selectedYear}&month=${selectedMonth}`)
      .then(r => r.json())
      .then(data => {
        setReportData(data);
        setShowReport(true);
      })
      .catch(err => console.error('Error fetching report:', err))
      .finally(() => setReportLoading(false));
  }
  
  function handleMonthPickerChange(e) {
    const value = e.target.value; // yyyy-MM
    if (!value) return;
    const [y, m] = value.split('-').map(Number);
    if (y && m) {
      setSelectedYear(y);
      setSelectedMonth(m);
    }
  }
  
  async function exportReportPdf() {
    if (!reportData) return;
    const monthStr = String(selectedMonth).padStart(2, '0');
    const title = `Raport worki gruzowe - ${monthStr}/${selectedYear}`;

    // Build minimal HTML summary for PDF
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));

    const bagTypesRows = Object.entries(reportData.breakdowns.bagTypes || {})
      .map(([type, count]) => `<tr><td>Typ ${escapeHtml(type)}</td><td style="text-align:right">${count}</td></tr>`) 
      .join('');

    const paymentTypesRows = Object.entries(reportData.breakdowns.paymentTypes || {})
      .map(([type, count]) => `<tr><td>${escapeHtml(type)}</td><td style="text-align:right">${count}</td></tr>`) 
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
            h1 { font-size: 20px; margin: 0 0 8px 0; }
            h2 { font-size: 16px; margin: 16px 0 8px 0; }
            .muted { color: #666; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 6px 8px; border-bottom: 1px solid #eee; }
            th { text-align: left; background: #fafafa; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <div class="muted">Okres: ${monthStr}/${selectedYear}</div>

          <div class="grid" style="margin-top: 12px">
            <div class="card">
              <h2>Podsumowanie</h2>
              <div class="row"><div>Łącznie zleceń</div><div><strong>${reportData.summary.totalOrders}</strong></div></div>
              <div class="row"><div>Łącznie worków</div><div><strong>${reportData.summary.totalBags}</strong></div></div>
              <div class="row"><div>Przychód (suma cen)</div><div><strong>${Number(reportData.summary.totalRevenue).toFixed(2)} zł</strong></div></div>
            </div>
            <div class="card">
              <h2>Efektywność</h2>
              <div class="row"><div>Zakończone</div><div><strong>${reportData.summary.completedOrders}</strong></div></div>
              <div class="row"><div>Oczekujące</div><div><strong>${reportData.summary.pendingOrders}</strong></div></div>
              <div class="row"><div>Średnia wartość zlecenia</div><div><strong>${reportData.summary.averageOrderValue} zł</strong></div></div>
            </div>
          </div>

          <div class="grid" style="margin-top: 12px">
            <div class="card">
              <h2>Typy worków</h2>
              <table>
                <thead><tr><th>Typ</th><th>Ilość</th></tr></thead>
                <tbody>${bagTypesRows || '<tr><td colspan="2" class="muted">Brak danych</td></tr>'}</tbody>
              </table>
            </div>
            <div class="card">
              <h2>Metody płatności</h2>
              <table>
                <thead><tr><th>Metoda</th><th>Liczba zleceń</th></tr></thead>
                <tbody>${paymentTypesRows || '<tr><td colspan="2" class="muted">Brak danych</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        </body>
      </html>`;

    try {
      const fileName = `raport-worki-gruzowe_${selectedYear}-${monthStr}.pdf`;
      const response = await authFetch('/api/pdf/work-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, fileName })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('PDF export failed');
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  }

  useEffect(() => {
    if (showComplete) {
      authFetch('/api/vehicles').then(r => r.json()).then(setVehicles);
    }
  }, [showComplete]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Zlecenia Worków Gruzowych</h1>
        <div className="flex items-center gap-2">
          {/* Period selector (single month input) */}
          <Input type="month" value={`${String(selectedYear)}-${String(selectedMonth).padStart(2,'0')}`} onChange={handleMonthPickerChange} className="w-[180px]" />
          <Button onClick={fetchMonthlyReport} disabled={reportLoading} variant="outline" size="lg">
            <BarChart3 className="h-4 w-4 mr-2" />
            {reportLoading ? 'Ładowanie...' : 'Raport miesięczny'}
          </Button>
          <Button onClick={() => setShowCreate(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj nowe zlecenie
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Ładowanie...</div>
        </div>
      ) : orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Brak zleceń</h3>
            <p className="text-muted-foreground mb-4">Nie znaleziono żadnych zleceń worków gruzowych.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj pierwsze zlecenie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <DebrisBagOrderCard key={order.id} order={order} onComplete={o => setShowComplete(o)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nowe zlecenie worków gruzowych
            </DialogTitle>
          </DHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Informacje o kliencie</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientRecordNumber">Numer klienta</Label>
                  <Input id="clientRecordNumber" value={form.clientRecordNumber} onChange={e => setForm(f => ({ ...f, clientRecordNumber: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nazwa klienta</Label>
                  <Input id="clientName" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefon</Label>
                  <Input id="clientPhone" value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentType">Typ płatności</Label>
                  <Input id="paymentType" value={form.paymentType} onChange={e => setForm(f => ({ ...f, paymentType: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Adres zamieszkania</Label>
                  <Input id="clientAddress" value={form.clientAddress} onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renovationAddress">Adres remontu</Label>
                  <Input id="renovationAddress" value={form.renovationAddress} onChange={e => setForm(f => ({ ...f, renovationAddress: e.target.value }))} required />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Szczegóły zlecenia</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Numer zlecenia</Label>
                  <Input id="orderNumber" value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateReceived">Data przyjęcia</Label>
                  <Input id="dateReceived" type="date" value={form.dateReceived} onChange={e => setForm(f => ({ ...f, dateReceived: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfBags">Liczba worków</Label>
                  <Input id="numberOfBags" type="number" value={form.numberOfBags} onChange={e => setForm(f => ({ ...f, numberOfBags: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bagType">Typ worka</Label>
                  <Input id="bagType" value={form.bagType} onChange={e => setForm(f => ({ ...f, bagType: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bagNumber">Numer worka</Label>
                  <Input id="bagNumber" value={form.bagNumber} onChange={e => setForm(f => ({ ...f, bagNumber: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Cena</Label>
                  <Input id="price" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Uwagi</Label>
                <Input id="notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="flex-1">Zapisz</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Anuluj</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Modal */}
      <Dialog open={!!showComplete} onOpenChange={() => setShowComplete(null)}>
        <DialogContent className="max-w-lg">
          <DHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Oznacz jako zakończone
            </DialogTitle>
          </DHeader>
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceExecutionDate">Data realizacji</Label>
              <Input id="serviceExecutionDate" type="date" value={completeForm.serviceExecutionDate} onChange={e => setCompleteForm(f => ({ ...f, serviceExecutionDate: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleId">Pojazd</Label>
              <Select value={completeForm.vehicleId} onValueChange={value => setCompleteForm(f => ({ ...f, vehicleId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz pojazd" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id.toString()}>{v.registrationNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bagsCollected">Liczba odebranych worków</Label>
              <Input id="bagsCollected" type="number" value={completeForm.bagsCollected} onChange={e => setCompleteForm(f => ({ ...f, bagsCollected: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kpoNumber">KPO</Label>
              <Input id="kpoNumber" value={completeForm.kpoNumber} onChange={e => setCompleteForm(f => ({ ...f, kpoNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceIssueDate">Data faktury</Label>
              <Input id="invoiceIssueDate" type="date" value={completeForm.invoiceIssueDate} onChange={e => setCompleteForm(f => ({ ...f, invoiceIssueDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Numer faktury</Label>
              <Input id="invoiceNumber" value={completeForm.invoiceNumber} onChange={e => setCompleteForm(f => ({ ...f, invoiceNumber: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="flex-1">Oznacz jako zakończone</Button>
              <Button type="button" variant="outline" onClick={() => setShowComplete(null)}>Anuluj</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Monthly Report Modal */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Raport miesięczny - {reportData?.period?.month}/{reportData?.period?.year}
            </DialogTitle>
            <div className="mt-2">
              <Button size="sm" onClick={exportReportPdf}>Eksportuj PDF</Button>
            </div>
          </DHeader>
          
          {reportData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-muted-foreground">Łącznie zleceń</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{reportData.summary.totalOrders}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {reportData.summary.completedOrders} zakończone, {reportData.summary.pendingOrders} oczekujące
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-muted-foreground">Łącznie worków</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{reportData.summary.totalBags}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {reportData.summary.bagsCollected} odebrane ({reportData.summary.collectionRate}%)
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-muted-foreground">Przychód</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{reportData.summary.totalRevenue.toFixed(2)} zł</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Średnio {reportData.summary.averageOrderValue} zł/zlecenie
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-muted-foreground">Efektywność</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{reportData.summary.completionRate}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {reportData.summary.averageBagsPerOrder} worków/zlecenie
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bag Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Typy worków</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportData.breakdowns.bagTypes).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="font-medium">Typ {type}</span>
                          <span className="text-muted-foreground">{count} worków</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Typy płatności</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportData.breakdowns.paymentTypes).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="font-medium">{type}</span>
                          <span className="text-muted-foreground">{count} zleceń</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Usage */}
              {Object.keys(reportData.breakdowns.vehicleUsage).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Użycie pojazdów</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(reportData.breakdowns.vehicleUsage).map(([vehicle, count]) => (
                        <div key={vehicle} className="flex justify-between items-center">
                          <span className="font-medium">{vehicle}</span>
                          <span className="text-muted-foreground">{count} zleceń</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Clients */}
              {reportData.topClients.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Najlepsi klienci</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.topClients.map((client, index) => (
                        <div key={client.client} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{client.client}</div>
                            <div className="text-sm text-muted-foreground">
                              {client.orders} zleceń, {client.bags} worków
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{client.revenue.toFixed(2)} zł</div>
                            <div className="text-sm text-muted-foreground">
                              Średnio {(client.revenue / client.orders).toFixed(2)} zł/zlecenie
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Podział dzienny</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(reportData.breakdowns.daily)
                      .sort(([a], [b]) => new Date(a) - new Date(b))
                      .map(([date, data]) => (
                        <div key={date} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{new Date(date).toLocaleDateString('pl-PL')}</div>
                            <div className="text-sm text-muted-foreground">
                              {data.orders} zleceń, {data.bags} worków
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{data.revenue.toFixed(2)} zł</div>
                            <div className="text-sm text-muted-foreground">
                              {data.completed} zakończone
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Orders List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lista zleceń</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.orders.map(order => (
                      <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">#{order.id} - {order.clientName}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.orderNumber} • {new Date(order.dateReceived).toLocaleDateString('pl-PL')} • {order.numberOfBags} worków typu {order.bagType}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{order.price ? `${order.price.toFixed(2)} zł` : '-'}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.status === 'COMPLETED' ? 'Zakończone' : 'Oczekujące'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 