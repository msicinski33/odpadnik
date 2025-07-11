const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const path = require('path');

// Configure nodemailer (use your real SMTP in production)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER || 'your_ethereal_user',
    pass: process.env.ETHEREAL_PASS || 'your_ethereal_pass',
  },
});

function formatChanges(before, after) {
  let changes = [];
  for (const key in after) {
    if (before[key] !== after[key]) {
      changes.push(`${key}: '${before[key]}' → '${after[key]}'`);
    }
  }
  return changes.length ? changes.join('\n') : 'No changes.';
}

// Get all monthly work plans
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.monthlyWorkPlan.findMany();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly work plan by ID
router.get('/:id', async (req, res) => {
  try {
    const plan = await prisma.monthlyWorkPlan.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create monthly work plan
router.post('/', async (req, res) => {
  try {
    const plan = await prisma.monthlyWorkPlan.create({
      data: req.body,
    });
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update monthly work plan and send email
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const before = await prisma.monthlyWorkPlan.findUnique({ where: { id } });
    const after = await prisma.monthlyWorkPlan.update({
      where: { id },
      data: req.body,
    });
    // Send email notification
    const userEmail = req.body.notifyEmail || 'user@example.com'; // Replace with real logic
    await transporter.sendMail({
      from: 'ODPADnik <no-reply@odpadnik.pl>',
      to: userEmail,
      subject: 'Zmiana w miesięcznym planie pracy',
      text: `Plan został zmodyfikowany.\n\nZmiany:\n${formatChanges(before, after)}`,
    });
    res.json(after);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete monthly work plan
router.delete('/:id', async (req, res) => {
  try {
    await prisma.monthlyWorkPlan.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate Daily Work Plan PDF
router.post('/generate-pdf', async (req, res) => {
  try {
    const { assignments, date } = req.body;

    if (!assignments || !date) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Get all related data
    const assignmentIds = assignments.map(a => a.id);
    const regionIds = [...new Set(assignments.map(a => a.regionId))];
    const vehicleIds = [...new Set(assignments.map(a => a.vehicleId))];

    const [regions, vehicles, fractions, employees] = await Promise.all([
      prisma.region.findMany({ where: { id: { in: regionIds } } }),
      prisma.vehicle.findMany({ where: { id: { in: vehicleIds } } }),
      prisma.fraction.findMany(),
      prisma.employee.findMany()
    ]);

    // Create PDF document in A3 landscape
    const doc = new PDFDocument({
      size: 'A3',
      layout: 'landscape',
      margins: {
        top: 40,
        bottom: 80,
        left: 30,
        right: 30
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dzienny_plan_pracy_${date}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Register fonts using the same path as Trasówka
    const fontPathRegular = path.join(__dirname, '../fonts/NotoSans-Regular.ttf');
    const fontPathBold = path.join(__dirname, '../fonts/NotoSans-Bold.ttf');
    doc.registerFont('NotoSans', fontPathRegular);
    doc.registerFont('NotoSans-Bold', fontPathBold);

    // Page dimensions
    const pageWidth = 1190; // A3 landscape width
    const pageHeight = 842; // A3 landscape height
    const margin = 30;
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2) - 120; // Leave space for header and footer

    // Header
    doc.fontSize(18).font('NotoSans-Bold').text(
      'DZIENNY PLAN PRACY',
      margin,
      margin,
      { align: 'center', width: usableWidth }
    );

    doc.fontSize(14).font('NotoSans').text(
      `Data: ${new Date(date).toLocaleDateString('pl-PL')}`,
      margin,
      margin + 30,
      { align: 'center', width: usableWidth }
    );

    // Table setup
    const tableY = margin + 80;
    const rowHeight = 25;
    const colWidths = {
      lp: 40,
      region: 120,
      vehicle: 100,
      driver: 100,
      loader: 100,
      fractions: usableWidth - 460 // Remaining width
    };

    // Table header
    let currentX = margin;
    const headerY = tableY;
    
    // Lp.
    doc.rect(currentX, headerY, colWidths.lp, rowHeight).fillAndStroke('#f0f0f0', '#000');
    doc.fontSize(10).font('NotoSans-Bold').fillColor('black')
      .text('Lp.', currentX + 5, headerY + 8);
    currentX += colWidths.lp;

    // Region
    doc.rect(currentX, headerY, colWidths.region, rowHeight).fillAndStroke('#f0f0f0', '#000');
    doc.fontSize(10).font('NotoSans-Bold').fillColor('black')
      .text('Region', currentX + 5, headerY + 8);
    currentX += colWidths.region;

    // Vehicle
    doc.rect(currentX, headerY, colWidths.vehicle, rowHeight).fillAndStroke('#f0f0f0', '#000');
    doc.fontSize(10).font('NotoSans-Bold').fillColor('black')
      .text('Pojazd', currentX + 5, headerY + 8);
    currentX += colWidths.vehicle;

    // Driver
    doc.rect(currentX, headerY, colWidths.driver, rowHeight).fillAndStroke('#f0f0f0', '#000');
    doc.fontSize(10).font('NotoSans-Bold').fillColor('black')
      .text('Kierowca', currentX + 5, headerY + 8);
    currentX += colWidths.driver;

    // Loader
    doc.rect(currentX, headerY, colWidths.loader, rowHeight).fillAndStroke('#f0f0f0', '#000');
    doc.fontSize(10).font('NotoSans-Bold').fillColor('black')
      .text('Ładowacz', currentX + 5, headerY + 8);
    currentX += colWidths.loader;

    // Fractions
    doc.rect(currentX, headerY, colWidths.fractions, rowHeight).fillAndStroke('#f0f0f0', '#000');
    doc.fontSize(10).font('NotoSans-Bold').fillColor('black')
      .text('Frakcje', currentX + 5, headerY + 8);

    // Table rows
    assignments.forEach((assignment, index) => {
      const rowY = tableY + rowHeight + (index * rowHeight);
      currentX = margin;

      const region = regions.find(r => r.id === assignment.regionId);
      const vehicle = vehicles.find(v => v.id === assignment.vehicleId);
      const driver = employees.find(e => e.id === assignment.driverId);
      const loader = employees.find(e => e.id === assignment.loaderId);

      // Lp.
      doc.rect(currentX, rowY, colWidths.lp, rowHeight).stroke();
      doc.fontSize(9).font('NotoSans').fillColor('black')
        .text((index + 1).toString(), currentX + 5, rowY + 8);
      currentX += colWidths.lp;

      // Region
      doc.rect(currentX, rowY, colWidths.region, rowHeight).stroke();
      doc.fontSize(9).font('NotoSans').fillColor('black')
        .text(region?.name || '', currentX + 5, rowY + 8);
      currentX += colWidths.region;

      // Vehicle
      doc.rect(currentX, rowY, colWidths.vehicle, rowHeight).stroke();
      doc.fontSize(9).font('NotoSans').fillColor('black')
        .text(vehicle?.registrationNumber || '', currentX + 5, rowY + 8);
      currentX += colWidths.vehicle;

      // Driver
      doc.rect(currentX, rowY, colWidths.driver, rowHeight).stroke();
      doc.fontSize(9).font('NotoSans').fillColor('black')
        .text(driver ? `${driver.name} ${driver.surname}` : '', currentX + 5, rowY + 8);
      currentX += colWidths.driver;

      // Loader
      doc.rect(currentX, rowY, colWidths.loader, rowHeight).stroke();
      doc.fontSize(9).font('NotoSans').fillColor('black')
        .text(loader ? `${loader.name} ${loader.surname}` : '', currentX + 5, rowY + 8);
      currentX += colWidths.loader;

      // Fractions
      doc.rect(currentX, rowY, colWidths.fractions, rowHeight).stroke();
      
      // Get fractions for this assignment
      const assignmentFractions = assignment.fractionIds.map(fractionId => 
        fractions.find(f => f.id === fractionId)
      ).filter(Boolean);

      // Draw fraction boxes
      let fractionX = currentX + 5;
      assignmentFractions.forEach((fraction, fracIndex) => {
        const boxWidth = 60;
        const boxHeight = 15;
        const boxY = rowY + 5;
        
        if (fractionX + boxWidth > currentX + colWidths.fractions - 5) {
          // Move to next line if no space
          fractionX = currentX + 5;
          boxY = rowY + 20;
        }

        doc.save();
        doc.rect(fractionX, boxY, boxWidth, boxHeight).fillAndStroke(fraction.color || '#ccc', '#000');
        doc.fontSize(8).font('NotoSans-Bold').fillColor('white')
          .text(fraction.code || fraction.name, fractionX + 2, boxY + 4);
        doc.restore();

        fractionX += boxWidth + 5;
      });
    });

    // Footer
    const footerY = pageHeight - 60;
    
    // UWAGA text
    doc.fontSize(10).font('NotoSans-Bold').fillColor('black')
      .text('UWAGA:', margin, footerY);
    
    doc.fontSize(9).font('NotoSans').fillColor('black')
      .text('Plan może ulec zmianie w trakcie realizacji', margin, footerY + 15);

    // Signature fields
    const signatureY = footerY + 35;
    const signatureWidth = 200;
    
    // Sporządził
    doc.fontSize(9).font('NotoSans').fillColor('black')
      .text('Sporządził:', margin, signatureY);
    doc.rect(margin, signatureY + 15, signatureWidth, 20).stroke();
    
    // Zatwierdził
    doc.fontSize(9).font('NotoSans').fillColor('black')
      .text('Zatwierdził:', margin + signatureWidth + 50, signatureY);
    doc.rect(margin + signatureWidth + 50, signatureY + 15, signatureWidth, 20).stroke();

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating Daily Work Plan PDF:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

module.exports = router; 