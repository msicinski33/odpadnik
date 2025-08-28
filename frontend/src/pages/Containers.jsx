import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactDOMServer from 'react-dom/server';
import { Plus, Edit, Trash2, Check, X, Search, Filter, Package, Calendar, Building2, MapPin, FileText, User, Info, Clock, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import Switch from '../components/ui/switch';
import { toast } from 'sonner';
import authFetch from '../utils/authFetch';
import { hasPermission } from '../lib/utils';
import { useContext } from 'react';
import { UserContext } from '../UserContext';

// Constants
const CONTAINER_STATUS = {
  PENDING: 'Oczekujące',
  COMPLETED: 'Zrealizowane',
  PERSONAL_PICKUP: 'Odbiór osobisty'
};

const CONTAINER_STATUS_VARIANTS = {
  PENDING: 'secondary',
  COMPLETED: 'default',
  PERSONAL_PICKUP: 'warning'
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, variant = 'default' }) => (
  <Card className="border-border/50">
    <CardContent className="flex items-center p-4">
      <div className={`p-2 rounded-lg mr-3 ${
        variant === 'success' ? 'bg-green-100 text-green-600' :
        variant === 'warning' ? 'bg-yellow-100 text-yellow-600' :
        variant === 'info' ? 'bg-blue-100 text-blue-600' :
        'bg-muted text-muted-foreground'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const Containers = () => {
  const { user } = useContext(UserContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [completingContainer, setCompletingContainer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPdfStatus, setSelectedPdfStatus] = useState('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const queryClient = useQueryClient();

  // Form states
  const [containerForm, setContainerForm] = useState({
    companyName: '',
    city: '',
    propertyAddress: '',
    containerType: '',
    quantity: '',
    reason: '',
    invoiceNumber: '',
    entryPersonData: '',
    additionalInfo: '',
    personalPickup: false
  });

  const [completionForm, setCompletionForm] = useState({
    recordNumber: '',
    completionDate: ''
  });

  // Fetch containers
  const { data: containersData, isLoading, error } = useQuery({
    queryKey: ['containers', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await authFetch(`/api/containers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch containers');
      return response.json();
    }
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['containers-stats'],
    queryFn: async () => {
      const response = await authFetch('/api/containers/stats/summary');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      return response.json();
    }
  });



  // Mutations
  const createContainerMutation = useMutation({
    mutationFn: async (data) => {
      const response = await authFetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create container');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['containers']);
      queryClient.invalidateQueries(['containers-stats']);
      setShowCreateModal(false);
      resetForm();
      toast.success('Pojemnik został utworzony');
    },
    onError: (error) => {
      toast.error(`Błąd: ${error.message}`);
    }
  });

  const updateContainerMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await authFetch(`/api/containers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update container');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['containers']);
      setShowEditModal(false);
      setEditingContainer(null);
      resetForm();
      toast.success('Pojemnik został zaktualizowany');
    },
    onError: (error) => {
      toast.error(`Błąd: ${error.message}`);
    }
  });

  const completeContainerMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await authFetch(`/api/containers/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to complete container');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['containers']);
      queryClient.invalidateQueries(['containers-stats']);
      setShowCompleteModal(false);
      setCompletingContainer(null);
      setCompletionForm({ recordNumber: '', completionDate: '' });
      toast.success('Pojemnik został zrealizowany');
    },
    onError: (error) => {
      toast.error(`Błąd: ${error.message}`);
    }
  });

  const togglePersonalPickupMutation = useMutation({
    mutationFn: async ({ id, personalPickup, recordNumber, completionDate }) => {
      const response = await authFetch(`/api/containers/${id}/toggle-personal-pickup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalPickup, recordNumber, completionDate })
      });
      if (!response.ok) throw new Error('Failed to toggle personal pickup');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['containers']);
      queryClient.invalidateQueries(['containers-stats']);
      if (variables.personalPickup) {
        setShowCompleteModal(false);
        setCompletingContainer(null);
        setCompletionForm({ recordNumber: '', completionDate: '' });
        toast.success('Odbiór osobisty został ustawiony z danymi realizacji');
      } else {
        toast.success('Status odbioru osobistego został zaktualizowany');
      }
    },
    onError: (error) => {
      toast.error(`Błąd: ${error.message}`);
    }
  });

  const deleteContainerMutation = useMutation({
    mutationFn: async (id) => {
      const response = await authFetch(`/api/containers/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete container');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['containers']);
      queryClient.invalidateQueries(['containers-stats']);
      toast.success('Pojemnik został usunięty');
    },
    onError: (error) => {
      toast.error(`Błąd: ${error.message}`);
    }
  });

  // Helper functions
  const resetForm = () => {
    setContainerForm({
      companyName: '',
      city: '',
      propertyAddress: '',
      containerType: '',
      quantity: '',
      reason: '',
      invoiceNumber: '',
      entryPersonData: '',
      additionalInfo: '',
      personalPickup: false
    });
  };

  const handleCreate = () => {
    createContainerMutation.mutate(containerForm);
  };

  const handleEdit = () => {
    updateContainerMutation.mutate({
      id: editingContainer.id,
      data: containerForm
    });
  };

  const handleComplete = () => {
    if (completingContainer?.personalPickup) {
      // For personal pickup, use the toggle endpoint with completion data
      togglePersonalPickupMutation.mutate({
        id: completingContainer.id,
        personalPickup: true,
        recordNumber: completionForm.recordNumber,
        completionDate: completionForm.completionDate
      });
    } else {
      // Regular completion
      completeContainerMutation.mutate({
        id: completingContainer.id,
        data: completionForm
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten pojemnik?')) {
      deleteContainerMutation.mutate(id);
    }
  };

  const handleEditClick = (container) => {
    setEditingContainer(container);
    setContainerForm({
      companyName: container.companyName,
      city: container.city,
      propertyAddress: container.propertyAddress,
      containerType: container.containerType,
      quantity: container.quantity.toString(),
      reason: container.reason,
      invoiceNumber: container.invoiceNumber || '',
      entryPersonData: container.entryPersonData,
      additionalInfo: container.additionalInfo || '',
      personalPickup: container.personalPickup
    });
    setShowEditModal(true);
  };

  const handleCompleteClick = (container) => {
    setCompletingContainer(container);
    setShowCompleteModal(true);
  };

  const handlePersonalPickupToggle = (container) => {
    if (!container.personalPickup) {
      // When setting to personal pickup, show completion modal to get RW number and date
      setCompletingContainer(container);
      setShowCompleteModal(true);
    } else {
      // When removing personal pickup, just toggle the status
      togglePersonalPickupMutation.mutate({
        id: container.id,
        personalPickup: false,
        recordNumber: undefined,
        completionDate: undefined
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  // PDF Export function
  const handleExportPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      
      // Fetch containers by selected status
      const params = new URLSearchParams();
      if (selectedPdfStatus !== 'all') {
        params.append('status', selectedPdfStatus);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await authFetch(`/api/containers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch containers for PDF');
      const { containers } = await response.json();

      // Import the PDF component dynamically
      const ContainersPdf = (await import('../components/ContainersPdf')).default;

             // Generate HTML using the PDF component
       const html = ReactDOMServer.renderToString(
         React.createElement(ContainersPdf, {
           containers: containers || [],
           status: selectedPdfStatus === 'all' ? null : selectedPdfStatus,
           stats: stats
         })
       );

      // Create a complete HTML document
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Raport pojemników PDF</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `;

      // Send to backend for PDF generation
      const pdfResponse = await authFetch('/api/pdf/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
           html: fullHtml,
           fileName: `raport-pojemnikow_${selectedPdfStatus === 'all' ? 'wszystkie-statusy' : CONTAINER_STATUS[selectedPdfStatus]}_${new Date().toISOString().split('T')[0]}.pdf`
         })
      });

      if (!pdfResponse.ok) throw new Error('Failed to generate PDF');

      // Download the PDF
      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
             a.download = `raport-pojemnikow_${selectedPdfStatus === 'all' ? 'wszystkie-statusy' : CONTAINER_STATUS[selectedPdfStatus]}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowPdfModal(false);
      toast.success('PDF wygenerowany pomyślnie.');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Błąd podczas generowania PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Błąd: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pojemniki</h1>
          <p className="text-gray-600">Zarządzanie pojemnikami i zleceniami</p>
        </div>
                 <div className="flex gap-2">
                       {hasPermission(user, 'containers:read') && (
              <Button onClick={() => setShowPdfModal(true)} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Eksportuj PDF
              </Button>
            )}
                       {hasPermission(user, 'containers:create') && (
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Dodaj pojemnik
              </Button>
            )}
         </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Wszystkie" value={stats.total} variant="info" />
          <StatCard icon={Clock} label="Oczekujące" value={stats.pending} variant="warning" />
          <StatCard icon={Check} label="Zrealizowane" value={stats.completed} variant="success" />
          <StatCard icon={User} label="Odbiór osobisty" value={stats.personalPickup} variant="warning" />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Szukaj po firmie, mieście, adresie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="PENDING">Oczekujące</SelectItem>
                <SelectItem value="COMPLETED">Zrealizowane</SelectItem>
                <SelectItem value="PERSONAL_PICKUP">Odbiór osobisty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Containers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista pojemników</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Ładowanie...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                                 <thead>
                   <tr className="border-b">
                     <th className="text-left p-2">DATA WPISU</th>
                     <th className="text-left p-2">NAZWA FIRMY</th>
                     <th className="text-left p-2">MIASTO</th>
                     <th className="text-left p-2">ADRES</th>
                     <th className="text-left p-2">TYP POJEMNIKA</th>
                     <th className="text-left p-2">SZT.</th>
                     <th className="text-left p-2">POWÓD</th>
                     <th className="text-left p-2">NR RW *</th>
                     <th className="text-left p-2">DATA REALIZACJI *</th>
                     <th className="text-left p-2">STATUS</th>
                     <th className="text-left p-2">AKCJE</th>
                   </tr>
                 </thead>
                <tbody>
                  {containersData?.containers?.map((container) => (
                    <tr 
                      key={container.id} 
                      className={`border-b hover:bg-gray-50 ${
                        container.personalPickup ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="p-2">{formatDate(container.entryDate)}</td>
                      <td className="p-2 font-medium">{container.companyName}</td>
                      <td className="p-2">{container.city}</td>
                      <td className="p-2">{container.propertyAddress}</td>
                      <td className="p-2">{container.containerType}</td>
                      <td className="p-2 text-center">{container.quantity}</td>
                                             <td className="p-2">{container.reason}</td>
                       <td className="p-2">
                         <span className={!container.recordNumber && (container.status === 'COMPLETED' || container.status === 'PERSONAL_PICKUP') ? 'text-red-600 font-medium' : ''}>
                           {container.recordNumber || '-'}
                         </span>
                       </td>
                       <td className="p-2">
                         <span className={!container.completionDate && (container.status === 'COMPLETED' || container.status === 'PERSONAL_PICKUP') ? 'text-red-600 font-medium' : ''}>
                           {container.completionDate ? formatDate(container.completionDate) : '-'}
                         </span>
                       </td>
                       <td className="p-2">
                         <Badge variant={CONTAINER_STATUS_VARIANTS[container.status]}>
                           {CONTAINER_STATUS[container.status]}
                         </Badge>
                       </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {hasPermission(user, 'containers:update') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(container)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                          {container.status === 'PENDING' && hasPermission(user, 'containers:update') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteClick(container)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          {hasPermission(user, 'containers:update') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePersonalPickupToggle(container)}
                              className={container.personalPickup ? 'bg-yellow-100' : ''}
                            >
                              <User className="w-3 h-3" />
                            </Button>
                          )}
                          {hasPermission(user, 'containers:delete') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(container.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {containersData?.pagination && containersData.pagination.pages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Poprzednia
              </Button>
              <span className="flex items-center px-3">
                Strona {currentPage} z {containersData.pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(containersData.pagination.pages, prev + 1))}
                disabled={currentPage === containersData.pagination.pages}
              >
                Następna
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showCreateModal ? 'Dodaj nowy pojemnik' : 'Edytuj pojemnik'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nazwa firmy / Imię nazwisko *</Label>
              <Input
                id="companyName"
                value={containerForm.companyName}
                onChange={(e) => setContainerForm(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Nazwa firmy lub osoby"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Miasto *</Label>
              <Input
                id="city"
                value={containerForm.city}
                onChange={(e) => setContainerForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Miasto"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="propertyAddress">Adres posesji *</Label>
              <Input
                id="propertyAddress"
                value={containerForm.propertyAddress}
                onChange={(e) => setContainerForm(prev => ({ ...prev, propertyAddress: e.target.value }))}
                placeholder="Ulica, numer, kod pocztowy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="containerType">Typ pojemnika *</Label>
              <Input
                id="containerType"
                value={containerForm.containerType}
                onChange={(e) => setContainerForm(prev => ({ ...prev, containerType: e.target.value }))}
                placeholder="np. MGB 120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Liczba sztuk *</Label>
              <Input
                id="quantity"
                type="number"
                value={containerForm.quantity}
                onChange={(e) => setContainerForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="1"
                min="1"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Powód *</Label>
              <Input
                id="reason"
                value={containerForm.reason}
                onChange={(e) => setContainerForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="np. uszkodzenie, nowe zamówienie"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Numer faktury</Label>
              <Input
                id="invoiceNumber"
                value={containerForm.invoiceNumber}
                onChange={(e) => setContainerForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="Opcjonalnie"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryPersonData">Dane wpisującego *</Label>
              <Input
                id="entryPersonData"
                value={containerForm.entryPersonData}
                onChange={(e) => setContainerForm(prev => ({ ...prev, entryPersonData: e.target.value }))}
                placeholder="Imię i nazwisko"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="additionalInfo">Dodatkowe informacje</Label>
              <Textarea
                id="additionalInfo"
                value={containerForm.additionalInfo}
                onChange={(e) => setContainerForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="Dodatkowe uwagi, instrukcje..."
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="personalPickup"
                  checked={containerForm.personalPickup}
                  onChange={(checked) => setContainerForm(prev => ({ ...prev, personalPickup: checked }))}
                />
                <Label htmlFor="personalPickup">Odbiór osobisty</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}>
              Anuluj
            </Button>
            <Button onClick={showCreateModal ? handleCreate : handleEdit}>
              {showCreateModal ? 'Utwórz' : 'Zapisz zmiany'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

             {/* Complete Container Modal */}
       <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {completingContainer?.personalPickup ? 'Ustaw odbiór osobisty' : 'Zrealizuj pojemnik'}
             </DialogTitle>
           </DialogHeader>
                     <div className="space-y-4">
             {completingContainer?.personalPickup && (
               <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                 <p className="text-sm text-yellow-800">
                   <strong>Uwaga:</strong> Ustawienie odbioru osobistego wymaga podania numeru RW i daty realizacji.
                 </p>
               </div>
             )}
             <div className="space-y-2">
               <Label htmlFor="recordNumber">Numer RW *</Label>
               <Input
                 id="recordNumber"
                 value={completionForm.recordNumber}
                 onChange={(e) => setCompletionForm(prev => ({ ...prev, recordNumber: e.target.value }))}
                 placeholder="Numer dokumentu RW"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="completionDate">Data realizacji *</Label>
               <Input
                 id="completionDate"
                 type="date"
                 value={completionForm.completionDate}
                 onChange={(e) => setCompletionForm(prev => ({ ...prev, completionDate: e.target.value }))}
               />
             </div>
           </div>
                     <div className="flex justify-end gap-2 mt-6">
             <Button variant="outline" onClick={() => setShowCompleteModal(false)}>
               Anuluj
             </Button>
             <Button onClick={handleComplete}>
               {completingContainer?.personalPickup ? 'Ustaw odbiór osobisty' : 'Zrealizuj'}
             </Button>
           </div>
                 </DialogContent>
       </Dialog>

       {/* PDF Export Modal */}
       <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Eksportuj raport pojemników</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
                            <div className="space-y-2">
                 <Label htmlFor="pdfStatus">Status pojemników</Label>
                 <Select 
                   value={selectedPdfStatus} 
                   onValueChange={setSelectedPdfStatus}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Wybierz status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Wszystkie statusy</SelectItem>
                     <SelectItem value="PENDING">Oczekujące</SelectItem>
                     <SelectItem value="COMPLETED">Zrealizowane</SelectItem>
                     <SelectItem value="PERSONAL_PICKUP">Odbiór osobisty</SelectItem>
                   </SelectContent>
                 </Select>
                 <p className="text-sm text-gray-600">
                   Wybierz status pojemników do eksportu lub "Wszystkie statusy" dla pełnego raportu
                 </p>
                                {searchTerm && (
                   <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                     <p className="text-sm text-blue-800">
                       <strong>Uwaga:</strong> Raport będzie uwzględniał aktualnie zastosowane wyszukiwanie: "{searchTerm}"
                     </p>
                   </div>
                 )}
             </div>
           </div>
           <div className="flex justify-end gap-2 mt-6">
             <Button variant="outline" onClick={() => setShowPdfModal(false)}>
               Anuluj
             </Button>
             <Button onClick={handleExportPDF} disabled={isGeneratingPdf}>
               <Download className="w-4 h-4 mr-2" />
               {isGeneratingPdf ? 'Generowanie...' : 'Generuj PDF'}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 };

export default Containers;
