const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        faultReports: {
          where: { isResolved: false },
          orderBy: { reportedAt: 'desc' },
          take: 1
        }
      }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        faultReports: {
          orderBy: { reportedAt: 'desc' }
        }
      }
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vehicle
router.post('/', async (req, res) => {
  try {
    // Check for unique registrationNumber
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: req.body.registrationNumber }
    });
    if (existing) {
      return res.status(400).json({ error: 'Registration number must be unique.' });
    }
    const vehicle = await prisma.vehicle.create({
      data: req.body,
    });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update vehicle
router.put('/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Report vehicle fault
router.post('/:id/fault', async (req, res) => {
  try {
    const { description, reportedBy } = req.body;
    const vehicleId = Number(req.params.id);

    // Get vehicle details
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Create fault report
    const faultReport = await prisma.vehicleFaultReport.create({
      data: {
        vehicleId,
        reportedBy,
        description: description || null
      }
    });

    // Update vehicle status to faulty
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { faultStatus: 'faulty' }
    });

    // Send email notification
    const emailContent = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: process.env.FLEET_EMAIL || 'fleet@yourcompany.com',
      subject: `[Vehicle Fault Report] ${vehicle.brand} ${vehicle.registrationNumber}`,
      html: `
        <h2>Vehicle Fault Report</h2>
        <p><strong>Vehicle:</strong> ${vehicle.brand}</p>
        <p><strong>Plate:</strong> ${vehicle.registrationNumber}</p>
        <p><strong>Status:</strong> Marked as FAULTY</p>
        <br>
        <p><strong>Reported by:</strong> ${reportedBy}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString('pl-PL')}</p>
        ${description ? `<br><p><strong>Description:</strong></p><p>${description}</p>` : ''}
      `
    };

    try {
      await transporter.sendMail(emailContent);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json(faultReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Resolve vehicle fault
router.put('/:id/fault/resolve', async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    // Update vehicle status back to operational
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { faultStatus: 'operational' }
    });

    // Mark all unresolved fault reports as resolved
    await prisma.vehicleFaultReport.updateMany({
      where: { 
        vehicleId,
        isResolved: false
      },
      data: {
        isResolved: true,
        resolvedAt: new Date()
      }
    });

    res.json({ message: 'Vehicle fault resolved' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get vehicle fault history
router.get('/:id/faults', async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const faultReports = await prisma.vehicleFaultReport.findMany({
      where: { vehicleId },
      orderBy: { reportedAt: 'desc' }
    });
    res.json(faultReports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ select: { id: true, name: true, registration: true } });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 