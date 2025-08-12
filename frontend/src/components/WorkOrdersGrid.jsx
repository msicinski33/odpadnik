import React from 'react';
import { WorkOrderCard } from "./WorkOrderCard";
import { Card, CardContent } from "./ui/card";
import { FileX } from "lucide-react";

export const WorkOrdersGrid = ({
  workOrders,
  onToggleComplete,
  onAssign,
  onMarkFailed,
  onEdit,
  onDelete,
  title
}) => {
  if (!workOrders || workOrders.length === 0) {
    return (
      <Card className="bg-white shadow-lg border border-gray-200 animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <FileX className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Brak zleceń
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            Nie ma jeszcze żadnych zleceń w tej kategorii. Kliknij przycisk "Dodaj zlecenie", aby utworzyć pierwsze zlecenie.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="text-sm text-gray-500">
          Znaleziono {workOrders.length} {workOrders.length === 1 ? 'zlecenie' : workOrders.length < 5 ? 'zlecenia' : 'zleceń'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {workOrders.map((order, index) => (
          <WorkOrderCard
            key={order.id}
            order={order}
            onToggleComplete={onToggleComplete}
            onAssign={onAssign}
            onMarkFailed={onMarkFailed}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}; 