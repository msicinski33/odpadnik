import React, { useState, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserContext } from '../UserContext';
import { 
  X, 
  Download, 
  Edit, 
  Trash2, 
  Paperclip, 
  FileText,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// IMPORTANT: Copy node_modules/pdfjs-dist/build/pdf.worker.min.js to public/pdf.worker.min.js
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const DocumentViewModal = ({ open, document: initialDocument, onClose, onEdit, onDelete }) => {
  const { user } = useContext(UserContext);
  
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Fetch full document data
  const { data: document, isLoading } = useQuery({
    queryKey: ['document', initialDocument.id],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${initialDocument.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch document');
      return response.json();
    },
    enabled: Boolean(open && initialDocument?.id)
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Handle window resizing to update the width for PDF scaling
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!open || !document) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{document.fileName}</h2>
              <p className="text-sm text-gray-600">
                {document.contractNumber && `Nr: ${document.contractNumber} • `}
                {document.parties}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/documents/${document.id}/download`, {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error('Download failed');
                  }
                  
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = document.fileName;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Download error:', error);
                  alert('Błąd pobierania pliku');
                }
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Pobierz
            </Button>
            
            {user?.role === 'admin' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edytuj
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Usuń
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Document Info */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Document Info */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Informacje o dokumencie</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Dodano: {formatDate(document.uploadedAt)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Przez: {document.uploader.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{formatFileSize(document.fileSize)}</span>
                </div>
                
                {document.description && (
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Opis:</p>
                    <p className="text-gray-500 text-xs">{document.description}</p>
                  </div>
                )}
                
                {document.tags && (
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Tagi:</p>
                    <div className="flex flex-wrap gap-1">
                      {document.tags.split(',').map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            {document.attachments?.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Załączniki</h3>
                <div className="space-y-2">
                  {document.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">{attachment.fileName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/documents/attachments/${attachment.id}/download`, {
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              }
                            });
                            
                            if (!response.ok) {
                              throw new Error('Download failed');
                            }
                            
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = attachment.fileName;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (error) {
                            console.error('Download error:', error);
                            alert('Błąd pobierania załącznika');
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - PDF Viewer */}
          <div className="flex-1 flex flex-col">
            {/* PDF Controls */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                      disabled={scale <= 0.5}
                    >
                      -
                    </Button>
                    <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScale(Math.min(3, scale + 0.1))}
                      disabled={scale >= 3}
                    >
                      +
                    </Button>
                  </div>
                  
                  {numPages && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                        disabled={pageNumber <= 1}
                      >
                        ←
                      </Button>
                      <span className="text-sm">
                        Strona {pageNumber} z {numPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                        disabled={pageNumber >= numPages}
                      >
                        →
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PDF Document */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Ładowanie dokumentu...</div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <PDFDocument
                    file={`/api/documents/${document.id}/download`}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => console.error('Document load error:', error)}
                    loading={<div className="text-gray-500">Ładowanie PDF...</div>}
                    error={<div className="text-red-500">Błąd ładowania PDF</div>}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      width={Math.min(800, windowWidth - 400)}
                      onLoadError={(error) => console.error('Page load error:', error)}
                    />
                  </PDFDocument>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewModal;
