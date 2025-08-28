const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorize } = require('./authMiddleware');
const router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate working days (excluding weekends)
const calculateWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      workingDays++;
    }
  }
  
  return workingDays;
};

// Get all leave plans for a specific year
router.get('/year/:year', authenticateToken, authorize('leavePlanning:read'), async (req, res) => {
  try {
    const { year } = req.params;
    const yearInt = parseInt(year);
    
    const leavePlans = await prisma.leavePlan.findMany({
      where: { year: yearInt },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            surname: true,
            position: true,
            vacationDays: true
          }
        },
        leaveEntries: {
          orderBy: { startDate: 'asc' }
        }
      },
      orderBy: [
        { employee: { surname: 'asc' } },
        { employee: { name: 'asc' } }
      ]
    });
    
    res.json(leavePlans);
  } catch (error) {
    console.error('Error fetching leave plans:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania planów urlopów' });
  }
});

// Get leave plan for a specific employee and year
router.get('/employee/:employeeId/year/:year', authenticateToken, authorize('leavePlanning:read'), async (req, res) => {
  try {
    const { employeeId, year } = req.params;
    const employeeIdInt = parseInt(employeeId);
    const yearInt = parseInt(year);
    
    let leavePlan = await prisma.leavePlan.findUnique({
      where: {
        employeeId_year: {
          employeeId: employeeIdInt,
          year: yearInt
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            surname: true,
            position: true,
            vacationDays: true
          }
        },
        leaveEntries: {
          orderBy: { startDate: 'asc' }
        }
      }
    });
    
    // If no leave plan exists, create one with default values
    if (!leavePlan) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeIdInt },
        select: { vacationDays: true }
      });
      
      const totalEntitlement = employee?.vacationDays || 26;
      
      leavePlan = await prisma.leavePlan.create({
        data: {
          employeeId: employeeIdInt,
          year: yearInt,
          totalEntitlement,
          carriedOver: 0,
          totalAvailable: totalEntitlement,
          daysUsed: 0,
          daysRemaining: totalEntitlement
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              surname: true,
              position: true,
              vacationDays: true
            }
          },
          leaveEntries: []
        }
      });
    }
    
    res.json(leavePlan);
  } catch (error) {
    console.error('Error fetching employee leave plan:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania planu urlopu pracownika' });
  }
});

// Create or update leave plan
router.post('/employee/:employeeId/year/:year', authenticateToken, authorize('leavePlanning:create'), async (req, res) => {
  try {
    const { employeeId, year } = req.params;
    const { carriedOver, notes } = req.body;
    const employeeIdInt = parseInt(employeeId);
    const yearInt = parseInt(year);
    
    const employee = await prisma.employee.findUnique({
      where: { id: employeeIdInt },
      select: { vacationDays: true }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Pracownik nie został znaleziony' });
    }
    
    const totalEntitlement = employee.vacationDays || 26;
    const totalAvailable = totalEntitlement + (carriedOver || 0);
    
    const leavePlan = await prisma.leavePlan.upsert({
      where: {
        employeeId_year: {
          employeeId: employeeIdInt,
          year: yearInt
        }
      },
      update: {
        carriedOver: carriedOver || 0,
        totalAvailable,
        notes,
        updatedAt: new Date()
      },
      create: {
        employeeId: employeeIdInt,
        year: yearInt,
        totalEntitlement,
        carriedOver: carriedOver || 0,
        totalAvailable,
        daysUsed: 0,
        daysRemaining: totalAvailable,
        notes
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            surname: true,
            position: true,
            vacationDays: true
          }
        },
        leaveEntries: {
          orderBy: { startDate: 'asc' }
        }
      }
    });
    
    res.json(leavePlan);
  } catch (error) {
    console.error('Error creating/updating leave plan:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia/aktualizacji planu urlopu' });
  }
});

// Add leave entry
router.post('/leave-entry', authenticateToken, authorize('leavePlanning:create'), async (req, res) => {
  try {
    const { leavePlanId, startDate, endDate, leaveType, notes } = req.body;
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ error: 'Data rozpoczęcia musi być wcześniejsza niż data zakończenia' });
    }
    
    const daysCount = calculateWorkingDays(start, end);
    
    // Check if dates overlap with existing entries
    const existingEntry = await prisma.leaveEntry.findFirst({
      where: {
        leavePlanId: parseInt(leavePlanId),
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } }
            ]
          }
        ]
      }
    });
    
    if (existingEntry) {
      return res.status(400).json({ error: 'Wybrany okres koliduje z istniejącym wpisem urlopu' });
    }
    
    const leaveEntry = await prisma.leaveEntry.create({
      data: {
        leavePlanId: parseInt(leavePlanId),
        startDate: start,
        endDate: end,
        daysCount,
        leaveType,
        notes
      },
      include: {
        leavePlan: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                surname: true,
                position: true
              }
            }
          }
        }
      }
    });
    
    // Update leave plan totals
    await prisma.leavePlan.update({
      where: { id: parseInt(leavePlanId) },
      data: {
        daysUsed: {
          increment: daysCount
        },
        daysRemaining: {
          decrement: daysCount
        }
      }
    });
    
    res.json(leaveEntry);
  } catch (error) {
    console.error('Error creating leave entry:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia wpisu urlopu' });
  }
});

// Update leave entry
router.put('/leave-entry/:id', authenticateToken, authorize('leavePlanning:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, leaveType, status, notes } = req.body;
    
    const existingEntry = await prisma.leaveEntry.findUnique({
      where: { id: parseInt(id) },
      include: { leavePlan: true }
    });
    
    if (!existingEntry) {
      return res.status(404).json({ error: 'Wpis urlopu nie został znaleziony' });
    }
    
    let daysCount = existingEntry.daysCount;
    let leavePlanUpdate = {};
    
    // If dates changed, recalculate days and update totals
    if (startDate && endDate && 
        (new Date(startDate).getTime() !== existingEntry.startDate.getTime() ||
         new Date(endDate).getTime() !== existingEntry.endDate.getTime())) {
      
      const newDaysCount = calculateWorkingDays(startDate, endDate);
      const daysDifference = newDaysCount - existingEntry.daysCount;
      
      daysCount = newDaysCount;
      leavePlanUpdate = {
        daysUsed: {
          increment: daysDifference
        },
        daysRemaining: {
          decrement: daysDifference
        }
      };
    }
    
    const leaveEntry = await prisma.leaveEntry.update({
      where: { id: parseInt(id) },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        daysCount,
        leaveType,
        status,
        notes,
        updatedAt: new Date()
      }
    });
    
    // Update leave plan if needed
    if (Object.keys(leavePlanUpdate).length > 0) {
      await prisma.leavePlan.update({
        where: { id: existingEntry.leavePlanId },
        data: leavePlanUpdate
      });
    }
    
    res.json(leaveEntry);
  } catch (error) {
    console.error('Error updating leave entry:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji wpisu urlopu' });
  }
});

// Delete leave entry
router.delete('/leave-entry/:id', authenticateToken, authorize('leavePlanning:delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingEntry = await prisma.leaveEntry.findUnique({
      where: { id: parseInt(id) },
      include: { leavePlan: true }
    });
    
    if (!existingEntry) {
      return res.status(404).json({ error: 'Wpis urlopu nie został znaleziony' });
    }
    
    // Update leave plan totals
    await prisma.leavePlan.update({
      where: { id: existingEntry.leavePlanId },
      data: {
        daysUsed: {
          decrement: existingEntry.daysCount
        },
        daysRemaining: {
          increment: existingEntry.daysCount
        }
      }
    });
    
    // Delete the entry
    await prisma.leaveEntry.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Wpis urlopu został usunięty' });
  } catch (error) {
    console.error('Error deleting leave entry:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania wpisu urlopu' });
  }
});

// Approve/reject leave entry
router.patch('/leave-entry/:id/status', authenticateToken, authorize('leavePlanning:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy, notes } = req.body;
    
    const leaveEntry = await prisma.leaveEntry.update({
      where: { id: parseInt(id) },
      data: {
        status,
        approvedBy: approvedBy ? parseInt(approvedBy) : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        notes,
        updatedAt: new Date()
      },
      include: {
        leavePlan: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                surname: true,
                position: true
              }
            }
          }
        }
      }
    });
    
    res.json(leaveEntry);
  } catch (error) {
    console.error('Error updating leave entry status:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji statusu wpisu urlopu' });
  }
});

// Get leave statistics for dashboard
router.get('/statistics/:year', authenticateToken, authorize('leavePlanning:read'), async (req, res) => {
  try {
    const { year } = req.params;
    const yearInt = parseInt(year);
    
    const stats = await prisma.leavePlan.aggregate({
      where: { year: yearInt },
      _sum: {
        totalAvailable: true,
        daysUsed: true,
        daysRemaining: true
      },
      _count: {
        id: true
      }
    });
    
    const pendingRequests = await prisma.leaveEntry.count({
      where: {
        leavePlan: { year: yearInt },
        status: 'PENDING'
      }
    });
    
    const approvedRequests = await prisma.leaveEntry.count({
      where: {
        leavePlan: { year: yearInt },
        status: 'APPROVED'
      }
    });
    
    res.json({
      totalEmployees: stats._count.id || 0,
      totalAvailable: stats._sum.totalAvailable || 0,
      totalUsed: stats._sum.daysUsed || 0,
      totalRemaining: stats._sum.daysRemaining || 0,
      pendingRequests,
      approvedRequests,
      utilizationRate: stats._sum.totalAvailable ? 
        Math.round((stats._sum.daysUsed / stats._sum.totalAvailable) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania statystyk urlopów' });
  }
});

module.exports = router;

