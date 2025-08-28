const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// Sidewalk priority levels
const SIDEWALK_PRIORITIES = {
  critical: 'Krytyczny',
  high: 'Wysoki',
  medium: 'Średni',
  low: 'Niski'
};

// Sidewalk types
const SIDEWALK_TYPES = {
  main_pedestrian: 'Główny ciąg pieszy',
  shopping_area: 'Strefa handlowa',
  school_zone: 'Strefa szkolna',
  hospital_area: 'Strefa szpitalna',
  residential: 'Osiedlowy',
  park_path: 'Ścieżka parkowa',
  bus_stop_area: 'Obszar przystankowy'
};

// Surface types
const SURFACE_TYPES = {
  concrete: 'Beton',
  paving_stones: 'Kostka brukowa',
  asphalt: 'Asfalt',
  tiles: 'Płytki',
  gravel: 'Żwir'
};

// Assignment status
const ASSIGNMENT_STATUS = {
  planned: 'Zaplanowane',
  in_progress: 'W trakcie',
  completed: 'Wykonane',
  cancelled: 'Anulowane',
  on_hold: 'Wstrzymane'
};

// GET /api/winter-sidewalks - Get sidewalk clearing overview
router.get('/', async (req, res) => {
  try {
    const { 
      search,
      priority,
      sidewalkType,
      regionId,
      isActive = 'true',
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;
    
    // Build where clause
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
    
    if (priority) {
      where.priority = priority;
    }
    
    if (sidewalkType) {
      where.sidewalkType = sidewalkType;
    }
    
    if (regionId) {
      where.regionId = parseInt(regionId);
    }
    
    // Set up ordering
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    const sidewalks = await prisma.winterSidewalk.findMany({
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
                surname: true,
                position: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 5
        }
      },
      orderBy: [orderBy, { name: 'asc' }]
    });
    
    // Process sidewalks with enhanced data
    const processedSidewalks = sidewalks.map(sidewalk => {
      // Calculate completion statistics
      const totalAssignments = sidewalk.assignments.length;
      const completedAssignments = sidewalk.assignments.filter(a => a.status === 'completed').length;
      const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
      
      // Find latest assignment
      const latestAssignment = sidewalk.assignments[0];
      
      return {
        id: sidewalk.id,
        name: sidewalk.name,
        location: sidewalk.location,
        description: sidewalk.description,
        sidewalkType: sidewalk.sidewalkType,
        sidewalkTypeLabel: SIDEWALK_TYPES[sidewalk.sidewalkType] || sidewalk.sidewalkType,
        priority: sidewalk.priority,
        priorityLabel: SIDEWALK_PRIORITIES[sidewalk.priority] || sidewalk.priority,
        priorityColor: sidewalk.priority === 'critical' ? 'red' :
                      sidewalk.priority === 'high' ? 'orange' :
                      sidewalk.priority === 'medium' ? 'yellow' : 'green',
        length: sidewalk.length,
        width: sidewalk.width,
        surfaceType: sidewalk.surfaceType,
        surfaceTypeLabel: SURFACE_TYPES[sidewalk.surfaceType] || sidewalk.surfaceType,
        estimatedTime: sidewalk.estimatedTime,
        difficulty: sidewalk.difficulty,
        requiresSpecialEquipment: sidewalk.requiresSpecialEquipment,
        specialEquipment: sidewalk.specialEquipment,
        isActive: sidewalk.isActive,
        notes: sidewalk.notes,
        region: sidewalk.region,
        statistics: {
          totalAssignments,
          completedAssignments,
          completionRate: Math.round(completionRate),
          lastAssignment: latestAssignment?.date,
          lastStatus: latestAssignment?.status,
          currentWorker: latestAssignment?.worker ? 
            `${latestAssignment.worker.name} ${latestAssignment.worker.surname}` : null
        },
        recentAssignments: sidewalk.assignments.map(assignment => ({
          id: assignment.id,
          date: assignment.date,
          status: assignment.status,
          statusLabel: ASSIGNMENT_STATUS[assignment.status] || assignment.status,
          workerName: assignment.worker ? 
            `${assignment.worker.name} ${assignment.worker.surname}` : null,
          workerPosition: assignment.worker?.position,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          notes: assignment.notes
        })),
        createdAt: sidewalk.createdAt,
        updatedAt: sidewalk.updatedAt
      };
    });
    
    // Generate summary statistics
    const stats = {
      total: processedSidewalks.length,
      active: processedSidewalks.filter(s => s.isActive).length,
      byPriority: {
        critical: processedSidewalks.filter(s => s.priority === 'critical').length,
        high: processedSidewalks.filter(s => s.priority === 'high').length,
        medium: processedSidewalks.filter(s => s.priority === 'medium').length,
        low: processedSidewalks.filter(s => s.priority === 'low').length
      },
      byType: {
        main_pedestrian: processedSidewalks.filter(s => s.sidewalkType === 'main_pedestrian').length,
        shopping_area: processedSidewalks.filter(s => s.sidewalkType === 'shopping_area').length,
        school_zone: processedSidewalks.filter(s => s.sidewalkType === 'school_zone').length,
        residential: processedSidewalks.filter(s => s.sidewalkType === 'residential').length
      },
      totalLength: processedSidewalks.reduce((sum, sidewalk) => sum + (sidewalk.length || 0), 0),
      averageCompletionRate: processedSidewalks.length > 0 ? 
        processedSidewalks.reduce((sum, sidewalk) => sum + sidewalk.statistics.completionRate, 0) / processedSidewalks.length : 0,
      withSpecialEquipment: processedSidewalks.filter(s => s.requiresSpecialEquipment).length
    };
    
    res.json({
      success: true,
      data: processedSidewalks,
      stats,
      filters: { search, priority, sidewalkType, regionId, isActive, sortBy, sortOrder }
    });
    
  } catch (error) {
    console.error('Error fetching sidewalks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sidewalks',
      details: error.message
    });
  }
});

// GET /api/winter-sidewalks/:sidewalkId - Get specific sidewalk details
router.get('/:sidewalkId', async (req, res) => {
  try {
    const { sidewalkId } = req.params;
    
    const sidewalk = await prisma.winterSidewalk.findUnique({
      where: { id: parseInt(sidewalkId) },
      include: {
        region: true,
        assignments: {
          include: {
            worker: {
              select: {
                name: true,
                surname: true,
                position: true,
                phone: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });
    
    if (!sidewalk) {
      return res.status(404).json({
        success: false,
        error: 'Sidewalk not found'
      });
    }
    
    const processedSidewalk = {
      ...sidewalk,
      sidewalkTypeLabel: SIDEWALK_TYPES[sidewalk.sidewalkType] || sidewalk.sidewalkType,
      priorityLabel: SIDEWALK_PRIORITIES[sidewalk.priority] || sidewalk.priority,
      surfaceTypeLabel: SURFACE_TYPES[sidewalk.surfaceType] || sidewalk.surfaceType,
      assignments: sidewalk.assignments.map(assignment => ({
        ...assignment,
        statusLabel: ASSIGNMENT_STATUS[assignment.status] || assignment.status,
        workerName: assignment.worker ? 
          `${assignment.worker.name} ${assignment.worker.surname}` : null,
        workerInfo: assignment.worker
      }))
    };
    
    res.json({
      success: true,
      data: processedSidewalk
    });
    
  } catch (error) {
    console.error('Error fetching sidewalk details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sidewalk details',
      details: error.message
    });
  }
});

// POST /api/winter-sidewalks - Create new sidewalk
router.post('/', async (req, res) => {
  try {
    const {
      name,
      location,
      description,
      sidewalkType,
      priority,
      length,
      width,
      surfaceType,
      estimatedTime,
      difficulty,
      requiresSpecialEquipment = false,
      specialEquipment,
      regionId,
      notes,
      isActive = true
    } = req.body;
    
    // Validate required fields
    if (!name || !location || !sidewalkType || !priority) {
      return res.status(400).json({
        success: false,
        error: 'Name, location, sidewalk type, and priority are required'
      });
    }
    
    // Verify region exists if provided
    if (regionId) {
      const region = await prisma.region.findUnique({
        where: { id: regionId }
      });
      
      if (!region) {
        return res.status(400).json({
          success: false,
          error: 'Region not found'
        });
      }
    }
    
    const newSidewalk = await prisma.winterSidewalk.create({
      data: {
        name,
        location,
        description: description || null,
        sidewalkType,
        priority,
        length: length || null,
        width: width || null,
        surfaceType: surfaceType || null,
        estimatedTime: estimatedTime || null,
        difficulty: difficulty || null,
        requiresSpecialEquipment,
        specialEquipment: requiresSpecialEquipment ? specialEquipment : null,
        regionId: regionId || null,
        notes: notes || null,
        isActive
      },
      include: {
        region: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...newSidewalk,
        sidewalkTypeLabel: SIDEWALK_TYPES[newSidewalk.sidewalkType],
        priorityLabel: SIDEWALK_PRIORITIES[newSidewalk.priority],
        surfaceTypeLabel: newSidewalk.surfaceType ? SURFACE_TYPES[newSidewalk.surfaceType] : null
      },
      message: 'Sidewalk created successfully'
    });
    
  } catch (error) {
    console.error('Error creating sidewalk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sidewalk',
      details: error.message
    });
  }
});

// PUT /api/winter-sidewalks/:sidewalkId - Update sidewalk
router.put('/:sidewalkId', async (req, res) => {
  try {
    const { sidewalkId } = req.params;
    const {
      name,
      location,
      description,
      sidewalkType,
      priority,
      length,
      width,
      surfaceType,
      estimatedTime,
      difficulty,
      requiresSpecialEquipment,
      specialEquipment,
      regionId,
      notes,
      isActive
    } = req.body;
    
    // Verify sidewalk exists
    const existingSidewalk = await prisma.winterSidewalk.findUnique({
      where: { id: parseInt(sidewalkId) }
    });
    
    if (!existingSidewalk) {
      return res.status(404).json({
        success: false,
        error: 'Sidewalk not found'
      });
    }
    
    // Verify region exists if provided
    if (regionId) {
      const region = await prisma.region.findUnique({
        where: { id: regionId }
      });
      
      if (!region) {
        return res.status(400).json({
          success: false,
          error: 'Region not found'
        });
      }
    }
    
    const updatedSidewalk = await prisma.winterSidewalk.update({
      where: { id: parseInt(sidewalkId) },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(sidewalkType !== undefined && { sidewalkType }),
        ...(priority !== undefined && { priority }),
        ...(length !== undefined && { length }),
        ...(width !== undefined && { width }),
        ...(surfaceType !== undefined && { surfaceType }),
        ...(estimatedTime !== undefined && { estimatedTime }),
        ...(difficulty !== undefined && { difficulty }),
        ...(requiresSpecialEquipment !== undefined && { requiresSpecialEquipment }),
        ...(specialEquipment !== undefined && { specialEquipment }),
        ...(regionId !== undefined && { regionId }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      include: {
        region: true
      }
    });
    
    res.json({
      success: true,
      data: {
        ...updatedSidewalk,
        sidewalkTypeLabel: SIDEWALK_TYPES[updatedSidewalk.sidewalkType],
        priorityLabel: SIDEWALK_PRIORITIES[updatedSidewalk.priority],
        surfaceTypeLabel: updatedSidewalk.surfaceType ? SURFACE_TYPES[updatedSidewalk.surfaceType] : null
      },
      message: 'Sidewalk updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating sidewalk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sidewalk',
      details: error.message
    });
  }
});

// DELETE /api/winter-sidewalks/:sidewalkId - Delete sidewalk
router.delete('/:sidewalkId', async (req, res) => {
  try {
    const { sidewalkId } = req.params;
    
    // Verify sidewalk exists
    const existingSidewalk = await prisma.winterSidewalk.findUnique({
      where: { id: parseInt(sidewalkId) }
    });
    
    if (!existingSidewalk) {
      return res.status(404).json({
        success: false,
        error: 'Sidewalk not found'
      });
    }
    
    // Check if sidewalk has any assignments
    const hasAssignments = await prisma.winterSidewalkAssignment.count({
      where: { sidewalkId: parseInt(sidewalkId) }
    });
    
    if (hasAssignments > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete sidewalk with existing assignments. Please remove assignments first or deactivate the sidewalk.'
      });
    }
    
    // Delete sidewalk
    await prisma.winterSidewalk.delete({
      where: { id: parseInt(sidewalkId) }
    });
    
    res.json({
      success: true,
      message: 'Sidewalk deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting sidewalk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete sidewalk',
      details: error.message
    });
  }
});

// POST /api/winter-sidewalks/:sidewalkId/assignments - Create assignment for sidewalk
router.post('/:sidewalkId/assignments', async (req, res) => {
  try {
    const { sidewalkId } = req.params;
    const {
      workerId,
      date,
      startTime,
      endTime,
      status = 'planned',
      notes
    } = req.body;
    
    // Validate required fields
    if (!workerId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Worker ID and date are required'
      });
    }
    
    // Verify sidewalk exists
    const sidewalk = await prisma.winterSidewalk.findUnique({
      where: { id: parseInt(sidewalkId) }
    });
    
    if (!sidewalk) {
      return res.status(404).json({
        success: false,
        error: 'Sidewalk not found'
      });
    }
    
    // Verify worker exists
    const worker = await prisma.employee.findUnique({
      where: { id: workerId }
    });
    
    if (!worker) {
      return res.status(400).json({
        success: false,
        error: 'Worker not found'
      });
    }
    
    // Create assignment
    const assignment = await prisma.winterSidewalkAssignment.create({
      data: {
        sidewalkId: parseInt(sidewalkId),
        workerId,
        date: new Date(date),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        status,
        notes: notes || null
      },
      include: {
        worker: {
          select: {
            name: true,
            surname: true,
            position: true
          }
        },
        sidewalk: {
          select: {
            name: true,
            location: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...assignment,
        statusLabel: ASSIGNMENT_STATUS[assignment.status],
        workerName: `${assignment.worker.name} ${assignment.worker.surname}`
      },
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

// PUT /api/winter-sidewalks/assignments/:assignmentId - Update assignment
router.put('/assignments/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const {
      workerId,
      date,
      startTime,
      endTime,
      status,
      notes
    } = req.body;
    
    // Verify assignment exists
    const existingAssignment = await prisma.winterSidewalkAssignment.findUnique({
      where: { id: parseInt(assignmentId) }
    });
    
    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    // Verify worker exists if provided
    if (workerId) {
      const worker = await prisma.employee.findUnique({
        where: { id: workerId }
      });
      
      if (!worker) {
        return res.status(400).json({
          success: false,
          error: 'Worker not found'
        });
      }
    }
    
    const updatedAssignment = await prisma.winterSidewalkAssignment.update({
      where: { id: parseInt(assignmentId) },
      data: {
        ...(workerId !== undefined && { workerId }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
        ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date()
      },
      include: {
        worker: {
          select: {
            name: true,
            surname: true,
            position: true
          }
        },
        sidewalk: {
          select: {
            name: true,
            location: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        ...updatedAssignment,
        statusLabel: ASSIGNMENT_STATUS[updatedAssignment.status],
        workerName: `${updatedAssignment.worker.name} ${updatedAssignment.worker.surname}`
      },
      message: 'Assignment updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assignment',
      details: error.message
    });
  }
});

// GET /api/winter-sidewalks/types - Get sidewalk types and other options
router.get('/types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        priorities: Object.entries(SIDEWALK_PRIORITIES).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'critical' ? 'red' :
                 key === 'high' ? 'orange' :
                 key === 'medium' ? 'yellow' : 'green'
        })),
        sidewalkTypes: Object.entries(SIDEWALK_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        surfaceTypes: Object.entries(SURFACE_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        assignmentStatus: Object.entries(ASSIGNMENT_STATUS).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'completed' ? 'green' :
                 key === 'in_progress' ? 'blue' :
                 key === 'planned' ? 'gray' :
                 key === 'cancelled' ? 'red' : 'yellow'
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

// GET /api/winter-sidewalks/export - Export sidewalks to Excel
router.get('/export', async (req, res) => {
  try {
    const { format = 'excel', priority, sidewalkType, regionId } = req.query;
    
    // Build where clause for filtering
    const where = {};
    if (priority) where.priority = priority;
    if (sidewalkType) where.sidewalkType = sidewalkType;
    if (regionId) where.regionId = parseInt(regionId);
    
    const sidewalks = await prisma.winterSidewalk.findMany({
      where,
      include: {
        region: {
          select: {
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
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' }
      ]
    });
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Winter Sidewalks');
      
      // Set headers
      worksheet.columns = [
        { header: 'Nazwa', key: 'name', width: 25 },
        { header: 'Lokalizacja', key: 'location', width: 30 },
        { header: 'Typ Chodnika', key: 'sidewalkType', width: 20 },
        { header: 'Priorytet', key: 'priority', width: 15 },
        { header: 'Długość (m)', key: 'length', width: 12 },
        { header: 'Szerokość (m)', key: 'width', width: 12 },
        { header: 'Nawierzchnia', key: 'surfaceType', width: 15 },
        { header: 'Czas (min)', key: 'estimatedTime', width: 12 },
        { header: 'Trudność', key: 'difficulty', width: 12 },
        { header: 'Specjalne Wyposażenie', key: 'specialEquipment', width: 25 },
        { header: 'Region', key: 'region', width: 20 },
        { header: 'Aktywny', key: 'isActive', width: 10 },
        { header: 'Liczba Przydziałów', key: 'assignmentCount', width: 15 }
      ];
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };
      
      // Add data
      sidewalks.forEach(sidewalk => {
        worksheet.addRow({
          name: sidewalk.name,
          location: sidewalk.location,
          sidewalkType: SIDEWALK_TYPES[sidewalk.sidewalkType] || sidewalk.sidewalkType,
          priority: SIDEWALK_PRIORITIES[sidewalk.priority] || sidewalk.priority,
          length: sidewalk.length,
          width: sidewalk.width,
          surfaceType: sidewalk.surfaceType ? SURFACE_TYPES[sidewalk.surfaceType] || sidewalk.surfaceType : '',
          estimatedTime: sidewalk.estimatedTime,
          difficulty: sidewalk.difficulty,
          specialEquipment: sidewalk.requiresSpecialEquipment ? sidewalk.specialEquipment || 'Tak' : 'Nie',
          region: sidewalk.region ? `${sidewalk.region.name} - ${sidewalk.region.unitName}` : '',
          isActive: sidewalk.isActive ? 'Tak' : 'Nie',
          assignmentCount: sidewalk.assignments.length
        });
      });
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
      
      const filename = `winter-sidewalks-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      await workbook.xlsx.write(res);
      res.end();
      
    } else {
      // JSON export
      const processedSidewalks = sidewalks.map(sidewalk => ({
        name: sidewalk.name,
        location: sidewalk.location,
        description: sidewalk.description,
        sidewalkType: sidewalk.sidewalkType,
        sidewalkTypeLabel: SIDEWALK_TYPES[sidewalk.sidewalkType],
        priority: sidewalk.priority,
        priorityLabel: SIDEWALK_PRIORITIES[sidewalk.priority],
        length: sidewalk.length,
        width: sidewalk.width,
        surfaceType: sidewalk.surfaceType,
        surfaceTypeLabel: sidewalk.surfaceType ? SURFACE_TYPES[sidewalk.surfaceType] : null,
        estimatedTime: sidewalk.estimatedTime,
        difficulty: sidewalk.difficulty,
        requiresSpecialEquipment: sidewalk.requiresSpecialEquipment,
        specialEquipment: sidewalk.specialEquipment,
        region: sidewalk.region,
        isActive: sidewalk.isActive,
        assignmentCount: sidewalk.assignments.length,
        notes: sidewalk.notes
      }));
      
      res.json({
        success: true,
        data: processedSidewalks,
        exportedAt: new Date().toISOString(),
        total: processedSidewalks.length
      });
    }
    
  } catch (error) {
    console.error('Error exporting sidewalks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export sidewalks',
      details: error.message
    });
  }
});

module.exports = router;