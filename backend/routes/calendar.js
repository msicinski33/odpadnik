const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/calendar/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await prisma.calendarEntry.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        region: true,
        fraction: true,
      },
      orderBy: [
        { region: { name: 'asc' } },
        { fraction: { name: 'asc' } },
      ],
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calendar?regionId=...&month=YYYY-MM
router.get('/', async (req, res) => {
  try {
    const { regionId, month } = req.query;
    if (!regionId || !month) {
      return res.status(400).json({ error: 'regionId and month are required' });
    }
    // Parse month to get first and last day
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59, 999);
    const entries = await prisma.calendarEntry.findMany({
      where: {
        regionId: Number(regionId),
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        fraction: true,
      },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calendar
// Accepts: { regionId, fractionId, date } or array of such objects
router.post('/', async (req, res) => {
  try {
    const entries = Array.isArray(req.body) ? req.body : [req.body];
    const created = await Promise.all(entries.map(async (entry) => {
      return prisma.calendarEntry.create({
        data: {
          regionId: Number(entry.regionId),
          fractionId: Number(entry.fractionId),
          date: new Date(entry.date),
        },
      });
    }));
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/calendar/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.calendarEntry.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 