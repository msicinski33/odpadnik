import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, MapPin, User, Truck, FileText, CheckCircle, Copy, Download, Upload, Eye, Package, Phone, Pencil, X, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader as DHeader, DialogTitle, DialogFooter } from './ui/dialog';

const STATUS_VARIANTS = {
  'AWAITING_EXECUTION': 'destructive',
  'CONTAINER_DELIVERED': 'secondary', 
  'AWAITING_COMPLETION': 'outline',
  'COMPLETED': 'default',
};

const STATUS_LABELS = {
  'AWAITING_EXECUTION': 'Oczekuje na realizację',
  'CONTAINER_DELIVERED': 'Kontener dostarczony',
  'AWAITING_COMPLETION': 'Oczekuje na odbiór',
  'COMPLETED': 'Zakończone',
  'CANCELLED': 'Anulowane',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

function InfoRow({ icon: Icon, label, value, iconColor = "text-muted-foreground" }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
      <span className="text-sm font-medium text-muted-foreground min-w-[100px]">{label}:</span>
      <span className="text-sm text-foreground">{value || '-'}</span>
    </div>
  );
}

export default function OneTimeOrderCard({ order, onAssign, onPickup, onComplete, onDuplicate, onDownloadPdf, onUploadPdf, onViewPdf, onEdit, onCancel, onDelete }) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  let cardColor = "border-l-primary/20";
  if (order.status === 'COMPLETED') {
    cardColor = "border-l-green-500 bg-green-50";
  } else if (order.status === 'CANCELLED') {
    cardColor = "border-l-red-500 bg-red-50";
  }

  return (
    <Card className={`hover:shadow-md transition-all duration-200 border-l-4 group ${cardColor}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">{order.clientCode}</h3>
            <p className="text-sm text-muted-foreground">Zlecenie #{order.id}</p>
          </div>
          <Badge variant={STATUS_VARIANTS[order.status] || 'outline'} className="ml-4">
            {STATUS_LABELS[order.status] || 'Nieznany'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Contact & Location */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground mb-3">Dane kontaktowe</h4>
          <InfoRow icon={User} label="Zamawiający" value={order.orderingPerson} />
          <InfoRow icon={MapPin} label="Adres" value={order.address} />
          <InfoRow icon={Phone} label="Telefon" value={order.phone} />
        </div>

        {/* Order Details */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground mb-3">Szczegóły zlecenia</h4>
          <InfoRow icon={Package} label="Kontener" value={order.containerType} />
          <InfoRow icon={FileText} label="Rodzaj odpadów" value={order.wasteType} />
          <InfoRow icon={User} label="Przyjął" value={order.receivedBy?.name} />
        </div>

        {/* Timeline */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground mb-3">Harmonogram</h4>
          <InfoRow icon={Calendar} label="Data przyjęcia" value={formatDate(order.dateReceived)} iconColor="text-green-600" />
          <InfoRow icon={Calendar} label="Data dostawy" value={formatDate(order.deliveryDate)} iconColor="text-blue-600" />
          <InfoRow icon={Calendar} label="Data odbioru" value={formatDate(order.pickupDate)} iconColor="text-purple-600" />
        </div>

        {/* Execution Details */}
        {(order.deliveryVehicle || order.pickupVehicle || order.invoiceNumber) && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground mb-3">Realizacja</h4>
            {order.deliveryVehicle && (
              <InfoRow 
                icon={Truck} 
                label="Pojazd (dostawa)" 
                value={`${order.deliveryVehicle.registrationNumber}${order.deliveryVehicle.brand ? ' - ' + order.deliveryVehicle.brand : ''}`} 
              />
            )}
            {order.pickupVehicle && (
              <InfoRow 
                icon={Truck} 
                label="Pojazd (zabranie)" 
                value={`${order.pickupVehicle.registrationNumber}${order.pickupVehicle.brand ? ' - ' + order.pickupVehicle.brand : ''}`} 
              />
            )}
            <InfoRow icon={FileText} label="Nr faktury" value={order.invoiceNumber} />
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground mb-3">Uwagi</h4>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {/* Primary Actions */}
            <Button 
              variant={order.status === 'AWAITING_EXECUTION' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onAssign(order)} 
              disabled={order.status !== 'AWAITING_EXECUTION'}
              className="flex-1 min-w-[120px]"
            >
              <Truck className="h-4 w-4 mr-2" />
              Przydziel
            </Button>
            <Button 
              variant={order.status === 'CONTAINER_DELIVERED' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onPickup(order)} 
              disabled={order.status !== 'CONTAINER_DELIVERED'}
              className="flex-1 min-w-[120px]"
            >
              <Package className="h-4 w-4 mr-2" />
              Odbiór
            </Button>
            <Button 
              variant={order.status === 'AWAITING_COMPLETION' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onComplete(order)} 
              disabled={order.status !== 'AWAITING_COMPLETION'}
              className="flex-1 min-w-[120px]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Zakończ
            </Button>
            {order.status !== 'COMPLETED' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)} className="flex-1 min-w-[120px]">
                  <X className="h-4 w-4 mr-2" />
                  Anuluj
                </Button>
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogContent>
                    <DHeader>
                      <DialogTitle>Czy na pewno chcesz anulować to zlecenie?</DialogTitle>
                    </DHeader>
                    <div className="py-2">Tej operacji nie można cofnąć.</div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Nie</Button>
                      <Button variant="destructive" onClick={() => { setShowCancelDialog(false); onCancel(order); }}>Tak, anuluj</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
          
          {/* Secondary Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(order)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplikuj
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDownloadPdf(order)}>
              <Download className="h-4 w-4 mr-2" />
              Pobierz PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onUploadPdf(order)}>
              <Upload className="h-4 w-4 mr-2" />
              Dodaj PDF
            </Button>
            {order.pdfFile && (
              <Button variant="ghost" size="sm" onClick={() => onViewPdf(order)}>
                <Eye className="h-4 w-4 mr-2" />
                Podgląd zlecenia
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(order)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Usuń
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 