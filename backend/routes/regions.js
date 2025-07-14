const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PdfPrinter = require('pdfmake');
const { authenticateToken } = require('./authMiddleware');

const fonts = {
  Roboto: {
    normal: 'node_modules/pdfmake/build/vfs_fonts.js',
    bold: 'node_modules/pdfmake/build/vfs_fonts.js',
    italics: 'node_modules/pdfmake/build/vfs_fonts.js',
    bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js',
  },
};
const printer = new PdfPrinter(fonts);

// Get all regions
router.get('/', async (req, res) => {
  try {
    const regions = await prisma.region.findMany();
    res.json(regions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get region by ID
router.get('/:id', async (req, res) => {
  try {
    const region = await prisma.region.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        regionFractions: { include: { fraction: true } },
        points: true
      }
    });
    if (!region) return res.status(404).json({ error: 'Region not found' });
    const assignedFractions = region.regionFractions.map(rf => rf.fraction);
    res.json({
      ...region,
      assignedFractions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create region
router.post('/', async (req, res) => {
  try {
    const region = await prisma.region.create({
      data: req.body,
    });
    res.status(201).json(region);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update region
router.put('/:id', async (req, res) => {
  try {
    const region = await prisma.region.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(region);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete region
router.delete('/:id', async (req, res) => {
  try {
    await prisma.region.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export region and its points as PDF
router.get('/export/pdf', authenticateToken, async (req, res) => {
  try {
    const { regionId } = req.query;
    if (!regionId) return res.status(400).json({ error: 'regionId required' });
    const region = await prisma.region.findUnique({
      where: { id: Number(regionId) },
      include: { points: true },
    });
    if (!region) return res.status(404).json({ error: 'Region not found' });
    const user = req.user;
    const now = new Date().toLocaleString();

    const docDefinition = {
      content: [
        { text: `Region: ${region.name}`, style: 'header' },
        { text: `Unit: ${region.unitName}` },
        { text: 'Points:', style: 'subheader', margin: [0, 10, 0, 4] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', '*', '*'],
            body: [
              ['ID', 'Type', 'Town', 'Street', 'Number'],
              ...region.points.map(p => [p.id, p.type, p.town, p.street, p.number]),
            ],
          },
        },
      ],
      footer: (currentPage, pageCount) => {
        return {
          columns: [
            { text: `Sporządził: ${user.name}`, alignment: 'left', margin: [40, 0, 0, 0] },
            { text: `Data: ${now}`, alignment: 'right', margin: [0, 0, 40, 0] },
          ],
        };
      },
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=region_${region.id}.pdf`);
      res.send(pdfBuffer);
    });
    pdfDoc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all points for a region
router.get('/:id/points', async (req, res) => {
  try {
    const points = await prisma.point.findMany({
      where: { regionId: Number(req.params.id) },
    });
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign points to a region (replace all points for this region)
router.put('/:id/points', async (req, res) => {
  try {
    const regionId = Number(req.params.id);
    const { pointIds } = req.body; // array of point IDs to assign
    if (!Array.isArray(pointIds)) {
      return res.status(400).json({ error: 'pointIds must be an array' });
    }
    // Set regionId for selected points
    await prisma.point.updateMany({
      where: { regionId: regionId },
      data: { regionId: null }, // Unassign all current points from this region
    });
    await prisma.point.updateMany({
      where: { id: { in: pointIds } },
      data: { regionId },
    });
    const updatedPoints = await prisma.point.findMany({ where: { regionId } });
    res.json(updatedPoints);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all fractions for a region
router.get('/:id/fractions', async (req, res) => {
  try {
    const regionId = Number(req.params.id);
    if (isNaN(regionId)) return res.status(400).json({ error: 'Invalid region ID' });
    const regionFractions = await prisma.regionFraction.findMany({
      where: { regionId },
      include: { fraction: true },
    });
    res.json(regionFractions.map(rf => rf.fraction));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign/update fractions for a region (replace all)
router.put('/:id/fractions', async (req, res) => {
  try {
    const regionId = Number(req.params.id);
    const { fractionIds } = req.body; // array of fraction IDs to assign
    if (!Array.isArray(fractionIds)) {
      return res.status(400).json({ error: 'fractionIds must be an array' });
    }
    // Remove all existing fractions for this region
    await prisma.regionFraction.deleteMany({ where: { regionId } });
    // Add new ones
    const created = await Promise.all(fractionIds.map(fractionId =>
      prisma.regionFraction.create({
        data: { regionId, fractionId: Number(fractionId) },
      })
    ));
    res.json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 