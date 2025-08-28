const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// Winter vehicle types and equipment
const WINTER_VEHICLE_TYPES = {
  truck: 'Ciężarówka',
  pickup: 'Pickup',
  van: 'Van',
  tractor: 'Ciągnik',
  loader: 'Ładowarka',
  grader: 'Równiarka'
};

const WINTER_EQUIPMENT = {
  plow: 'Pług śnieżny',
  salt_spreader: 'Solarka',
  sand_spreader: 'Piaskarka',
  snow_blower: 'Odśnieżarka',
  sweeper: 'Zamiatarka',
  loader: 'Ładowarka',
  grader: 'Równiarka',
  brine_maker: 'Wytwarzarka solanki'
};

// GET /api/winter-vehicles - Get all winter vehicles
router.get('/', async (req, res) => {
  try {
    const { 
      activeOnly = 'true',
      search,
      vehicleType,
      equipment,
      department
    } = req.query;
    
    const where = {};
    
    if (activeOnly === 'true') {
      where.isActive = true;
    }
    
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search } },
        { brand: { contains: search } },
        { vehicleType: { contains: search } },
        { baseDepartment: { contains: search } }
      ];
    }
    
    if (vehicleType) {
      where.vehicleType = vehicleType;
    }
    
    if (equipment) {
      where.winterEquipment = {
        contains: equipment
      };
    }
    
    if (department) {
      where.baseDepartment = department;
    }
    
    const winterVehicles = await prisma.winterVehicle.findMany({
      where,
      include: {
        statusHistory: {
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
            date: {
              gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
            }
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
              date: {
                gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          },
          include: {
            plan: {
              select: {
                date: true,
                shift: true
              }
            },
            driver: {
              select: {
                name: true,
                surname: true
              }
            }
          }
        }
      },
      orderBy: {
        registrationNumber: 'asc'
      }
    });
    
    const processedVehicles = winterVehicles.map(vehicle => {
      const latestStatus = vehicle.statusHistory[0];
      const equipmentArray = vehicle.winterEquipment ? 
        JSON.parse(vehicle.winterEquipment) : [];
      
      return {
        ...vehicle,
        equipmentArray,
        equipmentLabels: equipmentArray.map(eq => WINTER_EQUIPMENT[eq] || eq),
        currentStatus: latestStatus ? {
          status: latestStatus.status,
          equipmentType: latestStatus.equipmentType,
          notes: latestStatus.notes,
          lastUpdated: latestStatus.date,
          reportedBy: latestStatus.reportedBy?.name
        } : null,
        recentAssignments: {
          routes: vehicle.routeAssignments.map(assignment => ({
            routeName: assignment.route.name,
            priority: assignment.route.priority,
            driverName: assignment.driver ? 
              `${assignment.driver.name} ${assignment.driver.surname}` : null,
            date: assignment.date,
            status: assignment.status
          })),
          dailyPlans: vehicle.dailyAssignments.map(assignment => ({
            planDate: assignment.plan.date,
            shift: assignment.plan.shift,
            assignmentType: assignment.assignmentType,
            driverName: assignment.driver ? 
              `${assignment.driver.name} ${assignment.driver.surname}` : null,
            status: assignment.status
          }))
        }
      };
    });
    
    res.json({
      success: true,
      data: processedVehicles,
      total: processedVehicles.length,
      filters: {
        activeOnly,
        search,
        vehicleType,
        equipment,
        department
      }
    });
    
  } catch (error) {
    console.error('Error fetching winter vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch winter vehicles',
      details: error.message
    });
  }
});

// POST /api/winter-vehicles - Create new winter vehicle
router.post('/', async (req, res) => {
  try {
    const {
      brand,
      registrationNumber,
      vehicleType,
      capacity,
      fuelType,
      winterEquipment = [],
      purchaseDate,
      winterSeasonStart,
      winterSeasonEnd,
      baseDepartment,
      notes
    } = req.body;
    
    // Validate required fields
    if (!brand || !registrationNumber || !vehicleType || !capacity || !fuelType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: brand, registrationNumber, vehicleType, capacity, fuelType'
      });
    }
    
    const winterVehicle = await prisma.winterVehicle.create({
      data: {
        brand,
        registrationNumber,
        vehicleType,
        capacity: parseFloat(capacity),
        fuelType,
        winterEquipment: JSON.stringify(winterEquipment),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        winterSeasonStart: winterSeasonStart ? new Date(winterSeasonStart) : null,
        winterSeasonEnd: winterSeasonEnd ? new Date(winterSeasonEnd) : null,
        baseDepartment,
        notes
      }
    });
    
    res.status(201).json({
      success: true,
      data: winterVehicle,
      message: 'Winter vehicle created successfully'
    });
    
  } catch (error) {
    console.error('Error creating winter vehicle:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Vehicle with this registration number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create winter vehicle',
      details: error.message
    });
  }
});

// PUT /api/winter-vehicles/:id - Update winter vehicle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle winterEquipment array
    if (updateData.winterEquipment) {
      updateData.winterEquipment = JSON.stringify(updateData.winterEquipment);
    }
    
    // Handle date fields
    ['purchaseDate', 'winterSeasonStart', 'winterSeasonEnd'].forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });
    
    // Handle capacity
    if (updateData.capacity) {
      updateData.capacity = parseFloat(updateData.capacity);
    }
    
    const winterVehicle = await prisma.winterVehicle.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.json({
      success: true,
      data: winterVehicle,
      message: 'Winter vehicle updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating winter vehicle:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Winter vehicle not found'
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Vehicle with this registration number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update winter vehicle',
      details: error.message
    });
  }
});

// DELETE /api/winter-vehicles/:id - Delete winter vehicle
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.winterVehicle.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({
      success: true,
      message: 'Winter vehicle deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting winter vehicle:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Winter vehicle not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete winter vehicle',
      details: error.message
    });
  }
});

// GET /api/winter-vehicles/types - Get vehicle types and equipment options
router.get('/types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        vehicleTypes: Object.entries(WINTER_VEHICLE_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        equipmentTypes: Object.entries(WINTER_EQUIPMENT).map(([key, label]) => ({
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

// GET /api/winter-vehicles/export - Export winter vehicles to Excel
router.get('/export', async (req, res) => {
  try {
    const winterVehicles = await prisma.winterVehicle.findMany({
      where: { isActive: true },
      include: {
        statusHistory: {
          orderBy: {
            date: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        registrationNumber: 'asc'
      }
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Winter Vehicles');
    
    // Set headers
    worksheet.columns = [
      { header: 'Nr Rejestracyjny', key: 'registrationNumber', width: 15 },
      { header: 'Marka', key: 'brand', width: 15 },
      { header: 'Typ Pojazdu', key: 'vehicleType', width: 15 },
      { header: 'Pojemność', key: 'capacity', width: 12 },
      { header: 'Typ Paliwa', key: 'fuelType', width: 12 },
      { header: 'Wyposażenie Zimowe', key: 'equipment', width: 30 },
      { header: 'Wydział', key: 'department', width: 20 },
      { header: 'Aktualny Status', key: 'currentStatus', width: 15 },
      { header: 'Uwagi', key: 'notes', width: 30 }
    ];
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' }
    };
    
    // Add data
    winterVehicles.forEach(vehicle => {
      const equipmentArray = vehicle.winterEquipment ? 
        JSON.parse(vehicle.winterEquipment) : [];
      const equipmentLabels = equipmentArray.map(eq => WINTER_EQUIPMENT[eq] || eq).join(', ');
      
      worksheet.addRow({
        registrationNumber: vehicle.registrationNumber,
        brand: vehicle.brand,
        vehicleType: WINTER_VEHICLE_TYPES[vehicle.vehicleType] || vehicle.vehicleType,
        capacity: vehicle.capacity,
        fuelType: vehicle.fuelType,
        equipment: equipmentLabels,
        department: vehicle.baseDepartment || '',
        currentStatus: vehicle.statusHistory[0]?.status || 'brak danych',
        notes: vehicle.notes || ''
      });
    });
    
    const filename = `winter-vehicles-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting winter vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export winter vehicles',
      details: error.message
    });
  }
});

module.exports = router;