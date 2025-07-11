const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all points (with optional filtering by regionId and type)
router.get('/', async (req, res) => {
  try {
    const { regionId, type } = req.query;
    const where = {};
    if (regionId) where.regionId = Number(regionId);
    if (type) where.type = type;
    const points = await prisma.point.findMany({
      where,
      include: {
        region: true
      }
    });
    console.log('[GET /api/points] where:', where, '| returned:', points.length, 'points');
    if (points.length === 0) {
      return res.json({ message: '0 points', points: [] });
    }
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get points by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const points = await prisma.point.findMany({
      where: { type },
      include: {
        region: true
      }
    });
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create point
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.id === '') delete data.id;
    let regionId = data.regionId;
    let regionName = (data.region || data.Region || '').trim();
    if ((!regionId || regionId === '' || regionId === null) && regionName) {
      const allRegions = await prisma.region.findMany();
      console.log('Searching for region:', regionName);
      console.log('Available regions:', allRegions.map(r => r.name));
      // Case-insensitive, trimmed lookup
      const region = await prisma.region.findFirst({
        where: {
          name: {
            equals: regionName,
            mode: 'insensitive'
          }
        }
      });
      if (region) {
        regionId = region.id;
      } else {
        return res.status(400).json({ error: `Region not found: "${regionName}"` });
      }
    }
    delete data.regionId;
    delete data.region;
    delete data.Region;
    if (!regionId) {
      return res.status(400).json({ error: `Region not found or not provided: "${regionName}"` });
    }

    // Ensure date fields are valid or null
    const safeData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isIndefinite: typeof data.isIndefinite === 'boolean' ? data.isIndefinite : false,
    };

    const point = await prisma.point.create({
      data: {
        ...safeData,
        region: { connect: { id: regionId } }
      },
      include: {
        region: true
      }
    });
    res.status(201).json(point);
  } catch (error) {
    res.status(400).json({ error: 'Błąd zapisu punktu: ' + error.message });
  }
});

// Update point
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = { ...req.body };
    
    const point = await prisma.point.update({
      where: { id },
      data,
      include: {
        region: true
      }
    });
    res.json(point);
  } catch (error) {
    res.status(400).json({ error: 'Błąd zapisu punktu: ' + error.message });
  }
});

// Delete point
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.point.delete({ where: { id } });
    res.json({ message: 'Punkt usunięty' });
  } catch (error) {
    res.status(400).json({ error: 'Błąd usuwania punktu: ' + error.message });
  }
});

// Get all fractions for a point
router.get('/:id/fractions', async (req, res) => {
  try {
    const pointId = Number(req.params.id);
    if (isNaN(pointId)) return res.status(400).json({ error: 'Invalid point ID' });
    const pointFractions = await prisma.pointFraction.findMany({
      where: { pointId },
      include: { fraction: true },
    });
    res.json(pointFractions);
  } catch (error) {
    console.error('Error saving fractions:', error); // <--- ADD THIS LINE
    res.status(400).json({ error: error.message });
  }
});

// Assign/update fractions for a point (replace all)
router.put('/:id/fractions', async (req, res) => {
  try {
    const pointId = Number(req.params.id);
    const { fractions } = req.body; // array of { fractionId, volume, frequency, containerType }
    if (!Array.isArray(fractions)) {
      return res.status(400).json({ error: 'fractions must be an array' });
    }
    // Remove all existing fractions for this point
    await prisma.pointFraction.deleteMany({ where: { pointId } });
    // Add new ones
    const created = await Promise.all(fractions.map(f =>
      prisma.pointFraction.create({
        data: {
          pointId,
          fractionId: Number(f.fractionId),
          volume: f.volume,
          frequency: f.frequency,
          containerType: f.containerType,
          od: f.od ? new Date(f.od) : null,
          do: f.do ? new Date(f.do) : null,
        },
      })
    ));
    res.json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Total points
router.get('/stats/total', async (req, res) => {
  try {
    const count = await prisma.point.count();
    res.json({ total: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Active zones (regions with at least one point)
router.get('/stats/active-zones', async (req, res) => {
  try {
    const activeZones = await prisma.point.findMany({
      select: { regionId: true },
      where: { regionId: { not: null } },
      distinct: ['regionId']
    });
    res.json({ activeZones: activeZones.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 