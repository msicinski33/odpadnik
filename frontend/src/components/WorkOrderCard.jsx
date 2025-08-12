import React from 'react';
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Calendar, 
  MapPin, 
  Building, 
  User, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Edit,
  Trash2,
  UserCheck,
  Package,
  Hash,
  FileText,
  MessageSquare
} from "lucide-react";

export const WorkOrderCard = ({ 
  order, 
  onToggleComplete, 
  onAssign, 
  onMarkFailed, 
  onEdit, 
  onDelete 
}) => {
  const getStatusBadge = () => {
    if (order.cause) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Niezrealizowane
        </Badge>
      );
    }
    if (order.completed) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Zrealizowane
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Oczekujące
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nie określono';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const getOrderTitle = () => {
    switch (order.type) {
      case 'surowce':
        return order.wasteType || order.odpad || 'Surowce wtórne';
      case 'worki':
        return `Worki gruzowe - ${order.quantity || ''} ${order.rodzaj || ''}`;
      case 'uslugi':
        return `${order.wasteType || ''} - ${order.rodzaj || ''}`;
      case 'bramy':
        return `${order.wasteType || ''} - ${order.rodzaj || ''}`;
      case 'bezpylne':
        return `${order.rodzaj || ''} - Bezpylne`;
      default:
        return order.wasteType || order.rodzaj || 'Zlecenie';
    }
  };

  const renderOrderSpecificFields = () => {
    const fields = [];

    // Common fields for all types
    if (order.receivedBy) {
      fields.push(
        <div key="receivedBy" className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-blue-600" />
          <span className="text-gray-500">Przyjął:</span>
          <span className="font-medium">{order.receivedBy}</span>
        </div>
      );
    }

    // Type-specific fields
    switch (order.type) {
      case 'surowce':
        if (order.odpad) {
          fields.push(
            <div key="odpad" className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-gray-500">Odpad:</span>
              <span className="font-medium">{order.odpad}</span>
            </div>
          );
        }
        if (order.rodzaj) {
          fields.push(
            <div key="rodzaj" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-gray-500">Rodzaj:</span>
              <span className="font-medium">{order.rodzaj}</span>
            </div>
          );
        }
        break;

      case 'worki':
        if (order.quantity) {
          fields.push(
            <div key="quantity" className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-gray-500">Ilość:</span>
              <span className="font-medium">{order.quantity}</span>
            </div>
          );
        }
        if (order.rodzaj) {
          fields.push(
            <div key="rodzaj" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-gray-500">Rodzaj:</span>
              <span className="font-medium">{order.rodzaj}</span>
            </div>
          );
        }
        if (order.orderNumber) {
          fields.push(
            <div key="orderNumber" className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-orange-600" />
              <span className="text-gray-500">Nr zlecenia:</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
          );
        }
        if (order.bagNumber) {
          fields.push(
            <div key="bagNumber" className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-gray-500">Nr worka:</span>
              <span className="font-medium">{order.bagNumber}</span>
            </div>
          );
        }
        break;

      case 'uslugi':
      case 'bramy':
        if (order.wasteType) {
          fields.push(
            <div key="wasteType" className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-gray-500">Odpad:</span>
              <span className="font-medium">{order.wasteType}</span>
            </div>
          );
        }
        if (order.rodzaj) {
          fields.push(
            <div key="rodzaj" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-gray-500">Rodzaj:</span>
              <span className="font-medium">{order.rodzaj}</span>
            </div>
          );
        }
        if (order.kontener) {
          fields.push(
            <div key="kontener" className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-indigo-600" />
              <span className="text-gray-500">Kontener:</span>
              <span className="font-medium">{order.kontener}</span>
            </div>
          );
        }
        break;

      case 'bezpylne':
        if (order.rodzaj) {
          fields.push(
            <div key="rodzaj" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-gray-500">Rodzaj:</span>
              <span className="font-medium">{order.rodzaj}</span>
            </div>
          );
        }
        if (order.zlecenie) {
          fields.push(
            <div key="zlecenie" className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-gray-500">Zlecenie:</span>
              <span className="font-medium">{order.zlecenie}</span>
            </div>
          );
        }
        break;
    }

    return fields;
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border animate-fade-in ${
      order.completed 
        ? "bg-gradient-to-br from-green-50 to-white border-green-200" 
        : order.cause 
          ? "bg-gradient-to-br from-red-50 to-white border-red-200"
          : "bg-white hover:shadow-xl border-gray-200"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {getOrderTitle()}
            </h3>
            {order.company && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building className="h-4 w-4" />
                {order.company}
              </div>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-3">
          {order.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-gray-500">Adres:</span>
              <span className="font-medium">{order.address}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-gray-500">Zgłoszenie:</span>
            <span className="font-medium">{formatDate(order.dateReceived)}</span>
          </div>

          {order.realizationDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span className="text-gray-500">Realizacja:</span>
              <span className="font-medium">{formatDate(order.realizationDate)}</span>
            </div>
          )}

          {/* Order-specific fields */}
          {renderOrderSpecificFields()}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-blue-800">Uwagi:</span>
                <p className="text-sm text-blue-700 mt-1">{order.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Info */}
        {(order.responsible || order.vehicle) && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            {order.responsible && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-gray-500">Odpowiedzialny:</span>
                <span className="font-medium">{order.responsible}</span>
              </div>
            )}
            {order.vehicle && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="text-gray-500">Pojazd:</span>
                <span className="font-medium">{order.vehicle}</span>
              </div>
            )}
          </div>
        )}

        {/* Failure Reason */}
        {order.cause && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-red-800">Powód niezrealizowania:</span>
                <p className="text-sm text-red-700 mt-1">{order.cause}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <Button
            onClick={() => onEdit(order)}
            variant="ghost"
            size="sm"
            className="flex-1 min-w-fit"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edytuj
          </Button>

          <Button
            onClick={() => onAssign(order)}
            variant="outline"
            size="sm"
            className="flex-1 min-w-fit"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Przypisz
          </Button>

          {!order.completed && !order.cause && (
            <Button
              onClick={() => onToggleComplete(order, true)}
              variant="default"
              size="sm"
              className="flex-1 min-w-fit bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Zakończ
            </Button>
          )}

          {!order.completed && !order.cause && (
            <Button
              onClick={() => onMarkFailed(order)}
              variant="destructive"
              size="sm"
              className="flex-1 min-w-fit"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Odrzuć
            </Button>
          )}

          {order.completed && (
            <Button
              onClick={() => onToggleComplete(order, false)}
              variant="outline"
              size="sm"
              className="flex-1 min-w-fit"
            >
              <Clock className="h-4 w-4 mr-1" />
              Przywróć
            </Button>
          )}

          <Button
            onClick={() => onDelete(order)}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 