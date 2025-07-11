const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/work-card/:employeeId?month=YYYY-MM
router.get('/:employeeId', async (req, res) => {
  try {
    const { month } = req.query;
    const employeeId = Number(req.params.employeeId);
    if (!month) return res.status(400).json({ error: 'Month required (YYYY-MM)' });
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const entries = await prisma.workCardEntry.findMany({
      where: {
        employeeId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
      include: { absenceType: true },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/work-card/:employeeId?month=YYYY-MM
// Accepts: [{ day, actualFrom, actualTo, actualTotal, absenceTypeId, onCall }]
router.post('/:employeeId', async (req, res) => {
  try {
    const { month } = req.query;
    const employeeId = Number(req.params.employeeId);
    const entries = req.body.entries;
    if (!month) return res.status(400).json({ error: 'Month required (YYYY-MM)' });
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'Entries array required' });
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const results = [];
    for (const e of entries) {
      console.log('DEBUG workCardEntry:', { month, day: e.day, entry: e });
      const date = new Date(`${month}-${String(e.day).padStart(2, '0')}T00:00:00.000Z`);
      const data = {
        employeeId,
        date,
        actualFrom: e.actualFrom || null,
        actualTo: e.actualTo || null,
        actualTotal: e.actualTotal || null,
        absenceTypeId: e.absenceTypeId || null,
        onCall: !!e.onCall,
      };
      const existing = await prisma.workCardEntry.findUnique({ where: { employeeId_date: { employeeId, date } } });
      if (existing) {
        const updated = await prisma.workCardEntry.update({ where: { id: existing.id }, data });
        results.push(updated);
      } else {
        const created = await prisma.workCardEntry.create({ data });
        results.push(created);
      }
    }
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 