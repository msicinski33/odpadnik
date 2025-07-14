import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import authFetch from '../utils/authFetch';
import { toast } from 'sonner';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const DocumentUploadModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    contractNumber: '',
    parties: '',
    description: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (formDataToSend) => {
      const data = new FormData();
      data.append('document', selectedFile);
      data.append('contractNumber', formDataToSend.contractNumber);
      data.append('parties', formDataToSend.parties);
      data.append('description', formDataToSend.description);
      data.append('tags', formDataToSend.tags);

      const response = await authFetch('/api/documents', {
        method: 'POST',
        body: data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Dokument został dodany pomyślnie');
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error('Błąd podczas dodawania dokumentu: ' + error.message);
      setIsUploading(false);
    }
  });

  const resetForm = () => {
    setFormData({
      contractNumber: '',
      parties: '',
      description: '',
      tags: ''
    });
    setSelectedFile(null);
    setIsUploading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (file.type !== 'application/pdf') {
        toast.error('Tylko pliki PDF są dozwolone');
        return;
      }
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Plik jest za duży. Maksymalny rozmiar to 50MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Proszę wybrać plik PDF');
      return;
    }

    if (!formData.parties.trim()) {
      toast.error('Pole "Strony" jest wymagane');
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dodaj nowy dokument</h2>
              <p className="text-sm text-gray-600">Prześlij dokument PDF z metadanymi</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <Label htmlFor="document" className="text-sm font-medium text-gray-700 mb-2 block">
              Dokument PDF *
            </Label>
            <div className="mt-1">
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-2 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="document"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Wybierz plik</span>
                      <input
                        id="document"
                        name="document"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="pl-1">lub przeciągnij i upuść</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF do 50MB</p>
                </div>
              </div>
              {selectedFile && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-xs text-green-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contract Number */}
          <div>
            <Label htmlFor="contractNumber" className="text-sm font-medium text-gray-700">
              Numer umowy
            </Label>
            <Input
              id="contractNumber"
              type="text"
              value={formData.contractNumber}
              onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
              placeholder="np. UM/2024/001"
              disabled={isUploading}
              className="mt-1"
            />
          </div>

          {/* Parties */}
          <div>
            <Label htmlFor="parties" className="text-sm font-medium text-gray-700">
              Strony umowy *
            </Label>
            <Input
              id="parties"
              type="text"
              value={formData.parties}
              onChange={(e) => setFormData({ ...formData, parties: e.target.value })}
              placeholder="np. Twoja Firma – XYZ Sp. z o.o."
              disabled={isUploading}
              className="mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Opis / Uwagi
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Krótki opis dokumentu lub dodatkowe uwagi..."
              disabled={isUploading}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
              Tagi
            </Label>
            <Input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="umowa, kontrakt, ważne (oddzielone przecinkami)"
              disabled={isUploading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tagi pomagają w organizacji i wyszukiwaniu dokumentów
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informacje o przesyłaniu:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Maksymalny rozmiar pliku: 50MB</li>
                  <li>• Dozwolone formaty: PDF</li>
                  <li>• Wszyscy użytkownicy mogą przeglądać i dodawać adnotacje</li>
                  <li>• Tylko administratorzy mogą edytować metadane i usuwać dokumenty</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !formData.parties.trim() || isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Przesyłanie...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Dodaj dokument
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal; 