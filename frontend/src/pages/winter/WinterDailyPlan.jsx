import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const WinterDailyPlan = () => {
  const [plans, setPlans] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'assignments', 'details'
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    assignmentType: '',
    searchTerm: ''
  });

  // Form data states
  const [planFormData, setPlanFormData] = useState({
    date: '',
    title: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    notes: ''
  });

  const [assignmentFormData, setAssignmentFormData] = useState({
    planId: '',
    driverId: '',
    vehicleId: '',
    routeId: '',
    assignmentType: 'route_clearing',
    startTime: '',
    endTime: '',
    status: 'planned',
    instructions: '',
    notes: ''
  });

  // Options data
  const [options, setOptions] = useState({
    drivers: [],
    vehicles: [],
    routes: [],
    assignmentTypes: [],
    statusOptions: []
  });

  // Status colors
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Fetch daily plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        date: selectedDate,
        status: filters.status,
        search: filters.searchTerm
      });

      const response = await fetch(`/api/winter-daily-plan?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch daily plans');
      }

      const data = await response.json();
      setPlans(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assignments for selected plan
  const fetchAssignments = async (planId) => {
    try {
      const response = await fetch(`/api/winter-daily-plan/${planId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  };

  // Fetch options for dropdowns
  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/winter-daily-plan/options', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOptions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  // Create or update plan
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const url = editingPlan 
        ? `/api/winter-daily-plan/${editingPlan.id}`
        : '/api/winter-daily-plan';
      
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(planFormData)
      });

      if (!response.ok) {
        throw new Error('Failed to save plan');
      }

      setShowPlanModal(false);
      setEditingPlan(null);
      resetPlanForm();
      fetchPlans();
    } catch (err) {
      setError(err.message);
    }
  };

  // Create or update assignment
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    try {
      const url = editingAssignment 
        ? `/api/winter-daily-plan/assignments/${editingAssignment.id}`
        : '/api/winter-daily-plan/assignments';
      
      const method = editingAssignment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(assignmentFormData)
      });

      if (!response.ok) {
        throw new Error('Failed to save assignment');
      }

      setShowAssignmentModal(false);
      setEditingAssignment(null);
      resetAssignmentForm();
      if (assignmentFormData.planId) {
        fetchAssignments(assignmentFormData.planId);
      }
      fetchPlans();
    } catch (err) {
      setError(err.message);
    }
  };

  // Generate PDF report
  const handleGeneratePDF = async (planId) => {
    try {
      const response = await fetch(`/api/winter-daily-plan/${planId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-plan-${selectedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
    }
  };

  // Form reset functions
  const resetPlanForm = () => {
    setPlanFormData({
      date: selectedDate,
      title: '',
      description: '',
      status: 'draft',
      priority: 'medium',
      notes: ''
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentFormData({
      planId: '',
      driverId: '',
      vehicleId: '',
      routeId: '',
      assignmentType: 'route_clearing',
      startTime: '',
      endTime: '',
      status: 'planned',
      instructions: '',
      notes: ''
    });
  };

  // Edit handlers
  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      date: plan.date.split('T')[0],
      title: plan.title,
      description: plan.description || '',
      status: plan.status,
      priority: plan.priority,
      notes: plan.notes || ''
    });
    setShowPlanModal(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentFormData({
      planId: assignment.planId,
      driverId: assignment.driverId || '',
      vehicleId: assignment.vehicleId || '',
      routeId: assignment.routeId || '',
      assignmentType: assignment.assignmentType,
      startTime: assignment.startTime || '',
      endTime: assignment.endTime || '',
      status: assignment.status,
      instructions: assignment.instructions || '',
      notes: assignment.notes || ''
    });
    setShowAssignmentModal(true);
  };

  useEffect(() => {
    fetchPlans();
    fetchOptions();
  }, [selectedDate, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Plan Dzienny AZ</h1>
          <p className="text-gray-600">Zarządzanie planami dziennymi i listami statycznymi AZ</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              resetPlanForm();
              setShowPlanModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Nowy Plan
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Wszystkie statusy</option>
              <option value="draft">Szkic</option>
              <option value="active">Aktywny</option>
              <option value="completed">Zakończony</option>
              <option value="cancelled">Anulowany</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wyszukaj
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj planów..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              />
            </div>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Widok
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Przegląd</option>
              <option value="assignments">Przydziały</option>
              <option value="details">Szczegóły</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Plans Overview */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(plan.date).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {plan.statusLabel}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(plan.priority)}`}>
                      {plan.priorityLabel}
                    </span>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                )}

                {/* Plan Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {plan.statistics?.totalAssignments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Przydziały</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {plan.statistics?.completedAssignments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Wykonane</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {plan.statistics?.activeAssignments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Aktywne</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <PencilIcon className="h-4 w-4 inline mr-1" />
                    Edytuj
                  </button>
                  <button
                    onClick={() => {
                      setAssignmentFormData({ ...assignmentFormData, planId: plan.id });
                      setShowAssignmentModal(true);
                    }}
                    className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <UserGroupIcon className="h-4 w-4 inline mr-1" />
                    Przydziały
                  </button>
                  <button
                    onClick={() => handleGeneratePDF(plan.id)}
                    className="flex-1 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 inline mr-1" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="col-span-full text-center py-12">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Brak planów
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Nie znaleziono planów dla wybranej daty.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPlan ? 'Edytuj Plan' : 'Nowy Plan'}
              </h3>
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  setEditingPlan(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={planFormData.date}
                  onChange={(e) => setPlanFormData({ ...planFormData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tytuł
                </label>
                <input
                  type="text"
                  required
                  value={planFormData.title}
                  onChange={(e) => setPlanFormData({ ...planFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tytuł planu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis
                </label>
                <textarea
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Opis planu"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={planFormData.status}
                    onChange={(e) => setPlanFormData({ ...planFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Szkic</option>
                    <option value="active">Aktywny</option>
                    <option value="completed">Zakończony</option>
                    <option value="cancelled">Anulowany</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorytet
                  </label>
                  <select
                    value={planFormData.priority}
                    onChange={(e) => setPlanFormData({ ...planFormData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Średni</option>
                    <option value="high">Wysoki</option>
                    <option value="critical">Krytyczny</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uwagi
                </label>
                <textarea
                  value={planFormData.notes}
                  onChange={(e) => setPlanFormData({ ...planFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Dodatkowe uwagi"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanModal(false);
                    setEditingPlan(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPlan ? 'Aktualizuj' : 'Utwórz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinterDailyPlan;