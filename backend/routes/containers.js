const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();
const { authorize, clearRoleCache } = require('./authMiddleware');

// Debug endpoint to check permissions
router.get('/debug', async (req, res) => {
  console.log(`[CONTAINERS_DEBUG] Debug endpoint called for user: ${req.user?.name} (${req.user?.role})`);
  console.log(`[CONTAINERS_DEBUG] User permissions:`, req.user?.permissions || 'undefined');
  
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions || []
    },
    message: 'Debug info for containers route',
    hasContainersRead: req.user?.permissions?.includes('containers:read') || false,
    staticPermissions: require('./authMiddleware').ROLE_PERMISSIONS[req.user?.role] || []
  });
});

// Cache clearing endpoint for debugging
router.post('/clear-cache', authorize('containers:read'), async (req, res) => {
  try {
    clearRoleCache(); // Clear all role caches
    res.json({ message: 'Role cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Performance test endpoint
router.get('/perf-test', authorize('containers:read'), async (req, res) => {
  const startTime = Date.now();
  
  // Simulate permission check
  const hasPermission = req.user?.permissions?.includes('containers:read');
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  res.json({
    message: 'Performance test completed',
    hasPermission,
    duration: `${duration}ms`,
    userRole: req.user?.role,
    permissionsCount: req.user?.permissions?.length || 0
  });
});

// GET all containers with optional filtering
router.get('/', authorize('containers:read'), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { propertyAddress: { contains: search, mode: 'insensitive' } },
        { containerType: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [containers, total] = await Promise.all([
      prisma.container.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.container.count({ where })
    ]);
    
    res.json({
      containers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET container by ID
router.get('/:id', authorize('containers:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const container = await prisma.container.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }
    
    res.json(container);
  } catch (error) {
    console.error('Error fetching container:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create new container
router.post('/', authorize('containers:create'), async (req, res) => {
  try {
    const {
      companyName,
      city,
      propertyAddress,
      containerType,
      quantity,
      reason,
      invoiceNumber,
      entryPersonData,
      additionalInfo,
      personalPickup
    } = req.body;
    
    // Validation
    if (!companyName || !city || !propertyAddress || !containerType || !quantity || !reason || !entryPersonData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }
    
    const container = await prisma.container.create({
      data: {
        companyName,
        city,
        propertyAddress,
        containerType,
        quantity: parseInt(quantity),
        reason,
        invoiceNumber,
        entryPersonData,
        additionalInfo,
        personalPickup: personalPickup || false,
        status: personalPickup ? 'PERSONAL_PICKUP' : 'PENDING'
      }
    });
    
    res.status(201).json(container);
  } catch (error) {
    console.error('Error creating container:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update container
router.put('/:id', authorize('containers:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      city,
      propertyAddress,
      containerType,
      quantity,
      reason,
      invoiceNumber,
      entryPersonData,
      additionalInfo,
      personalPickup
    } = req.body;
    
    // Validation
    if (!companyName || !city || !propertyAddress || !containerType || !quantity || !reason || !entryPersonData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }
    
    const container = await prisma.container.update({
      where: { id: parseInt(id) },
      data: {
        companyName,
        city,
        propertyAddress,
        containerType,
        quantity: parseInt(quantity),
        reason,
        invoiceNumber,
        entryPersonData,
        additionalInfo,
        personalPickup: personalPickup || false,
        status: personalPickup ? 'PERSONAL_PICKUP' : 'PENDING'
      }
    });
    
    res.json(container);
  } catch (error) {
    console.error('Error updating container:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Container not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH complete container
router.patch('/:id/complete', authorize('containers:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { recordNumber, completionDate } = req.body;
    
    if (!recordNumber || !completionDate) {
      return res.status(400).json({ error: 'Record number and completion date are required' });
    }
    
    const container = await prisma.container.update({
      where: { id: parseInt(id) },
      data: {
        recordNumber,
        completionDate: new Date(completionDate),
        status: 'COMPLETED'
      }
    });
    
    res.json(container);
  } catch (error) {
    console.error('Error completing container:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Container not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH toggle personal pickup
router.patch('/:id/toggle-personal-pickup', authorize('containers:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { personalPickup, recordNumber, completionDate } = req.body;
    
    if (personalPickup && (!recordNumber || !completionDate)) {
      return res.status(400).json({ error: 'Record number and completion date are required for personal pickup' });
    }
    
    const container = await prisma.container.update({
      where: { id: parseInt(id) },
      data: {
        personalPickup,
        status: personalPickup ? 'PERSONAL_PICKUP' : 'PENDING',
        ...(personalPickup && { recordNumber, completionDate: new Date(completionDate) })
      }
    });
    
    res.json(container);
  } catch (error) {
    console.error('Error toggling personal pickup:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Container not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE container
router.delete('/:id', authorize('containers:delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.container.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Container deleted successfully' });
  } catch (error) {
    console.error('Error deleting container:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Container not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET container statistics
router.get('/stats/summary', authorize('containers:read'), async (req, res) => {
  try {
    const [total, pending, completed, personalPickup] = await Promise.all([
      prisma.container.count(),
      prisma.container.count({ where: { status: 'PENDING' } }),
      prisma.container.count({ where: { status: 'COMPLETED' } }),
      prisma.container.count({ where: { status: 'PERSONAL_PICKUP' } })
    ]);
    
    res.json({
      total,
      pending,
      completed,
      personalPickup
    });
  } catch (error) {
    console.error('Error fetching container statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET containers by type for PDF export
router.get('/by-type/:containerType', authorize('containers:read'), async (req, res) => {
  try {
    const { containerType } = req.params;
    const { status, search } = req.query;
    
    const where = {};
    
    if (containerType !== 'all') {
      where.containerType = containerType;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { propertyAddress: { contains: search, mode: 'insensitive' } },
        { containerType: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const containers = await prisma.container.findMany({
      where,
      orderBy: { entryDate: 'desc' }
    });
    
    res.json({ containers });
  } catch (error) {
    console.error('Error fetching containers by type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET unique container types for PDF export dropdown
router.get('/types', authorize('containers:read'), async (req, res) => {
  try {
    const containerTypes = await prisma.container.findMany({
      select: { containerType: true },
      distinct: ['containerType'],
      orderBy: { containerType: 'asc' }
    });
    
    const types = containerTypes.map(ct => ct.containerType);
    res.json({ types });
  } catch (error) {
    console.error('Error fetching container types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
