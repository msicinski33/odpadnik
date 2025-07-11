import React from 'react';
import WorkOrderCard from './WorkOrderCard';

interface WorkOrder {
  id: string;
  dateReceived?: string;
  receivedBy?: string;
  address?: string;
  company?: string;
  rodzaj?: string;
  zlecenie?: string;
  realizationDate?: string;
  vehicle?: string;
  responsible?: string;
  notes?: string;
  completed?: boolean;
  failureReason?: string;
}

interface WorkOrdersGridProps {
  workOrders: WorkOrder[];
  onToggleComplete: (order: WorkOrder, completed: boolean) => void;
  onAssign: (order: WorkOrder) => void;
  onMarkFailed: (order: WorkOrder) => void;
  tabKey: string;
  onDelete: (order: WorkOrder) => void;
  onEdit: (order: WorkOrder) => void;
}

const headings = {
  surowce: 'ZLECENIA ODBIORU SUROWCÓW WTÓRNYCH',
  worki: 'ZLECENIA ODBIORU WORKÓW GRUZOWYCH',
  uslugi: 'ZLECENIA USŁUG',
  bramy: 'ZLECENIE ODBIORU NA BRAMĘ',
  bezpylne: 'ZLECENIA ODBIORU NA BEZPYLNE',
};

const WorkOrdersGrid: React.FC<WorkOrdersGridProps> = ({
  workOrders,
  onToggleComplete,
  onAssign,
  onMarkFailed,
  tabKey,
  onDelete,
  onEdit
}) => {
  // Sort orders: pending first, then completed
  const sortedOrders = Array.isArray(workOrders) ? [...workOrders].sort((a, b) => {
    const aCompleted = !!a.completed;
    const bCompleted = !!b.completed;
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? 1 : -1;
  }) : [];

  const pendingOrders = sortedOrders.filter(o => !o.completed);
  const completedOrders = sortedOrders.filter(o => !!o.completed);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{headings[tabKey]}</h2>
          {/* Remove or wrap the <h2 className="text-2xl font-bold text-gray-900">Zlecenia Bezpylne</h2> in a conditional so it only renders for the bezpylne tab. */}
          <div className="text-sm text-gray-500">
            {workOrders.length} {workOrders.length === 1 ? 'zlecenie' : 'zleceń'}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {sortedOrders.map(order => (
          <WorkOrderCard
            key={order.id}
            order={order}
            onToggleComplete={onToggleComplete}
            onAssign={onAssign}
            onMarkFailed={onMarkFailed}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
        {sortedOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">Brak zleceń</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrdersGrid; 