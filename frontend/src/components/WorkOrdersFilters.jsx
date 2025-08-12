import React from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { CalendarDays, Search, X, Download } from "lucide-react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const WorkOrdersFilters = ({
  filterDate,
  onFilterDateChange,
  searchTerm,
  onSearchTermChange,
  onClearFilters,
  pendingCount,
  onDownloadPDF,
  showPDFButton = false
}) => {
  return (
    <Card className="bg-white shadow-lg border border-gray-200 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
          {/* Date Filter */}
          <div className="space-y-2 min-w-[200px]">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              Data wykonania
            </Label>
            <div className="relative">
              <DatePicker
                selected={filterDate}
                onChange={onFilterDateChange}
                dateFormat="dd-MM-yyyy"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholderText="Wybierz datę"
                isClearable
              />
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2 flex-1 min-w-[250px]">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              Wyszukiwanie
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Szukaj po adresie, kliencie, odpadzie..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 pr-10 h-10 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchTermChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            {filterDate && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-lg border border-yellow-200">
                <div className="text-sm font-medium text-yellow-800">Niezrealizowane zlecenia</div>
                <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              </div>
            )}
            
            <div className="flex gap-2">
              {showPDFButton && onDownloadPDF && (
                <Button
                  onClick={onDownloadPDF}
                  variant="outline"
                  size="default"
                  className="whitespace-nowrap border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
              
              <Button
                onClick={onClearFilters}
                variant="outline"
                size="default"
                className="whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-2" />
                Wyczyść
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 