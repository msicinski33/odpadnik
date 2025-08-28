const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Vehicle status types for winter operations
const WINTER_STATUS_TYPES = {
  operational: 'pojazd sprawny',
  out_of_service_vehicle: 'pojazd niesprawny - P (pojazd)',
  out_of_service_device: 'pojazd niesprawny - U (urządzenie)',
  reconfigured: 'zamiatarka - Z (przezbrojone)',
  maintenance: 'Przegląd techniczny',
  standby: 'Gotowość'
};

const EQUIPMENT_TYPES = {
  plow: 'Pług śnieżny',
  salt_spreader: 'Solarka',
  sand_spreader: 'Piaskarka',
  snow_blower: 'Odśnieżarka',
  sweeper: 'Zamiatarka',
  loader: 'Ładowarka',
  grader: 'Równiarka',
  tractor: 'Ciągnik'
};

// GET /api/winter-vehicle-readiness - Get vehicle readiness overview
router.get('/', async (req, res) => {
  try {
    const { 
      date = new Date().toISOString().split('T')[0],
      status,
      equipmentType,
      activeOnly = 'true'
    } = req.query;
    
    // Get all winter vehicles with their latest status
    const vehicles = await prisma.winterVehicle.findMany({
      where: {
        isActive: activeOnly === 'true' ? true : undefined
      },
      include: {
        statusHistory: {
          where: {
            date: {
              lte: new Date(date + 'T23:59:59.999Z')
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 1,
          include: {
            reportedBy: {
              select: {
                name: true
              }
            }
          }
        },
        routeAssignments: {
          where: {
            date: new Date(date)
          },
          include: {
            route: {
              select: {
                name: true,
                priority: true
              }
            },
            driver: {
              select: {
                name: true,
                surname: true
              }
            }
          }
        },
        dailyAssignments: {
          where: {
            plan: {
              date: new Date(date)
            }
          },
          include: {
            plan: true,
            driver: {
              select: {
                name: true,
                surname: true
              }
            },
            route: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        registrationNumber: 'asc'
      }
    });
    
    // Process vehicles with their current status
    const processedVehicles = vehicles.map(vehicle => {
      const latestStatus = vehicle.statusHistory[0];
      const currentStatus = latestStatus?.status || 'operational';
      const currentEquipment = latestStatus?.equipmentType;
      
      // Check if vehicle matches filters
      if (status && currentStatus !== status) return null;
      if (equipmentType && currentEquipment !== equipmentType) return null;
      
      return {
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        brand: vehicle.brand,
        vehicleType: vehicle.vehicleType,
        capacity: vehicle.capacity,
        fuelType: vehicle.fuelType,
        isActive: vehicle.isActive,
        baseDepartment: vehicle.baseDepartment,
        winterStatus: {
          status: currentStatus,
          statusLabel: WINTER_STATUS_TYPES[currentStatus] || currentStatus,
          equipmentType: currentEquipment,
          equipmentLabel: currentEquipment ? EQUIPMENT_TYPES[currentEquipment] || currentEquipment : null,
          lastUpdated: latestStatus?.date,
          reportedBy: latestStatus?.reportedBy ? 
            latestStatus.reportedBy.name : null,
          notes: latestStatus?.notes
        },
        assignments: {
          routes: vehicle.routeAssignments.map(assignment => ({
            routeName: assignment.route.name,
            priority: assignment.route.priority,
            driverName: assignment.driver ? 
              `${assignment.driver.name} ${assignment.driver.surname}` : null,
            startTime: assignment.startTime,
            status: assignment.status
          })),
          dailyPlan: vehicle.dailyAssignments.map(assignment => ({
            planDate: assignment.plan.date,
            assignmentType: assignment.assignmentType,
            driverName: assignment.driver ? 
              `${assignment.driver.name} ${assignment.driver.surname}` : null,
            routeName: assignment.route?.name,
            status: assignment.status,
            equipment: assignment.equipment
          }))
        },
        statusHistory: latestStatus ? [{
          date: latestStatus.date,
          status: latestStatus.status,
          equipmentType: latestStatus.equipmentType,
          notes: latestStatus.notes,
          reportedBy: latestStatus.reportedBy ? 
            latestStatus.reportedBy.name : null
        }] : []
      };
    }).filter(Boolean);
    
    // Generate summary statistics
    const stats = {
      total: processedVehicles.length,
      operational: processedVehicles.filter(v => v.winterStatus.status === 'operational').length,
      outOfService: processedVehicles.filter(v => 
        v.winterStatus.status === 'out_of_service_vehicle' || 
        v.winterStatus.status === 'out_of_service_device'
      ).length,
      maintenance: processedVehicles.filter(v => v.winterStatus.status === 'maintenance').length,
      reconfigured: processedVehicles.filter(v => v.winterStatus.status === 'reconfigured').length,
      assigned: processedVehicles.filter(v => 
        v.assignments.routes.length > 0 || v.assignments.dailyPlan.length > 0
      ).length
    };
    
    res.json({
      success: true,
      data: processedVehicles,
      stats,
      date,
      filters: { status, equipmentType, activeOnly }
    });
    
  } catch (error) {
    console.error('Error fetching vehicle readiness:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle readiness',
      details: error.message
    });
  }
});

// GET /api/winter-vehicle-readiness/:vehicleId/history - Get vehicle status history
router.get('/:vehicleId/history', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { 
      startDate,
      endDate = new Date().toISOString().split('T')[0],
      limit = 50
    } = req.query;
    
    const where = { vehicleId: parseInt(vehicleId) };
    
    if (startDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    
    const statusHistory = await prisma.winterVehicleStatus.findMany({
      where,
      include: {
        reportedBy: {
          select: {
            name: true
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
      take: parseInt(limit)
    });
    
    const processedHistory = statusHistory.map(status => ({
      id: status.id,
      date: status.date,
      status: status.status,
      statusLabel: WINTER_STATUS_TYPES[status.status] || status.status,
      equipmentType: status.equipmentType,
      equipmentLabel: status.equipmentType ? 
        EQUIPMENT_TYPES[status.equipmentType] || status.equipmentType : null,
      notes: status.notes,
      reportedBy: status.reportedBy ? 
        status.reportedBy.name : null,
      createdAt: status.createdAt,
      updatedAt: status.updatedAt
    }));
    
    res.json({
      success: true,
      data: processedHistory,
      vehicle: statusHistory[0]?.vehicle,
      total: processedHistory.length
    });
    
  } catch (error) {
    console.error('Error fetching vehicle history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle history',
      details: error.message
    });
  }
});

// POST /api/winter-vehicle-readiness/:vehicleId/status - Update vehicle status
router.post('/:vehicleId/status', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { 
      status, 
      equipmentType, 
      notes,
      date = new Date().toISOString().split('T')[0]
    } = req.body;
    
    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    if (!WINTER_STATUS_TYPES[status]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status type'
      });
    }
    
    // Verify winter vehicle exists
    const vehicle = await prisma.winterVehicle.findUnique({
      where: { id: parseInt(vehicleId) }
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    // Create or update status for the date
    const statusData = {
      winterVehicleId: parseInt(vehicleId),
      date: new Date(date),
      status,
      equipmentType: equipmentType || null,
      notes: notes || null,
      reportedById: req.user?.id || null
    };
    
    const winterStatus = await prisma.winterVehicleStatusHistory.upsert({
      where: {
        winterVehicleId_date: {
          winterVehicleId: parseInt(vehicleId),
          date: new Date(date)
        }
      },
      update: {
        status,
        equipmentType: equipmentType || null,
        notes: notes || null,
        reportedById: req.user?.id || null,
        updatedAt: new Date()
      },
      create: statusData,
      include: {
        reportedBy: {
          select: {
            name: true
          }
        },
        winterVehicle: {
          select: {
            registrationNumber: true,
            brand: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        id: winterStatus.id,
        winterVehicleId: winterStatus.winterVehicleId,
        date: winterStatus.date,
        status: winterStatus.status,
        statusLabel: WINTER_STATUS_TYPES[winterStatus.status],
        equipmentType: winterStatus.equipmentType,
        equipmentLabel: winterStatus.equipmentType ? 
          EQUIPMENT_TYPES[winterStatus.equipmentType] || winterStatus.equipmentType : null,
        notes: winterStatus.notes,
        reportedBy: winterStatus.reportedBy ? 
          winterStatus.reportedBy.name : null,
        vehicle: winterStatus.winterVehicle,
        createdAt: winterStatus.createdAt,
        updatedAt: winterStatus.updatedAt
      },
      message: 'Winter vehicle status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle status',
      details: error.message
    });
  }
});

// GET /api/winter-vehicle-readiness/timeline - Get timeline view for multiple vehicles
router.get('/timeline', async (req, res) => {
  try {
    const { 
      startDate,
      endDate = new Date().toISOString().split('T')[0],
      vehicleIds,
      status
    } = req.query;
    
    // Default to last 7 days if no start date provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(endDate + 'T23:59:59.999Z');
    
    // Build where clause for vehicles
    const vehicleWhere = {};
    if (vehicleIds) {
      vehicleWhere.id = {
        in: vehicleIds.split(',').map(id => parseInt(id))
      };
    }
    
    // Get vehicles with their status history
    const vehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,
      include: {
        winterStatusHistory: {
          where: {
            date: {
              gte: start,
              lte: end
            },
            ...(status ? { status } : {})
          },
          orderBy: {
            date: 'asc'
          },
          include: {
            reportedBy: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        registrationNumber: 'asc'
      }
    });
    
    // Generate date range for timeline
    const dateRange = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dateRange.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Process timeline data
    const timeline = vehicles.map(vehicle => {
      const statusByDate = {};
      
      // Map status history to dates
      vehicle.winterStatusHistory.forEach(status => {
        const dateKey = status.date.toISOString().split('T')[0];
        statusByDate[dateKey] = {
          status: status.status,
          statusLabel: WINTER_STATUS_TYPES[status.status],
          equipmentType: status.equipmentType,
          equipmentLabel: status.equipmentType ? 
            EQUIPMENT_TYPES[status.equipmentType] || status.equipmentType : null,
          notes: status.notes,
          reportedBy: status.reportedBy ? 
            status.reportedBy.name : null
        };
      });
      
      // Fill in gaps with previous status or default to operational
      let lastKnownStatus = 'operational';
      const timeline = dateRange.map(date => {
        if (statusByDate[date]) {
          lastKnownStatus = statusByDate[date].status;
          return {
            date,
            ...statusByDate[date]
          };
        } else {
          return {
            date,
            status: lastKnownStatus,
            statusLabel: WINTER_STATUS_TYPES[lastKnownStatus],
            equipmentType: null,
            equipmentLabel: null,
            notes: null,
            reportedBy: null,
            inherited: true
          };
        }
      });
      
      return {
        vehicle: {
          id: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          brand: vehicle.brand,
          vehicleType: vehicle.vehicleType
        },
        timeline
      };
    });
    
    res.json({
      success: true,
      data: timeline,
      dateRange,
      summary: {
        vehicles: vehicles.length,
        dateRange: dateRange.length,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }
    });
    
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline',
      details: error.message
    });
  }
});

// GET /api/winter-vehicle-readiness/types - Get status and equipment types
router.get('/types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        statusTypes: Object.entries(WINTER_STATUS_TYPES).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'operational' ? 'green' :
                 key.includes('out_of_service') ? 'red' :
                 key === 'maintenance' ? 'yellow' :
                 key === 'reconfigured' ? 'blue' : 'gray'
        })),
        equipmentTypes: Object.entries(EQUIPMENT_TYPES).map(([key, label]) => ({
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

// GET /api/winter-vehicle-readiness/summary - Get readiness summary by status
router.get('/summary', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    // Get latest status for each vehicle for the specified date
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        winterStatusHistory: {
          where: {
            date: {
              lte: new Date(date + 'T23:59:59.999Z')
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 1
        }
      }
    });
    
    // Count vehicles by status
    const statusCounts = {};
    const equipmentCounts = {};
    
    Object.keys(WINTER_STATUS_TYPES).forEach(status => {
      statusCounts[status] = 0;
    });
    
    Object.keys(EQUIPMENT_TYPES).forEach(equipment => {
      equipmentCounts[equipment] = 0;
    });
    
    vehicles.forEach(vehicle => {
      const latestStatus = vehicle.winterStatusHistory[0];
      const status = latestStatus?.status || 'operational';
      const equipment = latestStatus?.equipmentType;
      
      statusCounts[status]++;
      
      if (equipment) {
        equipmentCounts[equipment]++;
      }
    });
    
    const summary = {
      date,
      totalVehicles: vehicles.length,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        statusLabel: WINTER_STATUS_TYPES[status],
        count,
        percentage: vehicles.length > 0 ? Math.round((count / vehicles.length) * 100) : 0
      })),
      equipmentBreakdown: Object.entries(equipmentCounts)
        .filter(([_, count]) => count > 0)
        .map(([equipment, count]) => ({
          equipment,
          equipmentLabel: EQUIPMENT_TYPES[equipment],
          count,
          percentage: vehicles.length > 0 ? Math.round((count / vehicles.length) * 100) : 0
        })),
      readinessScore: vehicles.length > 0 ? 
        Math.round((statusCounts.operational / vehicles.length) * 100) : 0
    };
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary',
      details: error.message
    });
  }
});

module.exports = router;