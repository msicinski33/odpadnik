const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /workorders?type=TYPE&executionDate=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { type, executionDate } = req.query;
    let where = {};
    if (type) where.type = type;
    if (executionDate) {
      const date = new Date(executionDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      where.executionDate = { gte: date, lt: nextDay };
    }
    const workOrders = await prisma.workOrder.findMany({ where, orderBy: { executionDate: 'asc' } });
    res.json(workOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /workorders
router.post('/', async (req, res) => {
  try {
    console.log('POST /workorders body:', req.body);
    const data = req.body;
    // Map 'uwagi' to 'notes' if present
    if (data.uwagi !== undefined) {
      data.notes = data.uwagi;
      delete data.uwagi;
    }
    // Do not set description for new work orders
    delete data.description;
    // --- Worki gruzowe validation ---
    if (data.type === 'worki') {
      // Accept new fields
      const { quantity, orderNumber, bagNumber, realizationDate, completed } = data;
      if (completed === true || completed === 'true') {
        if (!realizationDate) {
          return res.status(400).json({ error: 'realizationDate is required when type is "worki" and completed is true.' });
        }
      }
    }
    // --- Usługi, Bramy: accept kontener field ---
    if (data.type !== 'uslugi' && data.type !== 'bramy') {
      delete data.kontener;
    }
    // --- Bezpylne: accept zlecenie field ---
    if (data.type !== 'bezpylne') {
      delete data.zlecenie;
    }
    const workOrder = await prisma.workOrder.create({ data });
    res.status(201).json(workOrder);
  } catch (err) {
    console.error('Error creating work order:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /workorders/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // If updating failure reason, set only failureReason
    if (data.cause !== undefined) {
      data.failureReason = data.cause;
      delete data.cause;
    }
    // Do not update description on status change
    delete data.description;
    // --- Worki gruzowe validation ---
    if (data.type === 'worki') {
      const { quantity, orderNumber, bagNumber, realizationDate, completed } = data;
      if (completed === true || completed === 'true') {
        if (!realizationDate) {
          return res.status(400).json({ error: 'realizationDate is required when type is "worki" and completed is true.' });
        }
      }
    }
    // --- Usługi, Bramy: accept kontener field ---
    if (data.type !== 'uslugi' && data.type !== 'bramy') {
      delete data.kontener;
    }
    // --- Bezpylne: accept zlecenie field ---
    if (data.type !== 'bezpylne') {
      delete data.zlecenie;
    }
    const workOrder = await prisma.workOrder.update({ where: { id: Number(id) }, data });
    res.json(workOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /workorders/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.workOrder.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') {
      // Record not found
      res.status(404).json({ error: 'Work order not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router; 