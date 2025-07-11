import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Plus, Filter, Search } from 'lucide-react';

// Optional: Pass ImportButton as a prop for flexibility
const DataPageHeader = ({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Szukaj...',
  onFilterClick,
  filterLabel = 'Filtry',
  ImportButtonComponent,
  onAddClick,
  addLabel = 'Dodaj',
  addIcon = <Plus className="h-4 w-4 mr-2" />,
  importButtonProps = {},
  showSearch = true,
  showFilter = true,
  showImport = true,
  showAdd = true,
}) => {
  return (
    <Card className="mb-8 shadow-lg border-0 bg-white">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {showSearch && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={onSearchChange}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
            {showFilter && (
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50" onClick={onFilterClick}>
                <Filter className="h-4 w-4 mr-2" />
                {filterLabel}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {showImport && ImportButtonComponent}
            {showAdd && (
              <Button onClick={onAddClick} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                {addIcon}
                {addLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataPageHeader; 