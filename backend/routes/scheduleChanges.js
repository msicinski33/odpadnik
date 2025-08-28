const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorizeModule, hasPermission } = require('./authMiddleware');
const nodemailer = require('nodemailer');

// Configure nodemailer (reuse existing configuration)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  auth: {
    user: process.env.SMTP_USER || 'demo@ethereal.email',
    pass: process.env.SMTP_PASS || 'demo',
  },
});

// Apply authentication to all routes
router.use(authenticateToken);

// Utility function to send email notifications
async function sendScheduleChangeNotification(scheduleChange, type = 'new') {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: scheduleChange.employeeId }
    });
    
    const requester = await prisma.user.findUnique({
      where: { id: scheduleChange.requestedById }
    });

    // Get notification recipients based on configuration
    const notificationConfigs = await prisma.scheduleChangeNotificationConfig.findMany({
      where: { 
        isActive: true,
        ...(type === 'new' ? { notifyOnNew: true } : { notifyOnApproval: true })
      }
    });

    // Also get all managers/supervisors
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['kierownik', 'dyspozytor', 'admin'] },
        isActive: true
      }
    });

    const recipients = [
      ...notificationConfigs.map(config => config.email),
      ...managers.map(manager => manager.email),
      employee.email // Also notify the employee
    ].filter(Boolean).filter((email, index, self) => self.indexOf(email) === index); // Remove duplicates

    if (recipients.length === 0) return;

    const typeLabels = {
      SHIFT_CHANGE: 'Zmiana zmiany',
      SHIFT_REMOVAL: 'Usunięcie zmiany', 
      ABSENCE: 'Przypisanie nieobecności',
      OTHER_EVENT: 'Inne zdarzenie'
    };

    const statusLabels = {
      PENDING: 'Oczekujące na zatwierdzenie',
      APPROVED: 'Zatwierdzone',
      REJECTED: 'Odrzucone',
      AUTO_APPROVED: 'Automatycznie zatwierdzone'
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('pl-PL');
    const dateRange = scheduleChange.startDate === scheduleChange.endDate 
      ? formatDate(scheduleChange.startDate)
      : `${formatDate(scheduleChange.startDate)} - ${formatDate(scheduleChange.endDate)}`;

    const subject = type === 'new' 
      ? `📅 Nowy wniosek o zmianę grafiku - ${employee.surname} ${employee.name}`
      : `📅 ${statusLabels[scheduleChange.status]} - Zmiana grafiku ${employee.surname} ${employee.name}`;

    const statusColor = scheduleChange.status === 'APPROVED' || scheduleChange.status === 'AUTO_APPROVED' ? '#10b981' : 
                       scheduleChange.status === 'REJECTED' ? '#ef4444' : '#f59e0b';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid ${statusColor}; border-radius: 8px; background-color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: ${statusColor}; margin: 0;">📅 ZMIANA GRAFIKU PRACY</h1>
          <h2 style="color: #1f2937; margin: 10px 0;">${subject}</h2>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-top: 0;">Szczegóły wniosku:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Pracownik:</td>
              <td style="padding: 8px;">${employee.surname} ${employee.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Wnioskujący:</td>
              <td style="padding: 8px;">${requester.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Typ zmiany:</td>
              <td style="padding: 8px;">${typeLabels[scheduleChange.changeType]}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Zakres dat:</td>
              <td style="padding: 8px;">${dateRange}</td>
            </tr>
            ${scheduleChange.originalShift ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Oryginalna zmiana:</td>
              <td style="padding: 8px;">${scheduleChange.originalShift}</td>
            </tr>
            ` : ''}
            ${scheduleChange.newShift ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Nowa zmiana:</td>
              <td style="padding: 8px;">${scheduleChange.newShift}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Status:</td>
              <td style="padding: 8px; font-weight: bold; color: ${statusColor};">${statusLabels[scheduleChange.status]}</td>
            </tr>
          </table>
          
          ${scheduleChange.reason ? `
          <div style="margin-top: 15px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">Powód:</h4>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; border-left: 4px solid ${statusColor};">
              ${scheduleChange.reason}
            </div>
          </div>
          ` : ''}
          
          ${scheduleChange.description ? `
          <div style="margin-top: 15px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">Dodatkowe informacje:</h4>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px;">
              ${scheduleChange.description}
            </div>
          </div>
          ` : ''}
          
          ${scheduleChange.rejectionReason ? `
          <div style="margin-top: 15px;">
            <h4 style="color: #ef4444; margin-bottom: 10px;">Powód odrzucenia:</h4>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; border-left: 4px solid #ef4444;">
              ${scheduleChange.rejectionReason}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
          <p>Wiadomość wygenerowana automatycznie przez system ODPADnik</p>
          <p>Data: ${new Date().toLocaleString('pl-PL')}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: 'ODPADnik <no-reply@odpadnik.pl>',
      to: recipients.join(', '),
      subject,
      html
    });

    console.log(`Schedule change notification sent to: ${recipients.join(', ')}`);

  } catch (error) {
    console.error('Error sending schedule change notification:', error);
  }
}

// GET /api/schedule-changes - List schedule change requests
router.get('/', async (req, res) => {
  try {
    const { status, employeeId, requestedById, page = 1, limit = 50 } = req.query;
    
    // Build where clause based on filters and permissions
    const where = {};
    
    if (status) where.status = status;
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (requestedById) where.requestedById = parseInt(requestedById);
    
    // If user is not admin/manager, only show their own requests or requests for their employees
    if (!hasPermission(req.user, 'scheduleChanges:read_all')) {
      where.OR = [
        { requestedById: req.user.id }, // Own requests
        { employeeId: req.user.employeeId || -1 } // Requests for themselves if they are employees
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [scheduleChanges, total] = await Promise.all([
      prisma.scheduleChangeRequest.findMany({
        where,
        include: {
          employee: {
            select: { id: true, name: true, surname: true, position: true }
          },
          requestedBy: {
            select: { id: true, name: true, email: true }
          },
          approvedBy: {
            select: { id: true, name: true, email: true }
          },
          absenceType: {
            select: { id: true, name: true, code: true }
          },
          changeDays: {
            orderBy: { date: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.scheduleChangeRequest.count({ where })
    ]);

    res.json({
      data: scheduleChanges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching schedule changes:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/schedule-changes/:id - Get specific schedule change request
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const scheduleChange = await prisma.scheduleChangeRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, name: true, surname: true, position: true, email: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true }
        },
        absenceType: {
          select: { id: true, name: true, code: true, color: true }
        },
        changeDays: {
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!scheduleChange) {
      return res.status(404).json({ error: 'Schedule change request not found' });
    }

    // Check permissions
    const canView = hasPermission(req.user, 'scheduleChanges:read_all') ||
                   scheduleChange.requestedById === req.user.id ||
                   scheduleChange.employeeId === req.user.employeeId;

    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(scheduleChange);

  } catch (error) {
    console.error('Error fetching schedule change:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/schedule-changes - Create new schedule change request
router.post('/', async (req, res) => {
  try {
    const {
      employeeId,
      changeType,
      startDate,
      endDate,
      originalShift,
      newShift,
      absenceTypeId,
      reason,
      description
    } = req.body;

    // Validate required fields
    if (!employeeId || !changeType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user can create requests for this employee
    const canCreate = hasPermission(req.user, 'scheduleChanges:create_all') ||
                     employeeId === req.user.employeeId;

    if (!canCreate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine if auto-approval applies (managers creating changes)
    const isManagerRequest = hasPermission(req.user, 'scheduleChanges:auto_approve');
    const status = isManagerRequest ? 'AUTO_APPROVED' : 'PENDING';

    // Create the schedule change request
    const scheduleChange = await prisma.scheduleChangeRequest.create({
      data: {
        employeeId: parseInt(employeeId),
        requestedById: req.user.id,
        changeType,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        originalShift,
        newShift,
        absenceTypeId: absenceTypeId ? parseInt(absenceTypeId) : null,
        reason,
        description,
        approvedById: isManagerRequest ? req.user.id : null,
        approvedAt: isManagerRequest ? new Date() : null
      },
      include: {
        employee: {
          select: { id: true, name: true, surname: true, position: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create individual change days
    const changeDays = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      changeDays.push({
        scheduleChangeId: scheduleChange.id,
        date: new Date(date),
        originalShift,
        newShift,
        applied: isManagerRequest, // Auto-apply for manager requests
        appliedAt: isManagerRequest ? new Date() : null
      });
    }

    if (changeDays.length > 0) {
      await prisma.scheduleChangeDay.createMany({
        data: changeDays
      });
    }

    // Send notification email
    await sendScheduleChangeNotification(scheduleChange, 'new');

    // If auto-approved, also send approval notification
    if (isManagerRequest) {
      await sendScheduleChangeNotification({ ...scheduleChange, status: 'AUTO_APPROVED' }, 'approval');
      
      // Apply changes to employee schedule immediately
      await applyScheduleChanges(scheduleChange.id);
    }

    res.status(201).json(scheduleChange);

  } catch (error) {
    console.error('Error creating schedule change:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/schedule-changes/:id/approve - Approve schedule change request
router.put('/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { notes } = req.body;

    // Check permissions
    if (!hasPermission(req.user, 'scheduleChanges:approve')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const scheduleChange = await prisma.scheduleChangeRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        requestedBy: true
      }
    });

    if (!scheduleChange) {
      return res.status(404).json({ error: 'Schedule change request not found' });
    }

    if (scheduleChange.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is not pending approval' });
    }

    // Update request status
    const updatedRequest = await prisma.scheduleChangeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        description: notes ? `${scheduleChange.description || ''}\n\nUwagi przy zatwierdzeniu: ${notes}`.trim() : scheduleChange.description
      },
      include: {
        employee: {
          select: { id: true, name: true, surname: true, position: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Apply changes to employee schedule
    await applyScheduleChanges(id);

    // Send approval notification
    await sendScheduleChangeNotification(updatedRequest, 'approval');

    res.json(updatedRequest);

  } catch (error) {
    console.error('Error approving schedule change:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/schedule-changes/:id/reject - Reject schedule change request
router.put('/:id/reject', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Check permissions
    if (!hasPermission(req.user, 'scheduleChanges:approve')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const scheduleChange = await prisma.scheduleChangeRequest.findUnique({
      where: { id }
    });

    if (!scheduleChange) {
      return res.status(404).json({ error: 'Schedule change request not found' });
    }

    if (scheduleChange.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is not pending approval' });
    }

    // Update request status
    const updatedRequest = await prisma.scheduleChangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        rejectionReason: reason
      },
      include: {
        employee: {
          select: { id: true, name: true, surname: true, position: true }
        },
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send rejection notification
    await sendScheduleChangeNotification(updatedRequest, 'approval');

    res.json(updatedRequest);

  } catch (error) {
    console.error('Error rejecting schedule change:', error);
    res.status(500).json({ error: error.message });
  }
});

// Utility function to apply schedule changes to employee schedules
async function applyScheduleChanges(scheduleChangeId) {
  try {
    const scheduleChange = await prisma.scheduleChangeRequest.findUnique({
      where: { id: scheduleChangeId },
      include: {
        changeDays: true
      }
    });

    if (!scheduleChange || scheduleChange.status !== 'APPROVED' && scheduleChange.status !== 'AUTO_APPROVED') {
      return;
    }

    // Apply each change day
    for (const changeDay of scheduleChange.changeDays) {
      if (changeDay.applied) continue; // Skip already applied changes

      const dateStr = changeDay.date.toISOString().split('T')[0];

      if (changeDay.newShift) {
        // Update or create employee schedule
        await prisma.employeeSchedule.upsert({
          where: {
            employeeId_date: {
              employeeId: scheduleChange.employeeId,
              date: changeDay.date
            }
          },
          update: {
            shift: changeDay.newShift
          },
          create: {
            employeeId: scheduleChange.employeeId,
            date: changeDay.date,
            shift: changeDay.newShift
          }
        });
      } else {
        // Remove schedule entry (shift removal)
        await prisma.employeeSchedule.deleteMany({
          where: {
            employeeId: scheduleChange.employeeId,
            date: changeDay.date
          }
        });
      }

      // Mark change day as applied
      await prisma.scheduleChangeDay.update({
        where: { id: changeDay.id },
        data: {
          applied: true,
          appliedAt: new Date()
        }
      });
    }

  } catch (error) {
    console.error('Error applying schedule changes:', error);
    throw error;
  }
}

// GET /api/schedule-changes/notifications/config - Get notification configuration
router.get('/notifications/config', async (req, res) => {
  try {
    if (!hasPermission(req.user, 'scheduleChanges:admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const configs = await prisma.scheduleChangeNotificationConfig.findMany({
      orderBy: { role: 'asc' }
    });

    res.json(configs);

  } catch (error) {
    console.error('Error fetching notification config:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/schedule-changes/notifications/config - Create notification configuration
router.post('/notifications/config', async (req, res) => {
  try {
    if (!hasPermission(req.user, 'scheduleChanges:admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { role, email, notifyOnNew, notifyOnApproval } = req.body;

    const config = await prisma.scheduleChangeNotificationConfig.create({
      data: {
        role,
        email,
        notifyOnNew: notifyOnNew !== false,
        notifyOnApproval: notifyOnApproval !== false
      }
    });

    res.status(201).json(config);

  } catch (error) {
    console.error('Error creating notification config:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;