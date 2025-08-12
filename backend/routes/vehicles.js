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
    // Check for registrationNumber presence
    if (!req.body.registrationNumber) {
      return res.status(400).json({ error: 'Registration number is required.' });
    }
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
      subject: `🚨 AWARIA POJAZDU - ${vehicle.brand} ${vehicle.registrationNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #dc2626; border-radius: 8px; background-color: #fef2f2;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #dc2626; margin: 0;">🚨 ZGŁOSZENIE AWARII POJAZDU</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Szczegóły pojazdu:</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Marka:</td>
                <td style="padding: 8px;">${vehicle.brand}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Numer rejestracyjny:</td>
                <td style="padding: 8px; font-weight: bold; color: #dc2626;">${vehicle.registrationNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Status:</td>
                <td style="padding: 8px; color: #dc2626; font-weight: bold;">❌ OZNACZONY JAKO NIESPRAWNY</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Informacje o zgłoszeniu:</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Zgłoszony przez:</td>
                <td style="padding: 8px;">${reportedBy}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Data zgłoszenia:</td>
                <td style="padding: 8px;">${new Date().toLocaleString('pl-PL')}</td>
              </tr>
            </table>
            ${description ? `
            <div style="margin-top: 15px;">
              <h3 style="color: #1f2937; margin-bottom: 10px;">Opis problemu:</h3>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; border-left: 4px solid #dc2626;">
                ${description}
              </div>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 6px;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              ⚠️ Wymagana natychmiastowa interwencja!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
            <p>Wiadomość wygenerowana automatycznie przez system ODPADnik</p>
          </div>
        </div>
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

    // Get vehicle details before updating
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Get the latest fault report for context
    const latestFault = await prisma.vehicleFaultReport.findFirst({
      where: { 
        vehicleId,
        isResolved: false
      },
      orderBy: { reportedAt: 'desc' }
    });

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

    // Send email notification about vehicle repair
    const emailContent = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: process.env.FLEET_EMAIL || 'fleet@yourcompany.com',
      subject: `✅ POJAZD NAPRAWIONY - ${vehicle.brand} ${vehicle.registrationNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #059669; border-radius: 8px; background-color: #f0fdf4;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #059669; margin: 0;">✅ POJAZD NAPRAWIONY I GOTOWY DO PRACY</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Szczegóły pojazdu:</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Marka:</td>
                <td style="padding: 8px;">${vehicle.brand}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Numer rejestracyjny:</td>
                <td style="padding: 8px; font-weight: bold; color: #059669;">${vehicle.registrationNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Status:</td>
                <td style="padding: 8px; color: #059669; font-weight: bold;">✅ OZNACZONY JAKO SPRAWNY</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Typ:</td>
                <td style="padding: 8px;">${vehicle.vehicleType || '-'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Informacje o naprawie:</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Data naprawy:</td>
                <td style="padding: 8px;">${new Date().toLocaleString('pl-PL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Status:</td>
                <td style="padding: 8px; color: #059669; font-weight: bold;">✅ GOTOWY DO PRACY</td>
              </tr>
            </table>
            ${latestFault ? `
            <div style="margin-top: 15px;">
              <h3 style="color: #1f2937; margin-bottom: 10px;">Naprawiony problem:</h3>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 4px; border-left: 4px solid #059669;">
                <strong>Oryginalny opis usterki:</strong><br>
                ${latestFault.description || 'Brak opisu'}
              </div>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #d1fae5; border-radius: 6px;">
            <p style="margin: 0; color: #065f46; font-weight: bold;">
              🚀 Pojazd jest gotowy do ponownego użycia w operacjach!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
            <p>Wiadomość wygenerowana automatycznie przez system ODPADnik</p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(emailContent);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

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