const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all employees
router.get('/', async (req, res) => {
  try {
    // Explicitly select all relevant fields, including position
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        position: true,
        phone: true,
        email: true,
        hiredAt: true,
        terminatedAt: true,
        notes: true,
        hasDisabilityCertificate: true,
        workHours: true,
        overtimeAllowed: true,
        nightShiftAllowed: true
      }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
router.post('/', async (req, res) => {
  try {
    const employee = await prisma.employee.create({
      data: req.body,
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get an employee's schedule for a given month
router.get('/:id/schedule', async (req, res) => {
  try {
    const { month } = req.query; // format: YYYY-MM
    if (!month) return res.status(400).json({ error: 'Month required (YYYY-MM)' });
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const schedule = await prisma.employeeSchedule.findMany({
      where: {
        employeeId: Number(req.params.id),
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
    });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign or update shifts for a month
router.post('/:id/schedule', async (req, res) => {
  try {
    const { shifts } = req.body; // [{ date: 'YYYY-MM-DD', shift: '6-14', customHours, colorCode }]
    const employeeId = Number(req.params.id);
    if (!Array.isArray(shifts)) return res.status(400).json({ error: 'Shifts array required' });
    const results = [];
    for (const s of shifts) {
      const date = new Date(s.date + 'T00:00:00.000Z');
      const existing = await prisma.employeeSchedule.findFirst({ where: { employeeId, date } });
      if (existing) {
        // Update
        const updated = await prisma.employeeSchedule.update({
          where: { id: existing.id },
          data: { shift: s.shift, customHours: s.customHours, colorCode: s.colorCode },
        });
        results.push(updated);
      } else {
        // Create
        const created = await prisma.employeeSchedule.create({
          data: { employeeId, date, shift: s.shift, customHours: s.customHours, colorCode: s.colorCode },
        });
        results.push(created);
      }
    }
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all employees scheduled for a specific date
router.get('/schedule/by-date', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date required (YYYY-MM-DD)' });
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');
    const schedules = await prisma.employeeSchedule.findMany({
      where: { date: { gte: start, lte: end } },
      include: { employee: true },
      orderBy: { employeeId: 'asc' },
    });
    // Return array of { id, name, surname, position, shift }
    const result = schedules.map(s => ({
      id: s.employee.id,
      name: s.employee.name,
      surname: s.employee.surname,
      position: s.employee.position,
      shift: s.shift,
      customHours: s.customHours,
      colorCode: s.colorCode,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 