import React from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { CalendarDays, Search, X, Download, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export const OneTimeOrdersFilters = ({
  status,
  onStatusChange,
  clientCode,
  onClientCodeChange,
  from,
  onFromChange,
  to,
  onToChange,
  search,
  onSearchChange,
  onClearFilters
}) => {
  const STATUS_OPTIONS = [
    { value: 'all', label: 'Wszystkie statusy' },
    { value: 'AWAITING_EXECUTION', label: 'Oczekuje na realizację' },
    { value: 'CONTAINER_DELIVERED', label: 'Kontener dostarczony' },
    { value: 'AWAITING_COMPLETION', label: 'Oczekuje na odbiór' },
    { value: 'COMPLETED', label: 'Zakończone' },
    { value: 'CANCELLED', label: 'Anulowane' },
  ];

  return (
    <Card className="bg-white shadow-lg border border-gray-200 animate-fade-in">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Status Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-blue-600" />
              Status
            </Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Wszystkie statusy" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-blue-600" />
              Data od
            </Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="w-full h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-blue-600" />
              Data do
            </Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => onToChange(e.target.value)}
              className="w-full h-8 text-xs"
            />
          </div>

          {/* Client Code */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Search className="h-3 w-3 text-blue-600" />
              Kod klienta
            </Label>
            <Input
              type="text"
              placeholder="Kod klienta"
              value={clientCode}
              onChange={(e) => onClientCodeChange(e.target.value)}
              className="w-full h-8 text-xs"
            />
          </div>

          {/* Search */}
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Search className="h-3 w-3 text-blue-600" />
              Wyszukiwanie
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Szukaj po adresie, kliencie, odpadzie..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-7 pr-7 h-8 text-xs transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="md:col-span-2 lg:col-span-1">
            <Button
              onClick={onClearFilters}
              variant="outline"
              size="sm"
              className="whitespace-nowrap text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Wyczyść
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
