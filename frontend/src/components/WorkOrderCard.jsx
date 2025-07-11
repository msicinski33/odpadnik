import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, MapPin, User, Truck, FileText, AlertCircle, CheckCircle2, Clock, Pencil } from 'lucide-react';
import SimpleModal from './SimpleModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  type?: string; // Added for worki gruzowe
  quantity?: string; // Added for worki gruzowe
  orderNumber?: string; // Added for worki gruzowe
  bagNumber?: string; // Added for worki gruzowe
  wasteType?: string; // Added for uslugi
  kontener?: string; // Added for uslugi
}

interface WorkOrderCardProps {
  order: WorkOrder;
  onToggleComplete: (order: WorkOrder, completed: boolean) => void;
  onAssign: (order: WorkOrder) => void;
  onMarkFailed: (order: WorkOrder) => void;
  onDelete: (order: WorkOrder) => void;
  onEdit: (order: WorkOrder) => void;
}

const WorkOrderCard: React.FC<WorkOrderCardProps> = ({
  order,
  onToggleComplete,
  onAssign,
  onMarkFailed,
  onDelete,
  onEdit
}) => {
  const getStatusBadge = () => {
    if (order.failureReason && order.failureReason.trim() !== "") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Niezrealizowane
        </Badge>
      );
    }
    if (order.completed) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Zakończone
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Oczekuje
      </Badge>
    );
  };

  // Determine card color based on status
  let cardColor = "border-l-blue-500 bg-white";
  if (order.failureReason && order.failureReason.trim() !== "") {
    cardColor = "border-l-red-600 bg-red-50";
  } else if (order.completed) {
    cardColor = "border-l-green-600 bg-green-50";
  } else {
    cardColor = "border-l-gray-400 bg-gray-50";
  }

  const [showRealizationModal, setShowRealizationModal] = useState(false);
  const [realizationDate, setRealizationDate] = useState(new Date());
  const [completePending, setCompletePending] = useState(false);

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 border-l-4 ${cardColor}`}>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900">{order.company}</h3>
              {getStatusBadge()}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>{order.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{order.rodzaj}</span>
              </div>
              
              {order.zlecenie && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Zlecenie:</span> {order.zlecenie}
                </div>
              )}

              {/* Worki gruzowe specific fields */}
              {order.type === 'worki' && (
                <>
                  {order.quantity && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Ilość:</span> {order.quantity}
                    </div>
                  )}
                  {order.orderNumber && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Numer zlecenia/KPO:</span> {order.orderNumber}
                    </div>
                  )}
                  {order.bagNumber && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Numer worka:</span> {order.bagNumber}
                    </div>
                  )}
                </>
              )}

              {/* Usługi specific fields */}
              {order.type === 'uslugi' && (
                <>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Odpad:</span> {order.wasteType || '-'}
                  </div>
                  {/* Remove 'Rodzaj' from here */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Kontener:</span> {order.kontener || '-'}
                  </div>
                </>
              )}

              {/* Bramy specific fields */}
              {order.type === 'bramy' && (
                <>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Odpad:</span> {order.wasteType || '-'}
                  </div>
                  {/* Remove 'Rodzaj' from here */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Kontener:</span> {order.kontener || '-'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Middle Column - Dates & Personnel */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Zgłoszenie:</span>
                <span className="font-medium">
                  {order.dateReceived ? new Date(order.dateReceived).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">Data realizacji:</span>
                <span className="font-medium">
                  {order.realizationDate ? new Date(order.realizationDate).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {order.receivedBy && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">Przyjął:</span>
                  <span className="font-medium">{order.receivedBy}</span>
                </div>
              )}
              
              {order.responsible && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span className="text-gray-600">Odpowiedzialny:</span>
                  <span className="font-medium">{order.responsible}</span>
                </div>
              )}
              
              {order.vehicle && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Pojazd:</span>
                  <span className="font-medium">{order.vehicle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Notes */}
          <div className="space-y-4 flex flex-col items-end justify-between h-full">
            {order.notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium mb-1">Uwagi:</p>
                <p className="text-sm text-gray-800">{order.notes}</p>
              </div>
            )}

            <div className="flex flex-row flex-nowrap gap-1 w-full max-w-[400px] justify-end whitespace-nowrap">
              <Button 
                onClick={() => onAssign(order)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 min-w-0 px-2 py-1 text-xs flex items-center gap-1 justify-center"
              >
                <span>🔧</span>
                Przypisz
              </Button>
              {!order.completed && !order.failureReason && (
                <Button
                  variant="destructive"
                  onClick={() => onMarkFailed(order)}
                  className="flex-1 min-w-[120px] px-2 py-1 text-xs flex items-center gap-1 justify-center"
                  title="Oznacz jako niezrealizowane"
                >
                  <AlertCircle className="w-3 h-3" />
                  Niezrealizowane
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => onEdit(order)}
                className="flex-1 min-w-0 px-2 py-1 text-xs flex items-center gap-1 justify-center"
                title="Edytuj zlecenie"
              >
                <Pencil className="w-3 h-3" />
                Edytuj
              </Button>
            </div>

            {!order.failureReason && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {order.type === 'worki' ? (
                  <>
                    <input
                      type="checkbox"
                      id={`complete-${order.id}`}
                      checked={!!order.completed}
                      onChange={e => {
                        if (!order.completed && e.target.checked) {
                          setShowRealizationModal(true);
                        } else {
                          onToggleComplete(order, e.target.checked);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`complete-${order.id}`}
                      className={`text-sm font-medium cursor-pointer ${order.completed ? "text-green-600" : "text-gray-600"}`}
                    >
                      {order.completed ? "Zakończone" : "Oznacz jako zakończone"}
                    </label>
                    {showRealizationModal && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                        <div className="bg-white p-6 rounded shadow-lg min-w-[320px]">
                          <h3 className="font-semibold mb-2">Podaj datę realizacji</h3>
                          <DatePicker
                            selected={realizationDate}
                            onChange={date => setRealizationDate(date)}
                            dateFormat="dd-MM-yyyy"
                            className="border rounded px-2 py-1 w-full mb-4"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                              onClick={() => setShowRealizationModal(false)}
                              type="button"
                            >Anuluj</button>
                            <button
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                              onClick={() => {
                                setShowRealizationModal(false);
                                onToggleComplete(order, true, realizationDate);
                              }}
                              type="button"
                              disabled={!realizationDate}
                            >Zapisz</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      id={`complete-${order.id}`}
                      checked={!!order.completed}
                      onChange={e => onToggleComplete(order, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`complete-${order.id}`}
                      className={`text-sm font-medium cursor-pointer ${order.completed ? "text-green-600" : "text-gray-600"}`}
                    >
                      {order.completed ? "Zakończone" : "Oznacz jako zakończone"}
                    </label>
                  </>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={() => onDelete(order)}
                >
                  Usuń
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderCard; 