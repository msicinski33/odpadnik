const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// Bus stop types
const BUS_STOP_TYPES = {
  standard: 'Standardowy',
  sheltered: 'Z wiatą',
  major_hub: 'Węzeł komunikacyjny',
  terminal: 'Terminal',
  express: 'Ekspresowy'
};

// Priority levels
const PRIORITIES = {
  critical: 'Krytyczny',
  high: 'Wysoki',
  medium: 'Średni',
  low: 'Niski'
};

// Bin types
const BIN_TYPES = {
  waste: 'Odpady',
  recycling: 'Segregacja',
  cigarette: 'Popielniczka',
  dog_waste: 'Psie odchody'
};

// Assignment status
const ASSIGNMENT_STATUS = {
  planned: 'Zaplanowane',
  in_progress: 'W trakcie',
  completed: 'Wykonane',
  cancelled: 'Anulowane'
};

// GET /api/winter-bus-stops - Get bus stops overview
router.get('/', async (req, res) => {
  try {
    const { 
      search,
      priority,
      busStopType,
      regionId,
      isActive = 'true',
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;
    
    const where = {};
    
    if (isActive === 'true') {
      where.isActive = true;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (priority) where.priority = priority;
    if (busStopType) where.busStopType = busStopType;
    if (regionId) where.regionId = parseInt(regionId);
    
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    const busStops = await prisma.winterBusStop.findMany({
      where,
      include: {
        region: {
          select: {
            id: true,
            name: true,
            unitName: true
          }
        },
        assignments: {
          include: {
            worker: {
              select: {
                name: true,
                surname: true
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 3
        }
      },
      orderBy: [orderBy, { name: 'asc' }]
    });
    
    const processedBusStops = busStops.map(busStop => {
      let bins = [];
      try {
        bins = busStop.bins ? JSON.parse(busStop.bins) : [];
      } catch (e) {
        bins = [];
      }
      
      return {
        id: busStop.id,
        name: busStop.name,
        location: busStop.location,
        busStopType: busStop.busStopType,
        busStopTypeLabel: BUS_STOP_TYPES[busStop.busStopType] || busStop.busStopType,
        priority: busStop.priority,
        priorityLabel: PRIORITIES[busStop.priority] || busStop.priority,
        priorityColor: busStop.priority === 'critical' ? 'red' :
                      busStop.priority === 'high' ? 'orange' :
                      busStop.priority === 'medium' ? 'yellow' : 'green',
        hasWinterService: busStop.hasWinterService,
        requiresSpecialAccess: busStop.requiresSpecialAccess,
        accessNotes: busStop.accessNotes,
        bins: bins,
        binCount: bins.length,
        region: busStop.region,
        isActive: busStop.isActive,
        recentAssignments: busStop.assignments.map(assignment => ({
          id: assignment.id,
          date: assignment.date,
          status: assignment.status,
          workerName: assignment.worker ? 
            `${assignment.worker.name} ${assignment.worker.surname}` : null
        })),
        statistics: {
          totalAssignments: busStop.assignments.length,
          lastAssignment: busStop.assignments[0]?.date
        }
      };
    });
    
    const stats = {
      total: processedBusStops.length,
      active: processedBusStops.filter(b => b.isActive).length,
      withWinterService: processedBusStops.filter(b => b.hasWinterService).length,
      requireSpecialAccess: processedBusStops.filter(b => b.requiresSpecialAccess).length,
      totalBins: processedBusStops.reduce((sum, stop) => sum + stop.binCount, 0)
    };
    
    res.json({
      success: true,
      data: processedBusStops,
      stats,
      filters: { search, priority, busStopType, regionId, isActive }
    });
    
  } catch (error) {
    console.error('Error fetching bus stops:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bus stops',
      details: error.message
    });
  }
});

// POST /api/winter-bus-stops - Create new bus stop
router.post('/', async (req, res) => {
  try {
    const {
      name,
      location,
      busStopType,
      priority,
      hasWinterService = true,
      requiresSpecialAccess = false,
      accessNotes,
      bins = [],
      regionId,
      isActive = true
    } = req.body;
    
    if (!name || !location || !busStopType || !priority) {
      return res.status(400).json({
        success: false,
        error: 'Name, location, bus stop type, and priority are required'
      });
    }
    
    const binsJson = JSON.stringify(bins);
    
    const newBusStop = await prisma.winterBusStop.create({
      data: {
        name,
        location,
        busStopType,
        priority,
        hasWinterService,
        requiresSpecialAccess,
        accessNotes: accessNotes || null,
        bins: binsJson,
        regionId: regionId || null,
        isActive
      },
      include: { region: true }
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...newBusStop,
        busStopTypeLabel: BUS_STOP_TYPES[newBusStop.busStopType],
        priorityLabel: PRIORITIES[newBusStop.priority],
        bins: bins
      },
      message: 'Bus stop created successfully'
    });
    
  } catch (error) {
    console.error('Error creating bus stop:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bus stop',
      details: error.message
    });
  }
});

// PUT /api/winter-bus-stops/:busStopId - Update bus stop
router.put('/:busStopId', async (req, res) => {
  try {
    const { busStopId } = req.params;
    const updateData = req.body;
    
    const existingBusStop = await prisma.winterBusStop.findUnique({
      where: { id: parseInt(busStopId) }
    });
    
    if (!existingBusStop) {
      return res.status(404).json({
        success: false,
        error: 'Bus stop not found'
      });
    }
    
    if (updateData.bins) {
      updateData.bins = JSON.stringify(updateData.bins);
    }
    
    const updatedBusStop = await prisma.winterBusStop.update({
      where: { id: parseInt(busStopId) },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: { region: true }
    });
    
    res.json({
      success: true,
      data: {
        ...updatedBusStop,
        busStopTypeLabel: BUS_STOP_TYPES[updatedBusStop.busStopType],
        priorityLabel: PRIORITIES[updatedBusStop.priority],
        bins: updatedBusStop.bins ? JSON.parse(updatedBusStop.bins) : []
      },
      message: 'Bus stop updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating bus stop:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bus stop',
      details: error.message
    });
  }
});

// POST /api/winter-bus-stops/:busStopId/assignments - Create assignment
router.post('/:busStopId/assignments', async (req, res) => {
  try {
    const { busStopId } = req.params;
    const { workerId, date, notes } = req.body;
    
    if (!workerId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Worker ID and date are required'
      });
    }
    
    const assignment = await prisma.winterBusStopAssignment.create({
      data: {
        busStopId: parseInt(busStopId),
        workerId,
        date: new Date(date),
        status: 'planned',
        notes: notes || null
      },
      include: {
        worker: {
          select: { name: true, surname: true }
        },
        busStop: {
          select: { name: true, location: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
    
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create assignment',
      details: error.message
    });
  }
});

// GET /api/winter-bus-stops/types - Get types and options
router.get('/types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        busStopTypes: Object.entries(BUS_STOP_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        priorities: Object.entries(PRIORITIES).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'critical' ? 'red' :
                 key === 'high' ? 'orange' :
                 key === 'medium' ? 'yellow' : 'green'
        })),
        binTypes: Object.entries(BIN_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        assignmentStatus: Object.entries(ASSIGNMENT_STATUS).map(([key, label]) => ({
          value: key,
          label
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch types',
      details: error.message
    });
  }
});

module.exports = router;