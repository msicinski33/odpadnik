const express = require('express');
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');

const router = express.Router();
const prisma = new PrismaClient();

// Assignment types for daily operations
const ASSIGNMENT_TYPES = {
  route_cleaning: 'Odśnieżanie tras',
  sidewalk_clearing: 'Oczyszczanie chodników',
  salt_spreading: 'Posypywanie solą',
  sand_spreading: 'Posypywanie piaskiem',
  emergency_response: 'Interwencja awaryjna',
  equipment_maintenance: 'Konserwacja sprzętu',
  material_loading: 'Załadunek materiałów',
  standby: 'Dyżur'
};

const ASSIGNMENT_STATUS = {
  planned: 'Zaplanowane',
  in_progress: 'W trakcie',
  completed: 'Wykonane',
  cancelled: 'Anulowane',
  delayed: 'Opóźnione'
};

const SHIFT_TYPES = {
  morning: 'Ranna (06:00-14:00)',
  afternoon: 'Popołudniowa (14:00-22:00)',
  night: 'Nocna (22:00-06:00)',
  emergency: 'Awaryjna (24h)'
};

// GET /api/winter-daily-plan - Get daily operational plans
router.get('/', async (req, res) => {
  try {
    const { 
      date = new Date().toISOString().split('T')[0],
      status,
      assignmentType,
      shift,
      regionId,
      supervisorId,
      driverId
    } = req.query;
    
    // Build where clause
    const where = {
      date: new Date(date)
    };
    
    if (status) where.status = status;
    if (shift) where.shift = shift;
    if (supervisorId) where.supervisorId = parseInt(supervisorId);
    
    const dailyPlans = await prisma.winterDailyPlan.findMany({
      where,
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
            surname: true,
            position: true
          }
        },
        assignments: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                surname: true,
                driversLicenseCategories: true
              }
            },
            loader: {
              select: {
                id: true,
                name: true,
                surname: true
              }
            },
            vehicle: {
              select: {
                id: true,
                registrationNumber: true,
                brand: true,
                vehicleType: true
              }
            },
            route: {
              select: {
                id: true,
                name: true,
                priority: true,
                estimatedTime: true
              }
            }
          },
          ...(driverId ? {
            where: {
              driverId: parseInt(driverId)
            }
          } : {})
        }
      },
      orderBy: [
        { shift: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    // Process plans with enhanced data
    const processedPlans = dailyPlans.map(plan => ({
      id: plan.id,
      date: plan.date,
      shift: plan.shift,
      shiftLabel: SHIFT_TYPES[plan.shift] || plan.shift,
      status: plan.status,
      statusLabel: ASSIGNMENT_STATUS[plan.status] || plan.status,
      notes: plan.notes,
      supervisor: plan.supervisor ? {
        id: plan.supervisor.id,
        fullName: `${plan.supervisor.name} ${plan.supervisor.surname}`,
        position: plan.supervisor.position
      } : null,
      assignments: plan.assignments.map(assignment => ({
        id: assignment.id,
        assignmentType: assignment.assignmentType,
        assignmentTypeLabel: ASSIGNMENT_TYPES[assignment.assignmentType] || assignment.assignmentType,
        status: assignment.status,
        statusLabel: ASSIGNMENT_STATUS[assignment.status] || assignment.status,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        equipment: assignment.equipment,
        notes: assignment.notes,
        driver: assignment.driver ? {
          id: assignment.driver.id,
          fullName: `${assignment.driver.name} ${assignment.driver.surname}`,
          licenseCategories: assignment.driver.driversLicenseCategories?.split(',').map(cat => cat.trim()) || []
        } : null,
        loader: assignment.loader ? {
          id: assignment.loader.id,
          fullName: `${assignment.loader.name} ${assignment.loader.surname}`
        } : null,
        vehicle: assignment.vehicle,
        route: assignment.route
      })),
      statistics: {
        totalAssignments: plan.assignments.length,
        completedAssignments: plan.assignments.filter(a => a.status === 'completed').length,
        inProgressAssignments: plan.assignments.filter(a => a.status === 'in_progress').length,
        pendingAssignments: plan.assignments.filter(a => a.status === 'planned').length
      },
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));
    
    // Generate summary statistics
    const stats = {
      totalPlans: processedPlans.length,
      totalAssignments: processedPlans.reduce((sum, plan) => sum + plan.assignments.length, 0),
      completedPlans: processedPlans.filter(p => p.status === 'completed').length,
      inProgressPlans: processedPlans.filter(p => p.status === 'in_progress').length,
      pendingPlans: processedPlans.filter(p => p.status === 'planned').length,
      byShift: {
        morning: processedPlans.filter(p => p.shift === 'morning').length,
        afternoon: processedPlans.filter(p => p.shift === 'afternoon').length,
        night: processedPlans.filter(p => p.shift === 'night').length,
        emergency: processedPlans.filter(p => p.shift === 'emergency').length
      }
    };
    
    res.json({
      success: true,
      data: processedPlans,
      stats,
      date,
      filters: { status, shift, supervisorId, driverId }
    });
    
  } catch (error) {
    console.error('Error fetching daily plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily plans',
      details: error.message
    });
  }
});

// POST /api/winter-daily-plan - Create new daily plan
router.post('/', async (req, res) => {
  try {
    const {
      date,
      shift,
      status = 'planned',
      supervisorId,
      notes,
      assignments = []
    } = req.body;
    
    // Validate required fields
    if (!date || !shift) {
      return res.status(400).json({
        success: false,
        error: 'Date and shift are required'
      });
    }
    
    // Verify supervisor exists
    if (supervisorId) {
      const supervisor = await prisma.employee.findUnique({
        where: { id: supervisorId }
      });
      
      if (!supervisor) {
        return res.status(400).json({
          success: false,
          error: 'Supervisor not found'
        });
      }
    }

    // Create daily plan with assignments and material requests
    const dailyPlan = await prisma.winterDailyPlan.create({
      data: {
        date: new Date(date),
        shift,
        status,
        supervisorId: supervisorId || null,
        notes: notes || null,
        assignments: {
          create: assignments.map(assignment => ({
            assignmentType: assignment.assignmentType,
            status: assignment.status || 'planned',
            startTime: assignment.startTime ? new Date(assignment.startTime) : null,
            endTime: assignment.endTime ? new Date(assignment.endTime) : null,
            driverId: assignment.driverId || null,
            loaderId: assignment.loaderId || null,
            vehicleId: assignment.vehicleId || null,
            routeId: assignment.routeId || null,
            equipment: assignment.equipment || null,
            notes: assignment.notes || null
          }))
        }
      },
      include: {
        supervisor: {
          select: {
            name: true,
            surname: true,
            position: true
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
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: dailyPlan,
      message: 'Daily plan created successfully'
    });
    
  } catch (error) {
    console.error('Error creating daily plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create daily plan',
      details: error.message
    });
  }
});

// PUT /api/winter-daily-plan/:planId - Update daily plan
router.put('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const {
      shift,
      status,
      supervisorId,
      notes
    } = req.body;
    
    // Verify plan exists
    const existingPlan = await prisma.winterDailyPlan.findUnique({
      where: { id: parseInt(planId) }
    });
    
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: 'Daily plan not found'
      });
    }
    
    // Update plan
    const updatedPlan = await prisma.winterDailyPlan.update({
      where: { id: parseInt(planId) },
      data: {
        ...(shift && { shift }),
        ...(status && { status }),
        ...(supervisorId !== undefined && { supervisorId }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date()
      },
      include: {
        supervisor: {
          select: {
            name: true,
            surname: true,
            position: true
          }
        },
        assignments: true
      }
    });
    
    res.json({
      success: true,
      data: updatedPlan,
      message: 'Daily plan updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating daily plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update daily plan',
      details: error.message
    });
  }
});

// DELETE /api/winter-daily-plan/:planId - Delete daily plan
router.delete('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Verify plan exists
    const existingPlan = await prisma.winterDailyPlan.findUnique({
      where: { id: parseInt(planId) }
    });
    
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: 'Daily plan not found'
      });
    }
    
    // Delete plan (cascade will handle assignments and material requests)
    await prisma.winterDailyPlan.delete({
      where: { id: parseInt(planId) }
    });
    
    res.json({
      success: true,
      message: 'Daily plan deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting daily plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete daily plan',
      details: error.message
    });
  }
});

// GET /api/winter-daily-plan/types - Get assignment types and other options
router.get('/types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        assignmentTypes: Object.entries(ASSIGNMENT_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        statusTypes: Object.entries(ASSIGNMENT_STATUS).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'completed' ? 'green' :
                 key === 'in_progress' ? 'blue' :
                 key === 'planned' ? 'gray' :
                 key === 'cancelled' ? 'red' : 'yellow'
        })),
        shiftTypes: Object.entries(SHIFT_TYPES).map(([key, label]) => ({
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

// GET /api/winter-daily-plan/options - Alias for /types endpoint for frontend compatibility
router.get('/options', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        assignmentTypes: Object.entries(ASSIGNMENT_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        statusTypes: Object.entries(ASSIGNMENT_STATUS).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'completed' ? 'green' :
                 key === 'in_progress' ? 'blue' :
                 key === 'planned' ? 'gray' :
                 key === 'cancelled' ? 'red' : 'yellow'
        })),
        shiftTypes: Object.entries(SHIFT_TYPES).map(([key, label]) => ({
          value: key,
          label
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch options',
      details: error.message
    });
  }
});

// GET /api/winter-daily-plan/:planId/pdf - Generate PDF report for daily plan
router.get('/:planId/pdf', async (req, res) => {
  try {
    const { planId } = req.params;
    
    const dailyPlan = await prisma.winterDailyPlan.findUnique({
      where: { id: parseInt(planId) },
      include: {
        supervisor: true,
        assignments: {
          include: {
            driver: true,
            loader: true,
            vehicle: true,
            route: true
          }
        }
      }
    });
    
    if (!dailyPlan) {
      return res.status(404).json({
        success: false,
        error: 'Daily plan not found'
      });
    }
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    const filename = `daily-plan-${dailyPlan.date.toISOString().split('T')[0]}-${dailyPlan.shift}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // PDF Header
    doc.fontSize(18).text('DZIENNY PLAN OPERACYJNY - AKCJA ZIMA', { align: 'center' });
    doc.moveDown();
    
    // Plan details
    doc.fontSize(12);
    doc.text(`Data: ${dailyPlan.date.toLocaleDateString('pl-PL')}`, { continued: true });
    doc.text(`    Zmiana: ${SHIFT_TYPES[dailyPlan.shift] || dailyPlan.shift}`, { align: 'right' });
    doc.text(`Status: ${ASSIGNMENT_STATUS[dailyPlan.status] || dailyPlan.status}`);
    
    if (dailyPlan.supervisor) {
      doc.text(`Nadzorujący: ${dailyPlan.supervisor.name} ${dailyPlan.supervisor.surname} (${dailyPlan.supervisor.position})`);
    }
    
    if (dailyPlan.notes) {
      doc.text(`Uwagi: ${dailyPlan.notes}`);
    }
    
    doc.moveDown();
    
    // Assignments section
    if (dailyPlan.assignments.length > 0) {
      doc.fontSize(14).text('PRZYDZIAŁY ZADAŃ', { underline: true });
      doc.moveDown(0.5);
      
      dailyPlan.assignments.forEach((assignment, index) => {
        doc.fontSize(12);
        doc.text(`${index + 1}. ${ASSIGNMENT_TYPES[assignment.assignmentType] || assignment.assignmentType}`);
        
        if (assignment.driver) {
          doc.text(`   Kierowca: ${assignment.driver.name} ${assignment.driver.surname}`);
        }
        
        if (assignment.loader) {
          doc.text(`   Ładowacz: ${assignment.loader.name} ${assignment.loader.surname}`);
        }
        
        if (assignment.vehicle) {
          doc.text(`   Pojazd: ${assignment.vehicle.registrationNumber} (${assignment.vehicle.brand})`);
        }
        
        if (assignment.route) {
          doc.text(`   Trasa: ${assignment.route.name}`);
        }
        
        if (assignment.startTime) {
          doc.text(`   Czas rozpoczęcia: ${assignment.startTime.toLocaleTimeString('pl-PL')}`);
        }
        
        if (assignment.endTime) {
          doc.text(`   Czas zakończenia: ${assignment.endTime.toLocaleTimeString('pl-PL')}`);
        }
        
        doc.text(`   Status: ${ASSIGNMENT_STATUS[assignment.status] || assignment.status}`);
        
        if (assignment.equipment) {
          doc.text(`   Wyposażenie: ${JSON.stringify(assignment.equipment)}`);
        }
        
        if (assignment.notes) {
          doc.text(`   Uwagi: ${assignment.notes}`);
        }
        
        doc.moveDown(0.5);
      });
    }

    // Footer
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
});

module.exports = router;