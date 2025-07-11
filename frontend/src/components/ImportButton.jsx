import React, { useState } from 'react';
import ImportModal from './ImportModal';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';

const ImportButton = ({ entityType, onImport, templateColumns, templateFileName }) => {
  const [open, setOpen] = useState(false);
  const safeEntityType = entityType || 'data';

  return (
    <>
      <Button
        variant="outline"
        className="border-blue-600 text-blue-700 hover:bg-blue-50 flex items-center"
        onClick={() => setOpen(true)}
      >
        <Upload className="h-4 w-4 mr-2" />
        Importuj Dane
      </Button>
      <ImportModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Import ${safeEntityType.charAt(0).toUpperCase() + safeEntityType.slice(1)}`}
        requiredColumns={templateColumns}
        templateFileName={templateFileName}
        onImport={onImport}
        entityType={safeEntityType}
      />
    </>
  );
};

export default ImportButton; 