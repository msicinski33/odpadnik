const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

// Configure nodemailer for notifications
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'test@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

// Helper function to send email notifications
async function sendNotification(scheduleChangeId, type, recipientEmail, recipientName, employeeName, changeDetails) {
  try {
    let subject, body;
    
    switch (type) {
      case 'APPROVAL_REQUEST':
        subject = `Schedule Change Request - ${employeeName}`;
        body = `
          A new schedule change request has been submitted by ${employeeName}.
          
          Change Details:
          ${changeDetails}
          
          Please review and approve/reject this request in the system.
        `;
        break;
      case 'APPROVAL_GRANTED':
        subject = `Schedule Change Approved - ${employeeName}`;
        body = `
          Your schedule change request has been approved.
          
          Change Details:
          ${changeDetails}
          
          The changes will be applied to your schedule.
        `;
        break;
      case 'APPROVAL_DENIED':
        subject = `Schedule Change Rejected - ${employeeName}`;
        body = `
          Your schedule change request has been rejected.
          
          Change Details:
          ${changeDetails}
          
          Please contact your manager for more information.
        `;
        break;
      case 'CHANGE_NOTIFICATION':
        subject = `Schedule Change Notification - ${employeeName}`;
        body = `
          A schedule change has been processed for ${employeeName}.
          
          Change Details:
          ${changeDetails}
        `;
        break;
    }

    // Create notification record
    const notification = await prisma.scheduleChangeNotification.create({
      data: {
        scheduleChangeId,
        recipientEmail,
        recipientName,
        notificationType: type,
        emailSubject: subject,
        emailBody: body,
        deliveryStatus: 'PENDING'
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@example.com',
      to: recipientEmail,
      subject,
      text: body
    });

    // Update notification status
    await prisma.scheduleChangeNotification.update({
      where: { id: notification.id },
      data: {
        deliveryStatus: 'SENT',
        sentAt: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error('Email notification error:', error);
    
    // Update notification with error
    await prisma.scheduleChangeNotification.updateMany({
      where: { scheduleChangeId, recipientEmail, notificationType: type },
      data: {
        deliveryStatus: 'FAILED',
        errorMessage: error.message
      }
    });
    
    return false;
  }
}

// Get all employees (for search functionality)
router.get('/employees/search', async (req, res) => {
  try {
    const { q } = req.query;
    const whereClause = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { surname: { contains: q, mode: 'insensitive' } }
      ]
    } : {};

    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        surname: true,
        position: true,
        email: true
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee schedule for a specific month
router.get('/employees/:id/schedule/:month', async (req, res) => {
  try {
    const { id, month } = req.params; // month format: YYYY-MM
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const schedule = await prisma.employeeSchedule.findMany({
      where: {
        employeeId: Number(id),
        date: { gte: start, lt: end }
      },
      orderBy: { date: 'asc' }
    });

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all absence types
router.get('/absence-types', async (req, res) => {
  try {
    const absenceTypes = await prisma.rodzajAbsencji.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(absenceTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a schedule change request
router.post('/requests', async (req, res) => {
  try {
    const {
      employeeId,
      requestedById,
      managerId,
      affectedDates,
      changeType,
      originalShifts,
      newShifts,
      absenceTypeId,
      reason
    } = req.body;

    // Determine if auto-approval should apply
    const requestedBy = await prisma.user.findUnique({
      where: { id: requestedById }
    });
    
    const isManager = requestedBy && requestedBy.role === 'manager';
    const autoApproved = isManager;
    const status = autoApproved ? 'APPROVED' : 'PENDING';

    // Create the schedule change request
    const scheduleChange = await prisma.scheduleChangeRequest.create({
      data: {
        employeeId,
        requestedById,
        managerId,
        affectedDates,
        changeType,
        originalShifts,
        newShifts,
        absenceTypeId,
        reason,
        status,
        autoApproved,
        reviewedAt: autoApproved ? new Date() : null,
        reviewedById: autoApproved ? requestedById : null
      },
      include: {
        employee: true,
        requestedBy: true,
        manager: true,
        absenceType: true
      }
    });

    // If auto-approved, apply changes immediately
    if (autoApproved) {
      await applyScheduleChanges(scheduleChange);
    }

    // Send notifications
    const employee = scheduleChange.employee;
    const employeeName = `${employee.name} ${employee.surname}`;
    const changeDetails = formatChangeDetails(scheduleChange);

    if (autoApproved) {
      // Manager made the change - send notification to employee and coordinators
      if (employee.email) {
        await sendNotification(
          scheduleChange.id,
          'CHANGE_NOTIFICATION',
          employee.email,
          employeeName,
          employeeName,
          changeDetails
        );
      }
      
      // Send to coordinators (you may need to define how to get coordinator emails)
      const coordinators = await getCoordinatorEmails();
      for (const coordinator of coordinators) {
        await sendNotification(
          scheduleChange.id,
          'CHANGE_NOTIFICATION',
          coordinator.email,
          coordinator.name,
          employeeName,
          changeDetails
        );
      }
    } else {
      // Employee made the request - send to manager for approval
      if (scheduleChange.manager && scheduleChange.manager.email) {
        await sendNotification(
          scheduleChange.id,
          'APPROVAL_REQUEST',
          scheduleChange.manager.email,
          scheduleChange.manager.name,
          employeeName,
          changeDetails
        );
      }
    }

    res.status(201).json(scheduleChange);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all schedule change requests (with filtering)
router.get('/requests', async (req, res) => {
  try {
    const { status, employeeId, managerId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = Number(employeeId);
    if (managerId) where.managerId = Number(managerId);

    const requests = await prisma.scheduleChangeRequest.findMany({
      where,
      include: {
        employee: true,
        requestedBy: true,
        manager: true,
        absenceType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific schedule change request
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await prisma.scheduleChangeRequest.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        employee: true,
        requestedBy: true,
        manager: true,
        absenceType: true,
        notifications: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Schedule change request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject a schedule change request
router.patch('/requests/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewedById, managerNotes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    const scheduleChange = await prisma.scheduleChangeRequest.update({
      where: { id: Number(id) },
      data: {
        status,
        reviewedById,
        reviewedAt: new Date(),
        managerNotes
      },
      include: {
        employee: true,
        requestedBy: true,
        reviewedBy: true,
        absenceType: true
      }
    });

    // Apply changes if approved
    if (status === 'APPROVED') {
      await applyScheduleChanges(scheduleChange);
    }

    // Send notifications
    const employee = scheduleChange.employee;
    const employeeName = `${employee.name} ${employee.surname}`;
    const changeDetails = formatChangeDetails(scheduleChange);
    
    const notificationType = status === 'APPROVED' ? 'APPROVAL_GRANTED' : 'APPROVAL_DENIED';
    
    // Notify employee
    if (employee.email) {
      await sendNotification(
        scheduleChange.id,
        notificationType,
        employee.email,
        employeeName,
        employeeName,
        changeDetails
      );
    }

    // If approved, notify coordinators
    if (status === 'APPROVED') {
      const coordinators = await getCoordinatorEmails();
      for (const coordinator of coordinators) {
        await sendNotification(
          scheduleChange.id,
          'CHANGE_NOTIFICATION',
          coordinator.email,
          coordinator.name,
          employeeName,
          changeDetails
        );
      }
    }

    res.json(scheduleChange);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper function to apply schedule changes to the actual schedule
async function applyScheduleChanges(scheduleChange) {
  const { employeeId, affectedDates, changeType, newShifts, absenceTypeId } = scheduleChange;
  
  for (const dateString of affectedDates) {
    const date = new Date(dateString + 'T00:00:00.000Z');
    
    // Find existing schedule entry
    const existingSchedule = await prisma.employeeSchedule.findFirst({
      where: { employeeId, date }
    });

    switch (changeType) {
      case 'SHIFT_REMOVE':
        if (existingSchedule) {
          await prisma.employeeSchedule.delete({
            where: { id: existingSchedule.id }
          });
        }
        break;
        
      case 'SHIFT_CHANGE':
      case 'SHIFT_ADD':
        const shiftData = newShifts[dateString];
        if (shiftData) {
          if (existingSchedule) {
            await prisma.employeeSchedule.update({
              where: { id: existingSchedule.id },
              data: {
                shift: shiftData.shift,
                customHours: shiftData.customHours,
                colorCode: shiftData.colorCode
              }
            });
          } else {
            await prisma.employeeSchedule.create({
              data: {
                employeeId,
                date,
                shift: shiftData.shift,
                customHours: shiftData.customHours,
                colorCode: shiftData.colorCode
              }
            });
          }
        }
        break;
        
      case 'ABSENCE_ASSIGN':
        // Create work card entry for absence
        await prisma.workCardEntry.upsert({
          where: {
            employeeId_date: { employeeId, date }
          },
          update: {
            absenceTypeId,
            actualFrom: null,
            actualTo: null,
            actualTotal: null
          },
          create: {
            employeeId,
            date,
            absenceTypeId
          }
        });
        break;
    }
  }
}

// Helper function to format change details for notifications
function formatChangeDetails(scheduleChange) {
  const { affectedDates, changeType, originalShifts, newShifts, absenceType, reason } = scheduleChange;
  
  let details = `Change Type: ${changeType}\n`;
  details += `Affected Dates: ${affectedDates.join(', ')}\n`;
  
  if (reason) {
    details += `Reason: ${reason}\n`;
  }
  
  if (changeType === 'ABSENCE_ASSIGN' && absenceType) {
    details += `Absence Type: ${absenceType.name}\n`;
  }
  
  if (originalShifts || newShifts) {
    details += '\nSchedule Changes:\n';
    for (const date of affectedDates) {
      const original = originalShifts ? originalShifts[date] : null;
      const newShift = newShifts ? newShifts[date] : null;
      
      if (original || newShift) {
        details += `${date}: `;
        if (original) details += `${original.shift} → `;
        if (newShift) details += newShift.shift;
        details += '\n';
      }
    }
  }
  
  return details;
}

// Helper function to get coordinator emails (you may need to customize this)
async function getCoordinatorEmails() {
  try {
    const coordinators = await prisma.user.findMany({
      where: {
        role: { in: ['coordinator', 'admin'] },
        isActive: true
      },
      select: {
        email: true,
        name: true
      }
    });
    return coordinators;
  } catch (error) {
    console.error('Error fetching coordinators:', error);
    return [];
  }
}

module.exports = router;