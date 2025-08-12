import React, { useState, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from "../components/ui/button";
import { Plus, Download } from "lucide-react";
import { WorkOrdersNavigation } from "../components/WorkOrdersNavigation";
import { WorkOrdersFilters } from "../components/WorkOrdersFilters";
import { WorkOrdersStats } from "../components/WorkOrdersStats";
import { WorkOrdersGrid } from "../components/WorkOrdersGrid";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import SimpleModal from '../components/SimpleModal';
import SurowceCreateModal from '../components/SurowceCreateModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import WorkOrdersPDF from './WorkOrdersPDF';
import WorkOrderModal from '../components/WorkOrderModal';
import { PDFDownloadLink } from '@react-pdf/renderer';
import authFetch from '../utils/authFetch';

const TABS = [
  { key: 'surowce', label: 'Surowce wtórne' },
  { key: 'worki', label: 'Worki gruzowe' },
  { key: 'uslugi', label: 'Usługi' },
  { key: 'bramy', label: 'Bramy – zlecenia' },
  { key: 'bezpylne', label: 'Bezpylne – zlecenia' },
];

const modalTitles = {
  surowce: 'Dodaj zlecenie – Surowce wtórne',
  worki: 'Dodaj zlecenie – Worki gruzowe',
  uslugi: 'Dodaj zlecenie – Usługi',
  bramy: 'Dodaj zlecenie – Bramy',
  bezpylne: 'Dodaj zlecenie – Bezpylne',
};

const USLUGI_RODZAJ_OPTIONS = ['Opróżnienie', 'Wstawienie', 'Zabranie'];
const USLUGI_KONTENER_OPTIONS = ['KP-12', 'KP-18', 'KP-21', 'KP-26', 'KP-29', 'KP-30', 'KP-35', 'KP-36', 'PRASOKONTENER'];

const BRAMY_RODZAJ_OPTIONS = ['Opróżnienie', 'Wstawienie', 'Zabranie'];
const BRAMY_KONTENER_OPTIONS = ['KP-3', 'KP-6', 'KP-7', 'KP-10', 'SPW', 'MULDA OTWARTA', 'MULDA ZAMKNIĘTA', 'PRASOKONTENER'];

const BEZPYLNE_RODZAJ_OPTIONS = ['reklamacja', 'zlecenie dodatkowe', 'informacja'];

const WORKI_RODZAJ_OPTIONS = ['M', 'M (99 zł)', 'D'];

const WorkOrders = () => {
  // Enhanced WorkOrders component with:
  // - WorkOrdersNavigation: Tab navigation with order counts
  // - WorkOrdersFilters: Advanced filtering with date picker, search, and PDF download
  // - WorkOrdersStats: Statistics cards showing total, completed, pending, and failed orders
  // - Loading states and error handling
  // - No data state when no orders are found
  // - Improved UI with animations and better user experience

  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [workOrders, setWorkOrders] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [causeModal, setCauseModal] = useState({ open: false, order: null });
  const [cause, setCause] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [workiModalOpen, setWorkiModalOpen] = useState(false);
  const [workiLoading, setWorkiLoading] = useState(false);
  const [workiError, setWorkiError] = useState('');
  const [workiRealizationModal, setWorkiRealizationModal] = useState({ open: false, order: null });
  const [workiAssignModal, setWorkiAssignModal] = useState({ open: false, order: null });
  const [uslugiModalOpen, setUslugiModalOpen] = useState(false);
  const [uslugiLoading, setUslugiLoading] = useState(false);
  const [uslugiError, setUslugiError] = useState('');
  const [uslugiForm, setUslugiForm] = useState({
    dateReceived: new Date(),
    receivedBy: '',
    wasteType: '',
    rodzaj: '',
    kontener: '',
    address: '',
    company: '',
    realizationDate: '',
    notes: '',
  });
  const [uslugiFormError, setUslugiFormError] = useState('');
  const [uslugiAssignModal, setUslugiAssignModal] = useState({ open: false, order: null });
  const [uslugiCauseModal, setUslugiCauseModal] = useState({ open: false, order: null });
  const [uslugiCause, setUslugiCause] = useState('');
  const [bramyModalOpen, setBramyModalOpen] = useState(false);
  const [bramyLoading, setBramyLoading] = useState(false);
  const [bramyError, setBramyError] = useState('');
  const [bramyForm, setBramyForm] = useState({
    dateReceived: new Date(),
    receivedBy: '',
    wasteType: '',
    rodzaj: '',
    kontener: '',
    address: '',
    company: '',
    realizationDate: '',
    notes: '',
  });
  const [bramyFormError, setBramyFormError] = useState('');
  const [bramyAssignModal, setBramyAssignModal] = useState({ open: false, order: null });
  const [bramyCauseModal, setBramyCauseModal] = useState({ open: false, order: null });
  const [bramyCause, setBramyCause] = useState('');
  const [bezpylneModalOpen, setBezpylneModalOpen] = useState(false);
  const [bezpylneLoading, setBezpylneLoading] = useState(false);
  const [bezpylneError, setBezpylneError] = useState('');
  const [bezpylneForm, setBezpylneForm] = useState({
    dateReceived: new Date(),
    receivedBy: '',
    address: '',
    company: '',
    rodzaj: '',
    zlecenie: '',
    realizationDate: '',
    notes: '',
  });
  const [bezpylneFormError, setBezpylneFormError] = useState('');
  const [bezpylneAssignModal, setBezpylneAssignModal] = useState({ open: false, order: null });
  const [bezpylneCauseModal, setBezpylneCauseModal] = useState({ open: false, order: null });
  const [bezpylneCause, setBezpylneCause] = useState('');
  const [workiForm, setWorkiForm] = useState({
    dateReceived: new Date(),
    receivedBy: '',
    quantity: '',
    rodzaj: '',
    address: '',
    company: '',
    orderNumber: '',
    bagNumber: '',
    notes: '',
    realizationDate: '',
  });
  const [workiFormError, setWorkiFormError] = useState('');
  const [workiCauseModal, setWorkiCauseModal] = useState({ open: false, order: null });
  const [workiCause, setWorkiCause] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, order: null, loading: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Per-tab search fields
  const tabSearchFields = {
    surowce: ['odpad', 'address', 'company', 'klient'],
    worki: ['address', 'company', 'bagNumber', 'orderNumber'],
    uslugi: ['wasteType', 'address', 'company'],
    bramy: ['wasteType', 'address', 'company'],
    bezpylne: ['address', 'company'],
  };

  // Helper to sort orders: pending (not completed) first, then completed
  function sortPendingFirst(orders) {
    return [...orders].sort((a, b) => {
      // Treat undefined/null as not completed
      const aCompleted = !!a.completed;
      const bCompleted = !!b.completed;
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });
  }

  // Per-tab filtered work orders
  function filterOrders(orders, tab) {
    // Ensure orders is an array
    if (!Array.isArray(orders)) return [];
    
    // First filter by tab type
    let filteredOrders = orders.filter(order => order.type === tab);
    
    // Then filter by search term if provided
    if (searchTerm.trim()) {
      const fields = tabSearchFields[tab] || [];
      filteredOrders = filteredOrders.filter(order =>
        fields.some(field => {
          const val = order[field] || '';
          return val.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }
    
    return filteredOrders;
  }

  // Helper to count pending orders for a specific day
  function countPendingForDay(orders, dateField) {
    if (!filterDate) return 0;
    const dateStr = filterDate.toISOString().slice(0, 10);
    return orders.filter(o => !o.completed && o[dateField] && o[dateField].slice(0, 10) === dateStr).length;
  }

  // Fetch all work orders
  useEffect(() => {
    setIsLoading(true);
    let url = '/api/workorders';
    if (filterDate) {
      const dateStr = filterDate.toISOString().slice(0, 10);
      url += `?executionDate=${dateStr}`;
    }
    authFetch(url)
      .then(res => res.json())
      .then(data => {
        setWorkOrders(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching work orders:', error);
        setWorkOrders([]);
        setIsLoading(false);
      });
  }, [filterDate]);

  // Create new work order
  const handleCreate = form => {
    setLoading(true);
    setError('');
    const data = {
      type: 'surowce',
      dateReceived: form.dateReceived ? form.dateReceived.toISOString() : null,
      realizationDate: form.realizationDate ? form.realizationDate.toISOString() : null,
      executionDate: form.realizationDate ? form.realizationDate.toISOString() : (form.dateReceived ? form.dateReceived.toISOString() : new Date().toISOString()),
      receivedBy: form.receivedBy,
      address: form.address,
      company: form.klient,
      wasteType: form.odpad,
      rodzaj: form.rodzaj,
      notes: form.uwagi && form.uwagi.trim() !== '' ? form.uwagi : null,
    };
    authFetch('/api/workorders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(res => {
        setLoading(false);
        if (!res.ok) {
          res.text().then(text => console.log('Backend error:', text));
          throw new Error('Błąd zapisu zlecenia');
        }
        return res.json();
      })
      .then(newOrder => {
        setWorkOrders(orders => [newOrder, ...(Array.isArray(orders) ? orders : [])]);
        setModalOpen(false);
      })
      .catch(err => {
        setError(err.message);
        console.log('Frontend error:', err);
      });
  };

  // Open assignment modal
  const handleAssign = order => {
    setSelectedOrder(order);
    setAssignModalOpen(true);
  };

  // Save assignment
  const handleSaveAssignment = ({ responsible, vehicle }) => {
    authFetch(`/api/workorders/${selectedOrder.id}`, {
      method: 'PUT',
      body: JSON.stringify({ responsible, vehicle }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setAssignModalOpen(false);
      });
  };

  // Toggle completion
  const handleToggleComplete = (order, completed) => {
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    })
      .then(res => res.json())
      .then(updated => setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o)));
  };

  // Save cause for Niezrealizowane
  const handleSaveCause = () => {
    authFetch(`/api/workorders/${causeModal.order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ cause }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setCauseModal({ open: false, order: null });
        setCause('');
      });
  };

  // Create new worki gruzowe order
  const handleCreateWorki = form => {
    setWorkiLoading(true);
    setWorkiError('');
    const data = {
      type: 'worki',
      dateReceived: form.dateReceived,
      executionDate: form.dateReceived,
      receivedBy: form.receivedBy,
      quantity: Number(form.quantity),
      rodzaj: form.rodzaj,
      address: form.address,
      company: form.company,
      orderNumber: form.orderNumber,
      bagNumber: form.bagNumber,
      notes: form.notes && form.notes.trim() !== '' ? form.notes : null,
    };
    authFetch('/api/workorders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(res => {
        setWorkiLoading(false);
        if (!res.ok) {
          res.text().then(text => console.log('Backend error:', text));
          throw new Error('Błąd zapisu zlecenia');
        }
        return res.json();
      })
      .then(newOrder => {
        setWorkOrders(orders => [newOrder, ...(Array.isArray(orders) ? orders : [])]);
        setWorkiModalOpen(false);
      })
      .catch(err => {
        setWorkiError(err.message);
        console.log('Frontend error:', err);
      });
  };

  // Save assignment for worki gruzowe
  const handleAssignWorki = ({ responsible, vehicle }) => {
    const order = workiAssignModal.order;
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ responsible, vehicle }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setWorkiAssignModal({ open: false, order: null });
      });
  };

  // Create new uslugi order
  const handleCreateUslugi = form => {
    setUslugiLoading(true);
    setUslugiError('');
    const data = {
      type: 'uslugi',
      dateReceived: form.dateReceived,
      executionDate: form.dateReceived,
      receivedBy: form.receivedBy,
      wasteType: form.wasteType,
      rodzaj: form.rodzaj,
      kontener: form.kontener,
      address: form.address,
      company: form.company,
      realizationDate: form.realizationDate,
      notes: form.notes && form.notes.trim() !== '' ? form.notes : null,
    };
    authFetch('/api/workorders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(res => {
        setUslugiLoading(false);
        if (!res.ok) {
          res.text().then(text => console.log('Backend error:', text));
          throw new Error('Błąd zapisu zlecenia');
        }
        return res.json();
      })
      .then(newOrder => {
        setWorkOrders(orders => [newOrder, ...(Array.isArray(orders) ? orders : [])]);
        setUslugiModalOpen(false);
      })
      .catch(err => {
        setUslugiError(err.message);
        console.log('Frontend error:', err);
      });
  };

  const handleAssignUslugi = ({ responsible, vehicle }) => {
    const order = uslugiAssignModal.order;
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ responsible, vehicle }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setUslugiAssignModal({ open: false, order: null });
      });
  };

  const handleToggleCompleteUslugi = (order, completed) => {
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    })
      .then(res => res.json())
      .then(updated => setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o)));
  };

  const handleSaveUslugiCause = () => {
    authFetch(`/api/workorders/${uslugiCauseModal.order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ cause: uslugiCause }),
    })
      .then(res => res.json())
    .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setUslugiCauseModal({ open: false, order: null });
        setUslugiCause('');
      });
  };

  // Create new bramy order
  const handleCreateBramy = form => {
    setBramyLoading(true);
    setBramyError('');
    const data = {
      type: 'bramy',
      dateReceived: form.dateReceived,
      executionDate: form.dateReceived,
      receivedBy: form.receivedBy,
      wasteType: form.wasteType,
      rodzaj: form.rodzaj,
      kontener: form.kontener,
      address: form.address,
      company: form.company,
      realizationDate: form.realizationDate,
      notes: form.notes && form.notes.trim() !== '' ? form.notes : null,
    };
    authFetch('/api/workorders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(res => {
        setBramyLoading(false);
        if (!res.ok) {
          res.text().then(text => console.log('Backend error:', text));
          throw new Error('Błąd zapisu zlecenia');
        }
        return res.json();
      })
      .then(newOrder => {
        setWorkOrders(orders => [newOrder, ...(Array.isArray(orders) ? orders : [])]);
        setBramyModalOpen(false);
      })
      .catch(err => {
        setBramyError(err.message);
        console.log('Frontend error:', err);
      });
  };

  const handleAssignBramy = ({ responsible, vehicle }) => {
    const order = bramyAssignModal.order;
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responsible, vehicle }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setBramyAssignModal({ open: false, order: null });
      });
  };

  const handleToggleCompleteBramy = (order, completed) => {
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
      .then(res => res.json())
      .then(updated => setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o)));
  };

  const handleSaveBramyCause = () => {
    authFetch(`/api/workorders/${bramyCauseModal.order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cause: bramyCause }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setBramyCauseModal({ open: false, order: null });
        setBramyCause('');
      });
  };

  // Create new bezpylne order
  const handleCreateBezpylne = form => {
    setBezpylneLoading(true);
    setBezpylneError('');
    const data = {
      type: 'bezpylne',
      dateReceived: form.dateReceived,
      executionDate: form.dateReceived,
      receivedBy: form.receivedBy,
      address: form.address,
      company: form.company,
      rodzaj: form.rodzaj,
      zlecenie: form.zlecenie,
      realizationDate: form.realizationDate,
      notes: form.notes && form.notes.trim() !== '' ? form.notes : null,
    };
    if (form.id) {
      authFetch(`/api/workorders/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(res => {
          setBezpylneLoading(false);
          if (!res.ok) {
            res.text().then(text => console.log('Backend error:', text));
            throw new Error('Błąd zapisu zlecenia');
          }
          return res.json();
        })
        .then(updatedOrder => {
          setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updatedOrder.id ? updatedOrder : o));
          setBezpylneModalOpen(false);
        })
        .catch(err => {
          setBezpylneError(err.message);
          console.log('Frontend error:', err);
        });
    } else {
      authFetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(res => {
          setBezpylneLoading(false);
          if (!res.ok) {
            res.text().then(text => console.log('Backend error:', text));
            throw new Error('Błąd zapisu zlecenia');
          }
          return res.json();
        })
        .then(newOrder => {
          setWorkOrders(orders => [newOrder, ...(Array.isArray(orders) ? orders : [])]);
          setBezpylneModalOpen(false);
        })
        .catch(err => {
          setBezpylneError(err.message);
          console.log('Frontend error:', err);
        });
    }
  };

  const handleAssignBezpylne = ({ responsible, vehicle }) => {
    const order = bezpylneAssignModal.order;
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responsible, vehicle }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setBezpylneAssignModal({ open: false, order: null });
      });
  };

  const handleToggleCompleteBezpylne = (order, completed) => {
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
      .then(res => res.json())
      .then(updated => setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o)));
  };

  const handleSaveBezpylneCause = () => {
    authFetch(`/api/workorders/${bezpylneCauseModal.order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cause: bezpylneCause }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setBezpylneCauseModal({ open: false, order: null });
        setBezpylneCause('');
      });
  };

  // Toggle completion for worki gruzowe
  const handleToggleCompleteWorki = (order, completed, realizationDate) => {
    const body = { completed };
    if (realizationDate) body.realizationDate = realizationDate;
    authFetch(`/api/workorders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(updated => setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o)));
  };

  // Save cause for Niezrealizowane for worki gruzowe
  const handleSaveWorkiCause = () => {
    authFetch(`/api/workorders/${workiCauseModal.order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cause: workiCause }),
    })
      .then(res => res.json())
      .then(updated => {
        setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
        setWorkiCauseModal({ open: false, order: null });
        setWorkiCause('');
      });
  };

  const handleDeleteOrder = (order) => {
    setDeleteModal({ open: true, order, loading: false });
  };

  const confirmDeleteOrder = () => {
    setDeleteModal(dm => ({ ...dm, loading: true }));
    authFetch(`/api/workorders/${deleteModal.order.id}`, { method: 'DELETE' })
      .then(res => {
        setDeleteModal({ open: false, order: null, loading: false });
        if (res.ok) {
          setWorkOrders(orders => (Array.isArray(orders) ? orders : []).filter(o => o.id !== deleteModal.order.id));
        }
      });
  };

  // Calculate statistics
  const stats = {
    total: filterOrders(Array.isArray(workOrders) ? workOrders : [], activeTab).length,
    completed: filterOrders(Array.isArray(workOrders) ? workOrders : [], activeTab).filter(o => o.completed).length,
    pending: filterOrders(Array.isArray(workOrders) ? workOrders : [], activeTab).filter(o => !o.completed && !o.cause).length,
    failed: filterOrders(Array.isArray(workOrders) ? workOrders : [], activeTab).filter(o => o.cause).length,
  };

  const pendingCount = filterDate 
    ? countPendingForDay(filterOrders(Array.isArray(workOrders) ? workOrders : [], activeTab), 'executionDate') 
    : 0;

  const handleAddOrder = () => {
    setModalOpen(true);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    if (order.type === 'worki') {
      setWorkiForm({
        company: order.company || '',
        address: order.address || '',
        receivedBy: order.receivedBy || '',
        quantity: order.quantity || '',
        rodzaj: order.rodzaj || '',
        orderNumber: order.orderNumber || '',
        bagNumber: order.bagNumber || '',
        notes: order.notes || ''
      });
      setWorkiModalOpen(true);
    } else if (order.type === 'uslugi') {
      setUslugiForm({
        company: order.company || '',
        address: order.address || '',
        receivedBy: order.receivedBy || '',
        wasteType: order.wasteType || '',
        rodzaj: order.rodzaj || '',
        kontener: order.kontener || '',
        notes: order.notes || ''
      });
      setUslugiModalOpen(true);
    } else if (order.type === 'bramy') {
      setBramyForm({
        company: order.company || '',
        address: order.address || '',
        receivedBy: order.receivedBy || '',
        wasteType: order.wasteType || '',
        rodzaj: order.rodzaj || '',
        kontener: order.kontener || '',
        notes: order.notes || ''
      });
      setBramyModalOpen(true);
    } else if (order.type === 'bezpylne') {
      setBezpylneForm({
        company: order.company || '',
        address: order.address || '',
        receivedBy: order.receivedBy || '',
        rodzaj: order.rodzaj || '',
        zlecenie: order.zlecenie || '',
        notes: order.notes || ''
      });
      setBezpylneModalOpen(true);
    }
  };

  const handleDelete = (order) => {
    setDeleteModal({ open: true, order, loading: false });
  };

  const confirmDelete = async () => {
    if (deleteModal.order) {
      try {
        setDeleteModal(prev => ({ ...prev, loading: true }));
        const response = await authFetch(`/api/workorders/${deleteModal.order.id}`, { method: 'DELETE' });
        if (response.ok) {
          setWorkOrders(orders => (Array.isArray(orders) ? orders : []).filter(o => o.id !== deleteModal.order.id));
        }
        setDeleteModal(prev => ({ ...prev, open: false, order: null, loading: false }));
      } catch (error) {
        console.error('Error deleting order:', error);
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const handleClearFilters = () => {
    setFilterDate(null);
    setSearchTerm('');
  };

  const handleDownloadPDF = () => {
    let ordersToDownload = [];
    let title = '';
    let date = null;

    if (activeTab === 'worki') {
      // For worki gruzowe: download ALL pending orders
      ordersToDownload = workOrders.filter(order => 
        order.type === 'worki' && !order.completed && !order.cause
      );
      title = `Zlecenia ${TABS.find(t => t.key === activeTab)?.label} - Wszystkie oczekujące`;
      date = null;
    } else {
      // For other tabs: download orders for selected date
      if (!filterDate) return;
      
      const dateStr = filterDate.toISOString().slice(0, 10);
      ordersToDownload = workOrders.filter(order => {
        const orderDate = new Date(order.realizationDate || order.dateReceived);
        const orderDateStr = orderDate.toISOString().slice(0, 10);
        return orderDateStr === dateStr && order.type === activeTab;
      });
      title = `Zlecenia ${TABS.find(t => t.key === activeTab)?.label} - ${filterDate.toLocaleDateString('pl-PL')}`;
      date = filterDate;
    }

    if (ordersToDownload.length === 0) {
      const message = activeTab === 'worki' 
        ? 'Brak oczekujących zleceń worki gruzowe.'
        : 'Brak zleceń na wybrany dzień.';
      alert(message);
      return;
    }

    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = ReactDOMServer.renderToString(
      <WorkOrdersPDF 
        orders={ordersToDownload}
        date={date}
        title={title}
      />
    );
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            
            body { 
              font-family: 'Noto Sans', Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
              background: white;
              width: 210mm;
              min-height: 297mm;
              box-sizing: border-box;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                width: 210mm;
                height: 297mm;
              }
              .no-print { display: none; }
              * {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
            
            @media screen {
              body {
                padding: 20px;
                max-width: 210mm;
                margin: 0 auto;
              }
            }
          </style>
        </head>
        <body>
          ${pdfContent.innerHTML}
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Drukuj PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
              Zamknij
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow?.document.close();
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Zlecenia pracy</h1>
      
      {/* Enhanced Navigation with counts */}
      <WorkOrdersNavigation
        tabs={TABS.map(tab => ({
          ...tab,
          count: filterOrders(Array.isArray(workOrders) ? workOrders : [], tab.key).length
        }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Enhanced Filters */}
      <div className="mb-6">
        <WorkOrdersFilters
          filterDate={filterDate}
          onFilterDateChange={setFilterDate}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onClearFilters={handleClearFilters}
          pendingCount={pendingCount}
          onDownloadPDF={handleDownloadPDF}
          showPDFButton={filterDate || activeTab === 'worki'}
        />
      </div>

      {/* Enhanced Stats */}
      <WorkOrdersStats
        total={stats.total}
        completed={stats.completed}
        pending={stats.pending}
        failed={stats.failed}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Ładowanie zleceń...</span>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && Array.isArray(workOrders) && workOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zleceń</h3>
          <p className="text-gray-500">Nie znaleziono żadnych zleceń dla wybranych filtrów.</p>
        </div>
      )}

      {activeTab === 'surowce' && (
        <>
          <div className="mb-4 flex items-center gap-4">
            <Button onClick={() => { setSelectedOrder(null); setModalOpen(true); }} className="bg-blue-600 text-white">+ Dodaj zlecenie</Button>
          </div>
          <WorkOrdersGrid
            workOrders={sortPendingFirst(filterOrders(Array.isArray(workOrders) ? workOrders : [], 'surowce'))}
            onToggleComplete={handleToggleComplete}
            onAssign={handleAssign}
            onMarkFailed={order => setCauseModal({ open: true, order })}
            onEdit={order => {
              setSelectedOrder({
                ...order,
                klient: order.company || "",
                odpad: order.wasteType || "",
                uwagi: order.notes || "",
              });
              setModalOpen(true);
            }}
            onDelete={handleDeleteOrder}
            title="Zlecenia Surowce wtórne"
            tabKey="surowce"
          />
          <SurowceCreateModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setSelectedOrder(null); }}
            onCreate={form => {
              if (selectedOrder && selectedOrder.id) {
                // Edit mode
                authFetch(`/api/workorders/${selectedOrder.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'surowce',
                    dateReceived: form.dateReceived ? form.dateReceived.toISOString() : null,
                    realizationDate: form.realizationDate ? form.realizationDate.toISOString() : null,
                    executionDate: form.realizationDate ? form.realizationDate.toISOString() : (form.dateReceived ? form.dateReceived.toISOString() : new Date().toISOString()),
                    receivedBy: form.receivedBy,
                    odpad: form.odpad,
                    rodzaj: form.rodzaj,
                    address: form.address,
                    klient: form.klient,
                    uwagi: form.uwagi && form.uwagi.trim() !== '' ? form.uwagi : null,
                  }),
                })
                  .then(res => res.json())
                  .then(updated => {
                    setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
                    setModalOpen(false);
                    setSelectedOrder(null);
                  });
              } else {
                handleCreate(form);
              }
            }}
            initial={selectedOrder}
            deleteButton={selectedOrder && selectedOrder.id ? (
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mt-2"
                onClick={() => {
                  if (window.confirm('Czy na pewno chcesz usunąć to zlecenie?')) {
                    authFetch(`/api/workorders/${selectedOrder.id}`, { method: 'DELETE' })
                      .then(res => {
                        if (res.ok) {
                          setWorkOrders(orders => (Array.isArray(orders) ? orders : []).filter(o => o.id !== selectedOrder.id));
                        }
                      });
                  }
                }}
              >Usuń</button>
            ) : null}
            title={selectedOrder && selectedOrder.id ? "Edytuj zlecenie – Surowce wtórne" : "Dodaj zlecenie – Surowce wtórne"}
          />
          <WorkOrderModal
            open={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            onSave={handleSaveAssignment}
            initial={selectedOrder}
            orderType="surowce"
          />
          <SimpleModal open={causeModal.open} onClose={() => setCauseModal({ open: false, order: null })}>
            <h2 className="font-bold text-lg mb-2">Powód niezrealizowania</h2>
            <textarea className="border rounded px-2 py-1 w-full" value={cause} onChange={e => setCause(e.target.value)} />
            <Button className="mt-2" onClick={handleSaveCause}>Zapisz powód</Button>
          </SimpleModal>
          {loading && <div className="text-blue-600 text-center mt-2">Zapisywanie...</div>}
          {error && <div className="text-red-600 text-center mt-2">{error}</div>}
        </>
      )}
      {activeTab === 'worki' && (
        <>
          <div className="mb-4 flex items-center gap-4">
            <Button onClick={() => { setWorkiForm({
              dateReceived: new Date(),
              receivedBy: '',
              quantity: '',
              rodzaj: '',
              address: '',
              company: '',
              orderNumber: '',
              bagNumber: '',
              notes: '',
              realizationDate: '',
            }); setWorkiModalOpen(true); }} className="bg-blue-600 text-white">+ Dodaj zlecenie</Button>
          </div>
          <WorkOrdersGrid
            workOrders={sortPendingFirst(filterOrders(Array.isArray(workOrders) ? workOrders : [], 'worki'))}
            onToggleComplete={handleToggleCompleteWorki}
            onAssign={order => setWorkiAssignModal({ open: true, order })}
            onMarkFailed={order => setWorkiCauseModal({ open: true, order })}
            onEdit={order => {
              setWorkiModalOpen(true);
              setWorkiForm({
                ...order,
                dateReceived: order.dateReceived ? new Date(order.dateReceived) : new Date(),
                realizationDate: order.realizationDate ? new Date(order.realizationDate) : '',
              });
            }}
            onDelete={handleDeleteOrder}
            title="Zlecenia Worki gruzowe"
            tabKey="worki"
          />
          <SimpleModal 
            open={workiModalOpen} 
            onClose={() => setWorkiModalOpen(false)}
            title={workiForm && workiForm.id ? "Edytuj zlecenie – Worki gruzowe" : "Dodaj zlecenie – Worki gruzowe"}
          >
            <form onSubmit={e => {
              e.preventDefault();
              if (!workiForm.dateReceived || !workiForm.receivedBy || !workiForm.quantity || !workiForm.rodzaj || !workiForm.address || !workiForm.company) {
                setWorkiFormError('Wszystkie pola oprócz "Uwagi", "Numer zlecenia/KPO" i "Numer worka" są wymagane.');
                return;
              }
              setWorkiFormError('');
              if (workiForm.id) {
                // Edit mode
                authFetch(`/api/workorders/${workiForm.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'worki',
                    dateReceived: workiForm.dateReceived,
                    executionDate: workiForm.dateReceived,
                    receivedBy: workiForm.receivedBy,
                    quantity: Number(workiForm.quantity),
                    rodzaj: workiForm.rodzaj,
                    address: workiForm.address,
                    company: workiForm.company,
                    orderNumber: workiForm.orderNumber,
                    bagNumber: workiForm.bagNumber,
                    notes: workiForm.notes && workiForm.notes.trim() !== '' ? workiForm.notes : null,
                  }),
                })
                  .then(res => res.json())
                  .then(updated => {
                    setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
                    setWorkiModalOpen(false);
                  });
              } else {
                handleCreateWorki(workiForm);
              }
            }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label>Data zgłoszenia *</label>
                <DatePicker selected={workiForm.dateReceived} onChange={date => setWorkiForm(f => ({ ...f, dateReceived: date }))} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
              </div>
              <div>
                <label>Przyjął *</label>
                <input value={workiForm.receivedBy} onChange={e => setWorkiForm(f => ({ ...f, receivedBy: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Ilość *</label>
                <input value={workiForm.quantity} onChange={e => setWorkiForm(f => ({ ...f, quantity: e.target.value }))} required className="border rounded px-2 py-1 w-full" type="number" min="1" />
              </div>
              <div>
                <label>Rodzaj *</label>
                <select value={workiForm.rodzaj} onChange={e => setWorkiForm(f => ({ ...f, rodzaj: e.target.value }))} required className="border rounded px-2 py-1 w-full">
                  <option value="">Wybierz...</option>
                  {WORKI_RODZAJ_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label>Adres *</label>
                <input value={workiForm.address} onChange={e => setWorkiForm(f => ({ ...f, address: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Klient *</label>
                <input value={workiForm.company} onChange={e => setWorkiForm(f => ({ ...f, company: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Numer zlecenia/KPO</label>
                <input value={workiForm.orderNumber} onChange={e => setWorkiForm(f => ({ ...f, orderNumber: e.target.value }))} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Numer worka</label>
                <input value={workiForm.bagNumber} onChange={e => setWorkiForm(f => ({ ...f, bagNumber: e.target.value }))} className="border rounded px-2 py-1 w-full" />
              </div>
              <div className="md:col-span-2">
                <label>Uwagi</label>
                <input value={workiForm.notes} onChange={e => setWorkiForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-2 py-1 w-full" />
              </div>
              {workiFormError && <div className="text-red-600 text-sm md:col-span-2">{workiFormError}</div>}
              <div className="flex space-x-3 md:col-span-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setWorkiModalOpen(false)} className="flex-1 border-gray-300 hover:bg-gray-50">Anuluj</Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">Zapisz</Button>
              </div>
            </form>
          </SimpleModal>
          <WorkOrderModal
            open={workiAssignModal.open}
            onClose={() => setWorkiAssignModal({ open: false, order: null })}
            onSave={handleAssignWorki}
            initial={workiAssignModal.order}
            orderType="worki"
          />
          <SimpleModal open={workiCauseModal.open} onClose={() => setWorkiCauseModal({ open: false, order: null })}>
            <h2 className="font-bold text-lg mb-2">Powód niezrealizowania</h2>
            <textarea className="border rounded px-2 py-1 w-full" value={workiCause} onChange={e => setWorkiCause(e.target.value)} />
            <Button className="mt-2" onClick={handleSaveWorkiCause}>Zapisz powód</Button>
          </SimpleModal>
          {workiLoading && <div className="text-blue-600 text-center mt-2">Zapisywanie...</div>}
          {workiError && <div className="text-red-600 text-center mt-2">{workiError}</div>}
        </>
      )}
      {activeTab === 'uslugi' && (
        <>
          <div className="mb-4 flex items-center gap-4">
            <Button onClick={() => { setUslugiForm({
              dateReceived: new Date(),
              receivedBy: '',
              wasteType: '',
              rodzaj: '',
              kontener: '',
              address: '',
              company: '',
              realizationDate: '',
              notes: '',
            }); setUslugiModalOpen(true); }} className="bg-blue-600 text-white">+ Dodaj zlecenie</Button>
          </div>
          <WorkOrdersGrid
            workOrders={sortPendingFirst(filterOrders(Array.isArray(workOrders) ? workOrders : [], 'uslugi'))}
            onToggleComplete={handleToggleCompleteUslugi}
            onAssign={order => setUslugiAssignModal({ open: true, order })}
            onMarkFailed={order => setUslugiCauseModal({ open: true, order })}
            onEdit={order => {
              setUslugiModalOpen(true);
              setUslugiForm({
                ...order,
                dateReceived: order.dateReceived ? new Date(order.dateReceived) : new Date(),
                realizationDate: order.realizationDate ? new Date(order.realizationDate) : '',
              });
            }}
            onDelete={handleDeleteOrder}
            title="Zlecenia Usługi"
            tabKey="uslugi"
          />
          <SimpleModal 
            open={uslugiModalOpen} 
            onClose={() => setUslugiModalOpen(false)}
            title={uslugiForm && uslugiForm.id ? "Edytuj zlecenie – Usługi" : "Dodaj zlecenie – Usługi"}
          >
            <form onSubmit={e => {
              e.preventDefault();
              if (!uslugiForm.dateReceived || !uslugiForm.receivedBy || !uslugiForm.wasteType || !uslugiForm.rodzaj || !uslugiForm.kontener || !uslugiForm.address || !uslugiForm.company || !uslugiForm.realizationDate) {
                setUslugiFormError('Wszystkie pola oprócz "Uwagi" są wymagane.');
                return;
              }
              setUslugiFormError('');
              if (uslugiForm.id) {
                // Edit mode
                authFetch(`/api/workorders/${uslugiForm.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'uslugi',
                    dateReceived: uslugiForm.dateReceived,
                    executionDate: uslugiForm.dateReceived,
                    receivedBy: uslugiForm.receivedBy,
                    wasteType: uslugiForm.wasteType,
                    rodzaj: uslugiForm.rodzaj,
                    kontener: uslugiForm.kontener,
                    address: uslugiForm.address,
                    company: uslugiForm.company,
                    realizationDate: uslugiForm.realizationDate,
                    notes: uslugiForm.notes && uslugiForm.notes.trim() !== '' ? uslugiForm.notes : null,
                  }),
                })
                  .then(res => res.json())
                  .then(updated => {
                    setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
                    setUslugiModalOpen(false);
                  });
              } else {
                handleCreateUslugi(uslugiForm);
              }
            }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label>Data zgłoszenia *</label>
                <DatePicker selected={uslugiForm.dateReceived} onChange={date => setUslugiForm(f => ({ ...f, dateReceived: date }))} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
              </div>
              <div>
                <label>Przyjął *</label>
                <input value={uslugiForm.receivedBy} onChange={e => setUslugiForm(f => ({ ...f, receivedBy: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Odpad *</label>
                <input value={uslugiForm.wasteType} onChange={e => setUslugiForm(f => ({ ...f, wasteType: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Rodzaj *</label>
                <select value={uslugiForm.rodzaj} onChange={e => setUslugiForm(f => ({ ...f, rodzaj: e.target.value }))} required className="border rounded px-2 py-1 w-full">
                  <option value="">Wybierz...</option>
                  {USLUGI_RODZAJ_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label>Kontener *</label>
                <select value={uslugiForm.kontener} onChange={e => setUslugiForm(f => ({ ...f, kontener: e.target.value }))} required className="border rounded px-2 py-1 w-full">
                  <option value="">Wybierz...</option>
                  {USLUGI_KONTENER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label>Adres *</label>
                <input value={uslugiForm.address} onChange={e => setUslugiForm(f => ({ ...f, address: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Klient *</label>
                <input value={uslugiForm.company} onChange={e => setUslugiForm(f => ({ ...f, company: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Data realizacji *</label>
                <DatePicker selected={uslugiForm.realizationDate} onChange={date => setUslugiForm(f => ({ ...f, realizationDate: date }))} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
              </div>
              <div className="md:col-span-2">
                <label>Uwagi</label>
                <input value={uslugiForm.notes} onChange={e => setUslugiForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-2 py-1 w-full" />
              </div>
              {uslugiFormError && <div className="text-red-600 text-sm md:col-span-2">{uslugiFormError}</div>}
              <div className="flex space-x-3 md:col-span-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setUslugiModalOpen(false)} className="flex-1 border-gray-300 hover:bg-gray-50">Anuluj</Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">Zapisz</Button>
              </div>
            </form>
          </SimpleModal>
          <WorkOrderModal
            open={uslugiAssignModal.open}
            onClose={() => setUslugiAssignModal({ open: false, order: null })}
            onSave={handleAssignUslugi}
            initial={uslugiAssignModal.order}
            orderType="uslugi"
          />
          <SimpleModal open={uslugiCauseModal.open} onClose={() => setUslugiCauseModal({ open: false, order: null })}>
            <h2 className="font-bold text-lg mb-2">Powód niezrealizowania</h2>
            <textarea className="border rounded px-2 py-1 w-full" value={uslugiCause} onChange={e => setUslugiCause(e.target.value)} />
            <Button className="mt-2" onClick={handleSaveUslugiCause}>Zapisz powód</Button>
          </SimpleModal>
          {uslugiLoading && <div className="text-blue-600 text-center mt-2">Zapisywanie...</div>}
          {uslugiError && <div className="text-red-600 text-center mt-2">{uslugiError}</div>}
        </>
      )}
      {activeTab === 'bramy' && (
        <>
          <div className="mb-4 flex items-center gap-4">
            <Button onClick={() => { setBramyForm({
              dateReceived: new Date(),
              receivedBy: '',
              wasteType: '',
              rodzaj: '',
              kontener: '',
              address: '',
              company: '',
              realizationDate: '',
              notes: '',
            }); setBramyModalOpen(true); }} className="bg-blue-600 text-white">+ Dodaj zlecenie</Button>
          </div>
          <WorkOrdersGrid
            workOrders={sortPendingFirst(filterOrders(Array.isArray(workOrders) ? workOrders : [], 'bramy'))}
            onToggleComplete={handleToggleCompleteBramy}
            onAssign={order => setBramyAssignModal({ open: true, order })}
            onMarkFailed={order => setBramyCauseModal({ open: true, order })}
            onEdit={order => {
              setBramyModalOpen(true);
              setBramyForm({
                ...order,
                dateReceived: order.dateReceived ? new Date(order.dateReceived) : new Date(),
                realizationDate: order.realizationDate ? new Date(order.realizationDate) : '',
              });
            }}
            onDelete={handleDeleteOrder}
            title="Zlecenia Bramy"
            tabKey="bramy"
          />
          <SimpleModal 
            open={bramyModalOpen} 
            onClose={() => setBramyModalOpen(false)}
            title={bramyForm && bramyForm.id ? "Edytuj zlecenie – Bramy" : "Dodaj zlecenie – Bramy"}
          >
            <form onSubmit={e => {
              e.preventDefault();
              if (!bramyForm.dateReceived || !bramyForm.receivedBy || !bramyForm.wasteType || !bramyForm.rodzaj || !bramyForm.kontener || !bramyForm.address || !bramyForm.company || !bramyForm.realizationDate) {
                setBramyFormError('Wszystkie pola oprócz "Uwagi" są wymagane.');
                return;
              }
              setBramyFormError('');
              if (bramyForm.id) {
                // Edit mode
                authFetch(`/api/workorders/${bramyForm.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'bramy',
                    dateReceived: bramyForm.dateReceived,
                    executionDate: bramyForm.dateReceived,
                    receivedBy: bramyForm.receivedBy,
                    wasteType: bramyForm.wasteType,
                    rodzaj: bramyForm.rodzaj,
                    kontener: bramyForm.kontener,
                    address: bramyForm.address,
                    company: bramyForm.company,
                    realizationDate: bramyForm.realizationDate,
                    notes: bramyForm.notes && bramyForm.notes.trim() !== '' ? bramyForm.notes : null,
                  }),
                })
                  .then(res => res.json())
                  .then(updated => {
                    setWorkOrders(orders => (Array.isArray(orders) ? orders : []).map(o => o.id === updated.id ? updated : o));
                    setBramyModalOpen(false);
                  });
              } else {
                handleCreateBramy(bramyForm);
              }
            }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label>Data zgłoszenia *</label>
                <DatePicker selected={bramyForm.dateReceived} onChange={date => setBramyForm(f => ({ ...f, dateReceived: date }))} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
              </div>
              <div>
                <label>Przyjął *</label>
                <input value={bramyForm.receivedBy} onChange={e => setBramyForm(f => ({ ...f, receivedBy: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Odpad *</label>
                <input value={bramyForm.wasteType} onChange={e => setBramyForm(f => ({ ...f, wasteType: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Rodzaj *</label>
                <select value={bramyForm.rodzaj} onChange={e => setBramyForm(f => ({ ...f, rodzaj: e.target.value }))} required className="border rounded px-2 py-1 w-full">
                  <option value="">Wybierz...</option>
                  {BRAMY_RODZAJ_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label>Kontener *</label>
                <select value={bramyForm.kontener} onChange={e => setBramyForm(f => ({ ...f, kontener: e.target.value }))} required className="border rounded px-2 py-1 w-full">
                  <option value="">Wybierz...</option>
                  {BRAMY_KONTENER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label>Adres *</label>
                <input value={bramyForm.address} onChange={e => setBramyForm(f => ({ ...f, address: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Klient *</label>
                <input value={bramyForm.company} onChange={e => setBramyForm(f => ({ ...f, company: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Data realizacji *</label>
                <DatePicker selected={bramyForm.realizationDate} onChange={date => setBramyForm(f => ({ ...f, realizationDate: date }))} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
              </div>
              <div className="md:col-span-2">
                <label>Uwagi</label>
                <input value={bramyForm.notes} onChange={e => setBramyForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-2 py-1 w-full" />
              </div>
              {bramyFormError && <div className="text-red-600 text-sm md:col-span-2">{bramyFormError}</div>}
              <div className="flex space-x-3 md:col-span-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBramyModalOpen(false)} className="flex-1 border-gray-300 hover:bg-gray-50">Anuluj</Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">Zapisz</Button>
              </div>
            </form>
          </SimpleModal>
          <WorkOrderModal
            open={bramyAssignModal.open}
            onClose={() => setBramyAssignModal({ open: false, order: null })}
            onSave={handleAssignBramy}
            initial={bramyAssignModal.order}
            orderType="bramy"
          />
          <SimpleModal open={bramyCauseModal.open} onClose={() => setBramyCauseModal({ open: false, order: null })}>
            <h2 className="font-bold text-lg mb-2">Powód niezrealizowania</h2>
            <textarea className="border rounded px-2 py-1 w-full" value={bramyCause} onChange={e => setBramyCause(e.target.value)} />
            <Button className="mt-2" onClick={handleSaveBramyCause}>Zapisz powód</Button>
          </SimpleModal>
          {bramyLoading && <div className="text-blue-600 text-center mt-2">Zapisywanie...</div>}
          {bramyError && <div className="text-red-600 text-center mt-2">{bramyError}</div>}
        </>
      )}
      {activeTab === 'bezpylne' && (
        <>
          <div className="mb-4 flex items-center gap-4">
            <Button onClick={() => { setBezpylneForm({
              dateReceived: new Date(),
              receivedBy: '',
              address: '',
              company: '',
              rodzaj: '',
              zlecenie: '',
              realizationDate: '',
              notes: '',
            }); setBezpylneModalOpen(true); }} className="bg-blue-600 text-white">+ Dodaj zlecenie</Button>
          </div>
          <WorkOrdersGrid
            workOrders={sortPendingFirst(filterOrders(Array.isArray(workOrders) ? workOrders : [], 'bezpylne'))}
            onToggleComplete={handleToggleCompleteBezpylne}
            onAssign={order => setBezpylneAssignModal({ open: true, order })}
            onMarkFailed={order => setBezpylneCauseModal({ open: true, order })}
            onEdit={order => {
              setBezpylneModalOpen(true);
              setBezpylneForm({
                ...order,
                dateReceived: order.dateReceived ? new Date(order.dateReceived) : new Date(),
                realizationDate: order.realizationDate ? new Date(order.realizationDate) : '',
              });
            }}
            onDelete={handleDeleteOrder}
            title="Zlecenia Bezpylne"
            tabKey="bezpylne"
          />
          <SimpleModal 
            open={bezpylneModalOpen} 
            onClose={() => setBezpylneModalOpen(false)}
            title={bezpylneForm && bezpylneForm.id ? "Edytuj zlecenie – Bezpylne" : "Dodaj zlecenie – Bezpylne"}
          >
            <form onSubmit={e => {
              e.preventDefault();
              if (!bezpylneForm.dateReceived || !bezpylneForm.receivedBy || !bezpylneForm.address || !bezpylneForm.company || !bezpylneForm.rodzaj || !bezpylneForm.zlecenie || !bezpylneForm.realizationDate) {
                setBezpylneFormError('Wszystkie pola oprócz "Uwagi" są wymagane.');
                return;
              }
              setBezpylneFormError('');
              handleCreateBezpylne(bezpylneForm);
            }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label>Data zgłoszenia *</label>
                <DatePicker selected={bezpylneForm.dateReceived} onChange={date => setBezpylneForm(f => ({ ...f, dateReceived: date }))} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
              </div>
              <div>
                <label>Przyjął *</label>
                <input value={bezpylneForm.receivedBy} onChange={e => setBezpylneForm(f => ({ ...f, receivedBy: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Adres *</label>
                <input value={bezpylneForm.address} onChange={e => setBezpylneForm(f => ({ ...f, address: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Klient *</label>
                <input value={bezpylneForm.company} onChange={e => setBezpylneForm(f => ({ ...f, company: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Rodzaj *</label>
                <select value={bezpylneForm.rodzaj} onChange={e => setBezpylneForm(f => ({ ...f, rodzaj: e.target.value }))} required className="border rounded px-2 py-1 w-full">
                  <option value="">Wybierz...</option>
                  {BEZPYLNE_RODZAJ_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label>Zlecenie *</label>
                <textarea value={bezpylneForm.zlecenie} onChange={e => setBezpylneForm(f => ({ ...f, zlecenie: e.target.value }))} required className="border rounded px-2 py-1 w-full min-h-[60px]" />
              </div>
              <div>
                <label>Data realizacji *</label>
                <DatePicker selected={bezpylneForm.realizationDate} onChange={date => setBezpylneForm(f => ({ ...f, realizationDate: date }))} dateFormat="dd-MM-yyyy" className="border rounded px-2 py-1 w-full" required />
              </div>
              <div className="md:col-span-2">
                <label>Uwagi</label>
                <input value={bezpylneForm.notes} onChange={e => setBezpylneForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-2 py-1 w-full" />
              </div>
              {bezpylneFormError && <div className="text-red-600 text-sm md:col-span-2">{bezpylneFormError}</div>}
              <div className="flex space-x-3 md:col-span-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBezpylneModalOpen(false)} className="flex-1 border-gray-300 hover:bg-gray-50">Anuluj</Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">Zapisz</Button>
              </div>
            </form>
          </SimpleModal>
          <WorkOrderModal
            open={bezpylneAssignModal.open}
            onClose={() => setBezpylneAssignModal({ open: false, order: null })}
            onSave={handleAssignBezpylne}
            initial={bezpylneAssignModal.order}
            orderType="bezpylne"
          />
          <SimpleModal open={bezpylneCauseModal.open} onClose={() => setBezpylneCauseModal({ open: false, order: null })}>
            <h2 className="font-bold text-lg mb-2">Powód niezrealizowania</h2>
            <textarea className="border rounded px-2 py-1 w-full" value={bezpylneCause} onChange={e => setBezpylneCause(e.target.value)} />
            <Button className="mt-2" onClick={handleSaveBezpylneCause}>Zapisz powód</Button>
          </SimpleModal>
        </>
      )}
      <SimpleModal open={formModalOpen} onClose={() => setFormModalOpen(false)}>
        <h2 className="font-bold text-lg mb-2">{modalTitles[activeTab]}</h2>
        <WorkOrderModal onSubmit={handleCreate} orderType={activeTab} category={activeTab} />
      </SimpleModal>
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, order: null, loading: false })}
        onConfirm={confirmDeleteOrder}
        isLoading={deleteModal.loading}
        order={deleteModal.order}
      />
    </div>
  );
};

export default WorkOrders; 
