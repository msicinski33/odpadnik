const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// Route priority levels
const ROUTE_PRIORITIES = {
  critical: 'Krytyczna',
  high: 'Wysoka',
  medium: 'Średnia',
  low: 'Niska',
  maintenance: 'Konserwacyjna'
};

// Route types for winter operations
const ROUTE_TYPES = {
  main_road: 'Droga główna',
  secondary_road: 'Droga drugorzędna',
  residential: 'Droga osiedlowa',
  emergency: 'Trasa awaryjna',
  parking_lot: 'Parking',
  bridge: 'Most',
  tunnel: 'Tunel',
  intersection: 'Skrzyżowanie'
};

// Surface types
const SURFACE_TYPES = {
  asphalt: 'Asfalt',
  concrete: 'Beton',
  paving_stones: 'Kostka brukowa',
  gravel: 'Żwir',
  dirt: 'Gruntowa'
};

// GET /api/winter-routes - Get winter routes
router.get('/', async (req, res) => {
  try {
    const { 
      search,
      priority,
      routeType,
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
        { description: { contains: search, mode: 'insensitive' } },
        { startPoint: { contains: search, mode: 'insensitive' } },
        { endPoint: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (routeType) {
      where.routeType = routeType;
    }
    
    if (regionId) {
      where.regionId = parseInt(regionId);
    }
    
    // Set up ordering
    const orderBy = {};
    if (sortBy === 'priority') {
      // Custom priority ordering
      orderBy.priority = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }
    
    const routes = await prisma.winterRoute.findMany({
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
            driver: {
              select: {
                name: true,
                surname: true
              }
            },
            vehicle: {
              select: {
                registrationNumber: true,
                brand: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 5
        },
        materialConsumptions: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 10
        },
        dailyPlanAssignments: {
          include: {
            plan: {
              select: {
                date: true,
                status: true
              }
            }
          },
          orderBy: {
            plan: {
              date: 'desc'
            }
          },
          take: 5
        }
      },
      orderBy: [orderBy, { name: 'asc' }]
    });
    
    // Process routes with enhanced data
    const processedRoutes = routes.map(route => {
      // Parse route instructions if stored as JSON
      let instructions = [];
      try {
        instructions = route.routeInstructions ? JSON.parse(route.routeInstructions) : [];
      } catch (e) {
        instructions = route.routeInstructions ? [route.routeInstructions] : [];
      }
      
      // Calculate recent activity
      const recentAssignments = route.assignments.length;
      const recentMaterialUsage = route.materialConsumptions.reduce((sum, consumption) => 
        sum + (consumption.quantity || 0), 0
      );
      
      return {
        id: route.id,
        name: route.name,
        description: route.description,
        routeType: route.routeType,
        routeTypeLabel: ROUTE_TYPES[route.routeType] || route.routeType,
        priority: route.priority,
        priorityLabel: ROUTE_PRIORITIES[route.priority] || route.priority,
        priorityColor: route.priority === 'critical' ? 'red' :
                      route.priority === 'high' ? 'orange' :
                      route.priority === 'medium' ? 'yellow' :
                      route.priority === 'low' ? 'green' : 'gray',
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        estimatedTime: route.estimatedTime,
        distance: route.distance,
        surfaceType: route.surfaceType,
        surfaceTypeLabel: SURFACE_TYPES[route.surfaceType] || route.surfaceType,
        width: route.width,
        maxWeight: route.maxWeight,
        isActive: route.isActive,
        lastMaintenance: route.lastMaintenance,
        notes: route.notes,
        instructions: instructions,
        region: route.region,
        statistics: {
          recentAssignments,
          recentMaterialUsage,
          lastAssignment: route.assignments[0]?.date,
          totalInstructions: instructions.length,
          lastMaterialConsumption: route.materialConsumptions[0]?.date
        },
        recentActivity: {
          assignments: route.assignments.map(assignment => ({
            date: assignment.date,
            status: assignment.status,
            driver: assignment.driver ? 
              `${assignment.driver.name} ${assignment.driver.surname}` : null,
            vehicle: assignment.vehicle ? 
              `${assignment.vehicle.registrationNumber} (${assignment.vehicle.brand})` : null,
            startTime: assignment.startTime,
            endTime: assignment.endTime
          })),
          materialConsumptions: route.materialConsumptions.map(consumption => ({
            date: consumption.date,
            materialType: consumption.materialType,
            quantity: consumption.quantity,
            unit: consumption.unit
          })),
          dailyPlanAssignments: route.dailyPlanAssignments.map(assignment => ({
            planDate: assignment.plan.date,
            planStatus: assignment.plan.status,
            assignmentType: assignment.assignmentType,
            status: assignment.status
          }))
        },
        createdAt: route.createdAt,
        updatedAt: route.updatedAt
      };
    });
    
    // Generate summary statistics
    const stats = {
      total: processedRoutes.length,
      active: processedRoutes.filter(r => r.isActive).length,
      byPriority: {
        critical: processedRoutes.filter(r => r.priority === 'critical').length,
        high: processedRoutes.filter(r => r.priority === 'high').length,
        medium: processedRoutes.filter(r => r.priority === 'medium').length,
        low: processedRoutes.filter(r => r.priority === 'low').length,
        maintenance: processedRoutes.filter(r => r.priority === 'maintenance').length
      },
      byType: {
        main_road: processedRoutes.filter(r => r.routeType === 'main_road').length,
        secondary_road: processedRoutes.filter(r => r.routeType === 'secondary_road').length,
        residential: processedRoutes.filter(r => r.routeType === 'residential').length,
        emergency: processedRoutes.filter(r => r.routeType === 'emergency').length
      },
      totalDistance: processedRoutes.reduce((sum, route) => sum + (route.distance || 0), 0),
      averageTime: processedRoutes.length > 0 ? 
        processedRoutes.reduce((sum, route) => sum + (route.estimatedTime || 0), 0) / processedRoutes.length : 0
    };
    
    res.json({
      success: true,
      data: processedRoutes,
      stats,
      filters: { search, priority, routeType, regionId, isActive, sortBy, sortOrder }
    });
    
  } catch (error) {
    console.error('Error fetching winter routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch winter routes',
      details: error.message
    });
  }
});

// GET /api/winter-routes/:routeId - Get specific route details
router.get('/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const route = await prisma.winterRoute.findUnique({
      where: { id: parseInt(routeId) },
      include: {
        region: true,
        assignments: {
          include: {
            driver: {
              select: {
                name: true,
                surname: true,
                position: true
              }
            },
            vehicle: {
              select: {
                registrationNumber: true,
                brand: true,
                vehicleType: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        },
        materialConsumptions: {
          include: {
            operator: {
              select: {
                name: true,
                surname: true
              }
            },
            vehicle: {
              select: {
                registrationNumber: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        },
        dailyPlanAssignments: {
          include: {
            plan: true,
            driver: {
              select: {
                name: true,
                surname: true
              }
            }
          },
          orderBy: {
            plan: {
              date: 'desc'
            }
          }
        }
      }
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    // Parse route instructions
    let instructions = [];
    try {
      instructions = route.routeInstructions ? JSON.parse(route.routeInstructions) : [];
    } catch (e) {
      instructions = route.routeInstructions ? [route.routeInstructions] : [];
    }
    
    const processedRoute = {
      ...route,
      routeTypeLabel: ROUTE_TYPES[route.routeType] || route.routeType,
      priorityLabel: ROUTE_PRIORITIES[route.priority] || route.priority,
      surfaceTypeLabel: SURFACE_TYPES[route.surfaceType] || route.surfaceType,
      instructions,
      assignments: route.assignments.map(assignment => ({
        ...assignment,
        driverName: assignment.driver ? 
          `${assignment.driver.name} ${assignment.driver.surname}` : null,
        vehicleInfo: assignment.vehicle ? 
          `${assignment.vehicle.registrationNumber} (${assignment.vehicle.brand})` : null
      })),
      materialConsumptions: route.materialConsumptions.map(consumption => ({
        ...consumption,
        operatorName: consumption.operator ? 
          `${consumption.operator.name} ${consumption.operator.surname}` : null,
        vehicleRegistration: consumption.vehicle?.registrationNumber
      }))
    };
    
    res.json({
      success: true,
      data: processedRoute
    });
    
  } catch (error) {
    console.error('Error fetching route details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route details',
      details: error.message
    });
  }
});

// POST /api/winter-routes - Create new winter route
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      routeType,
      priority,
      startPoint,
      endPoint,
      estimatedTime,
      distance,
      surfaceType,
      width,
      maxWeight,
      regionId,
      routeInstructions = [],
      notes,
      isActive = true
    } = req.body;
    
    // Validate required fields
    if (!name || !routeType || !priority || !startPoint || !endPoint) {
      return res.status(400).json({
        success: false,
        error: 'Name, route type, priority, start point, and end point are required'
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
    
    // Convert instructions to JSON string
    const instructionsJson = Array.isArray(routeInstructions) ? 
      JSON.stringify(routeInstructions) : routeInstructions;
    
    const newRoute = await prisma.winterRoute.create({
      data: {
        name,
        description: description || null,
        routeType,
        priority,
        startPoint,
        endPoint,
        estimatedTime: estimatedTime || null,
        distance: distance || null,
        surfaceType: surfaceType || null,
        width: width || null,
        maxWeight: maxWeight || null,
        regionId: regionId || null,
        routeInstructions: instructionsJson,
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
        ...newRoute,
        routeTypeLabel: ROUTE_TYPES[newRoute.routeType],
        priorityLabel: ROUTE_PRIORITIES[newRoute.priority],
        surfaceTypeLabel: newRoute.surfaceType ? SURFACE_TYPES[newRoute.surfaceType] : null,
        instructions: routeInstructions
      },
      message: 'Winter route created successfully'
    });
    
  } catch (error) {
    console.error('Error creating winter route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create winter route',
      details: error.message
    });
  }
});

// PUT /api/winter-routes/:routeId - Update winter route
router.put('/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    const {
      name,
      description,
      routeType,
      priority,
      startPoint,
      endPoint,
      estimatedTime,
      distance,
      surfaceType,
      width,
      maxWeight,
      regionId,
      routeInstructions,
      notes,
      isActive,
      lastMaintenance
    } = req.body;
    
    // Verify route exists
    const existingRoute = await prisma.winterRoute.findUnique({
      where: { id: parseInt(routeId) }
    });
    
    if (!existingRoute) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
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
    
    // Convert instructions to JSON string if provided
    let instructionsJson = undefined;
    if (routeInstructions !== undefined) {
      instructionsJson = Array.isArray(routeInstructions) ? 
        JSON.stringify(routeInstructions) : routeInstructions;
    }
    
    const updatedRoute = await prisma.winterRoute.update({
      where: { id: parseInt(routeId) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(routeType !== undefined && { routeType }),
        ...(priority !== undefined && { priority }),
        ...(startPoint !== undefined && { startPoint }),
        ...(endPoint !== undefined && { endPoint }),
        ...(estimatedTime !== undefined && { estimatedTime }),
        ...(distance !== undefined && { distance }),
        ...(surfaceType !== undefined && { surfaceType }),
        ...(width !== undefined && { width }),
        ...(maxWeight !== undefined && { maxWeight }),
        ...(regionId !== undefined && { regionId }),
        ...(instructionsJson !== undefined && { routeInstructions: instructionsJson }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
        ...(lastMaintenance !== undefined && { lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null }),
        updatedAt: new Date()
      },
      include: {
        region: true
      }
    });
    
    res.json({
      success: true,
      data: {
        ...updatedRoute,
        routeTypeLabel: ROUTE_TYPES[updatedRoute.routeType],
        priorityLabel: ROUTE_PRIORITIES[updatedRoute.priority],
        surfaceTypeLabel: updatedRoute.surfaceType ? SURFACE_TYPES[updatedRoute.surfaceType] : null,
        instructions: routeInstructions || JSON.parse(updatedRoute.routeInstructions || '[]')
      },
      message: 'Winter route updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating winter route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update winter route',
      details: error.message
    });
  }
});

// DELETE /api/winter-routes/:routeId - Delete winter route
router.delete('/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Verify route exists
    const existingRoute = await prisma.winterRoute.findUnique({
      where: { id: parseInt(routeId) }
    });
    
    if (!existingRoute) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    // Check if route has any assignments
    const hasAssignments = await prisma.winterRouteAssignment.count({
      where: { routeId: parseInt(routeId) }
    });
    
    if (hasAssignments > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete route with existing assignments. Please remove assignments first or deactivate the route.'
      });
    }
    
    // Delete route
    await prisma.winterRoute.delete({
      where: { id: parseInt(routeId) }
    });
    
    res.json({
      success: true,
      message: 'Winter route deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting winter route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete winter route',
      details: error.message
    });
  }
});

// GET /api/winter-routes/types - Get route types and other options
router.get('/types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        priorities: Object.entries(ROUTE_PRIORITIES).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'critical' ? 'red' :
                 key === 'high' ? 'orange' :
                 key === 'medium' ? 'yellow' :
                 key === 'low' ? 'green' : 'gray'
        })),
        routeTypes: Object.entries(ROUTE_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        surfaceTypes: Object.entries(SURFACE_TYPES).map(([key, label]) => ({
          value: key,
          label
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching route types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route types',
      details: error.message
    });
  }
});

// GET /api/winter-routes/export - Export routes to Excel
router.get('/export', async (req, res) => {
  try {
    const { format = 'excel', priority, routeType, regionId } = req.query;
    
    // Build where clause for filtering
    const where = {};
    if (priority) where.priority = priority;
    if (routeType) where.routeType = routeType;
    if (regionId) where.regionId = parseInt(regionId);
    
    const routes = await prisma.winterRoute.findMany({
      where,
      include: {
        region: {
          select: {
            name: true,
            unitName: true
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
      const worksheet = workbook.addWorksheet('Winter Routes');
      
      // Set headers
      worksheet.columns = [
        { header: 'Nazwa Trasy', key: 'name', width: 25 },
        { header: 'Typ Trasy', key: 'routeType', width: 20 },
        { header: 'Priorytet', key: 'priority', width: 15 },
        { header: 'Punkt Początkowy', key: 'startPoint', width: 30 },
        { header: 'Punkt Końcowy', key: 'endPoint', width: 30 },
        { header: 'Czas (min)', key: 'estimatedTime', width: 12 },
        { header: 'Dystans (km)', key: 'distance', width: 12 },
        { header: 'Nawierzchnia', key: 'surfaceType', width: 15 },
        { header: 'Szerokość (m)', key: 'width', width: 12 },
        { header: 'Max. Waga (t)', key: 'maxWeight', width: 12 },
        { header: 'Region', key: 'region', width: 20 },
        { header: 'Aktywna', key: 'isActive', width: 10 },
        { header: 'Opis', key: 'description', width: 40 }
      ];
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };
      
      // Add data
      routes.forEach(route => {
        worksheet.addRow({
          name: route.name,
          routeType: ROUTE_TYPES[route.routeType] || route.routeType,
          priority: ROUTE_PRIORITIES[route.priority] || route.priority,
          startPoint: route.startPoint,
          endPoint: route.endPoint,
          estimatedTime: route.estimatedTime,
          distance: route.distance,
          surfaceType: route.surfaceType ? SURFACE_TYPES[route.surfaceType] || route.surfaceType : '',
          width: route.width,
          maxWeight: route.maxWeight,
          region: route.region ? `${route.region.name} - ${route.region.unitName}` : '',
          isActive: route.isActive ? 'Tak' : 'Nie',
          description: route.description || ''
        });
      });
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.key !== 'description') {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = maxLength < 10 ? 10 : maxLength + 2;
        }
      });
      
      const filename = `winter-routes-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      await workbook.xlsx.write(res);
      res.end();
      
    } else {
      // JSON export
      const processedRoutes = routes.map(route => ({
        name: route.name,
        description: route.description,
        routeType: route.routeType,
        routeTypeLabel: ROUTE_TYPES[route.routeType],
        priority: route.priority,
        priorityLabel: ROUTE_PRIORITIES[route.priority],
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        estimatedTime: route.estimatedTime,
        distance: route.distance,
        surfaceType: route.surfaceType,
        surfaceTypeLabel: route.surfaceType ? SURFACE_TYPES[route.surfaceType] : null,
        width: route.width,
        maxWeight: route.maxWeight,
        region: route.region,
        isActive: route.isActive,
        instructions: route.routeInstructions ? JSON.parse(route.routeInstructions) : [],
        notes: route.notes
      }));
      
      res.json({
        success: true,
        data: processedRoutes,
        exportedAt: new Date().toISOString(),
        total: processedRoutes.length
      });
    }
    
  } catch (error) {
    console.error('Error exporting routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export routes',
      details: error.message
    });
  }
});

module.exports = router;