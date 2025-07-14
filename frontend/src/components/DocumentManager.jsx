import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import { 
  Upload, 
  Download, 
  Search, 
  FileText, 
  Paperclip, 
  Calendar, 
  User, 
  Filter,
  Plus,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';
import authFetch from '../utils/authFetch';

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    contractNumber: '',
    parties: '',
    description: '',
    tags: '',
    file: null
  });
  const { toast } = useToast();

  // Fetch documents
  const fetchDocuments = async (page = 1, search = '', tags = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search,
        tags
      });
      
      const response = await authFetch(`/api/documents?${params}`);
      const data = await response.json();
      
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać dokumentów",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle search
  const handleSearch = () => {
    fetchDocuments(1, searchTerm, tagFilter);
  };

  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.parties) {
      toast({
        title: "Błąd",
        description: "Wybierz plik i uzupełnij wymagane pola",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('document', uploadForm.file);
    formData.append('contractNumber', uploadForm.contractNumber);
    formData.append('parties', uploadForm.parties);
    formData.append('description', uploadForm.description);
    formData.append('tags', uploadForm.tags);

    try {
      await authFetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      toast({
        title: "Sukces",
        description: "Dokument został pomyślnie dodany"
      });
      
      setUploadModalOpen(false);
      setUploadForm({
        contractNumber: '',
        parties: '',
        description: '',
        tags: '',
        file: null
      });
      fetchDocuments(pagination.page, searchTerm, tagFilter);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać dokumentu",
        variant: "destructive"
      });
    }
  };

  // Handle document download
  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await authFetch(`/api/documents/${documentId}/download`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać dokumentu",
        variant: "destructive"
      });
    }
  };

  // View document details
  const viewDocument = async (documentId) => {
    try {
      const response = await authFetch(`/api/documents/${documentId}`);
      const document = await response.json();
      setSelectedDocument(document);
      setViewModalOpen(true);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać szczegółów dokumentu",
        variant: "destructive"
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Parse tags
  const parseTags = (tags) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dokumenty i Umowy</h1>
          <p className="text-muted-foreground">Zarządzaj dokumentami PDF i umowami</p>
        </div>
        
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Dodaj dokument
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Dodaj nowy dokument</DialogTitle>
              <DialogDescription>
                Dodaj nowy dokument do systemu
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractNumber">Numer umowy</Label>
                  <Input
                    id="contractNumber"
                    value={uploadForm.contractNumber}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, contractNumber: e.target.value }))}
                    placeholder="Opcjonalnie"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parties">Strony *</Label>
                  <Input
                    id="parties"
                    value={uploadForm.parties}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, parties: e.target.value }))}
                    placeholder="Strony umowy"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opis dokumentu"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tagi</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Plik dokumentu *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Obsługiwane formaty: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF (max 50MB)
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit">Dodaj dokument</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Szukaj dokumentów</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="search"
                  placeholder="Szukaj po numerze umowy, stronach, opisie lub nazwie pliku"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="tagFilter">Filtruj po tagach</Label>
              <Input
                id="tagFilter"
                placeholder="tag1, tag2"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setTagFilter('');
              fetchDocuments(1, '', '');
            }}>
              Wyczyść filtry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="text-muted-foreground">Ładowanie dokumentów...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base line-clamp-1">
                      {document.contractNumber || document.fileName}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => viewDocument(document.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDownload(document.id, document.fileName)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {document.parties}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {document.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {document.description}
                  </p>
                )}
                
                {document.tags && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {parseTags(document.tags).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <Separator className="my-3" />
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>{document.uploader.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>{formatFileSize(document.fileSize)}</span>
                    {document.attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        <span>{document.attachments.length}</span>
                      </div>
                    )}
                    {document._count.annotations > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {document._count.annotations} adnotacje
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => fetchDocuments(pagination.page - 1, searchTerm, tagFilter)}
          >
            Poprzednia
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Strona {pagination.page} z {pagination.pages}
            </span>
          </div>
          
          <Button
            variant="outline"
            disabled={pagination.page === pagination.pages}
            onClick={() => fetchDocuments(pagination.page + 1, searchTerm, tagFilter)}
          >
            Następna
          </Button>
        </div>
      )}

      {/* Document Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDocument.contractNumber || selectedDocument.fileName}</DialogTitle>
                <DialogDescription>Szczegóły dokumentu i załączniki</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Strony</Label>
                    <p className="text-sm text-muted-foreground">{selectedDocument.parties}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Rozmiar pliku</Label>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedDocument.fileSize)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Dodane przez</Label>
                    <p className="text-sm text-muted-foreground">{selectedDocument.uploader.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Data dodania</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedDocument.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {selectedDocument.description && (
                  <div>
                    <Label className="text-sm font-medium">Opis</Label>
                    <p className="text-sm text-muted-foreground">{selectedDocument.description}</p>
                  </div>
                )}
                
                {selectedDocument.tags && (
                  <div>
                    <Label className="text-sm font-medium">Tagi</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {parseTags(selectedDocument.tags).map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDocument.attachments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Załączniki</Label>
                    <div className="space-y-2 mt-2">
                      {selectedDocument.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm">{attachment.fileName}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                    Zamknij
                  </Button>
                  <Button onClick={() => handleDownload(selectedDocument.id, selectedDocument.fileName)}>
                    <Download className="h-4 w-4 mr-2" />
                    Pobierz
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 