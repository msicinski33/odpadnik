const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireAdmin } = require('./authMiddleware');

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    try {
      require('fs').mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDFs for main documents, various formats for attachments
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.ms-excel',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Get all documents (with pagination and search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', tags = '' } = req.query;
    const skip = (page - 1) * limit;
    
    // Build OR for tags only if there are non-empty tags
    let tagOr = [];
    if (tags) {
      tagOr = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => ({ tags: { not: null, contains: tag } }));
    }

    // Combine search and tag ORs
    const or = [];
    if (search) {
      or.push(
        { contractNumber: { contains: search } },
        { parties: { contains: search } },
        { description: { contains: search } },
        { fileName: { contains: search } }
      );
    }
    if (tagOr.length > 0) {
      or.push(...tagOr);
    }

    const where = {
      isDeleted: false,
      ...(or.length > 0 && { OR: or })
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploader: {
            select: { id: true, name: true, email: true }
          },
          attachments: {
            where: { isDeleted: false },
            select: { id: true, fileName: true, mimeType: true }
          },
          _count: {
            select: { annotations: true }
          }
        },
        orderBy: { uploadedAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.document.count({ where })
    ]);

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload a new document
router.post('/', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { contractNumber, parties, description, tags } = req.body;
    
    if (!parties) {
      return res.status(400).json({ error: 'Parties field is required' });
    }

    const document = await prisma.document.create({
      data: {
        contractNumber: contractNumber || null,
        parties,
        description: description || null,
        tags: tags || null,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.id
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get a single document by ID
router.get('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(req.params.id),
        isDeleted: false
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true }
        },
        attachments: {
          where: { isDeleted: false },
          include: {
            uploader: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        annotations: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Download document file
router.get('/:id/download', async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(req.params.id),
        isDeleted: false
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Disable cache for downloads
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.download(document.filePath, document.fileName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Update document metadata (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { contractNumber, parties, description, tags } = req.body;
    
    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(req.params.id),
        isDeleted: false
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updatedDocument = await prisma.document.update({
      where: { id: parseInt(req.params.id) },
      data: {
        contractNumber: contractNumber || null,
        parties: parties || document.parties,
        description: description || null,
        tags: tags || null,
        updatedAt: new Date()
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(req.params.id),
        isDeleted: false
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Soft delete
    await prisma.document.update({
      where: { id: parseInt(req.params.id) },
      data: {
        isDeleted: true,
        deletedBy: req.user.id,
        deletedAt: new Date()
      }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Upload attachment to document
router.post('/:id/attachments', authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(req.params.id),
        isDeleted: false
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const attachment = await prisma.documentAttachment.create({
      data: {
        documentId: parseInt(req.params.id),
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.id
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// Download attachment
router.get('/attachments/:id/download', async (req, res) => {
  try {
    const attachment = await prisma.documentAttachment.findFirst({
      where: {
        id: parseInt(req.params.id),
        isDeleted: false
      },
      include: {
        document: true
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check if parent document is not deleted
    if (attachment.document.isDeleted) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if file exists
    try {
      await fs.access(attachment.filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(attachment.filePath, attachment.fileName);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// Delete attachment (admin only)
router.delete('/attachments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const attachment = await prisma.documentAttachment.findFirst({
      where: {
        id: parseInt(req.params.id),
        isDeleted: false
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Soft delete
    await prisma.documentAttachment.update({
      where: { id: parseInt(req.params.id) },
      data: { isDeleted: true }
    });

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Create annotation
router.post('/:id/annotations', authenticateToken, async (req, res) => {
  try {
    const { type, page, x, y, width, height, content, color, data } = req.body;
    
    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(req.params.id),
        isDeleted: false
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const annotation = await prisma.documentAnnotation.create({
      data: {
        documentId: parseInt(req.params.id),
        userId: req.user.id,
        type,
        page: parseInt(page),
        x: x || null,
        y: y || null,
        width: width || null,
        height: height || null,
        content: content || null,
        color: color || null,
        data: data || null
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(annotation);
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ error: 'Failed to create annotation' });
  }
});

// Update annotation
router.put('/annotations/:id', authenticateToken, async (req, res) => {
  try {
    const { content, color, data } = req.body;
    
    const annotation = await prisma.documentAnnotation.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id // Users can only update their own annotations
      }
    });

    if (!annotation) {
      return res.status(404).json({ error: 'Annotation not found' });
    }

    const updatedAnnotation = await prisma.documentAnnotation.update({
      where: { id: parseInt(req.params.id) },
      data: {
        content: content || null,
        color: color || null,
        data: data || null,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updatedAnnotation);
  } catch (error) {
    console.error('Error updating annotation:', error);
    res.status(500).json({ error: 'Failed to update annotation' });
  }
});

// Delete annotation
router.delete('/annotations/:id', authenticateToken, async (req, res) => {
  try {
    const annotation = await prisma.documentAnnotation.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id // Users can only delete their own annotations
      }
    });

    if (!annotation) {
      return res.status(404).json({ error: 'Annotation not found' });
    }

    await prisma.documentAnnotation.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Annotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    res.status(500).json({ error: 'Failed to delete annotation' });
  }
});

module.exports = router; 