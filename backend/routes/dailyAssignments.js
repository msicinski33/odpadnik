const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/dailyAssignments?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const { date, type } = req.query;
  let where = {};
  if (date) {
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');
    where.date = { gte: start, lte: end };
  }
  if (type) where.type = type;
  const assignments = await prisma.dailyAssignment.findMany({
    where,
    include: {
      driver: true,
      assistants: { include: { employee: true } },
      vehicle: true,
      region: true,
      fractions: { include: { fraction: true } },
    },
  });
  res.json(assignments);
});

// POST /api/dailyAssignments
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    console.log('Received data for new assignment:', data); // Log incoming data
    const validAssistants = (data.assistants || []).filter(a => a && (a.employee?.id || a.employee));
    // Remove fractions for non-bezpylne types to avoid Prisma errors
    if (data.type !== 'bezpylne' && data.fractions) {
      delete data.fractions;
    }
    // Build assignment data, only include regionId and fractions for bezpylne
    const assignmentData = {
      date: data.date,
      type: data.type,
      shift: data.shift,
      driverId: data.driver?.id || data.driver,
      vehicleId: data.vehicle?.id || data.vehicle,
      municipalityId: data.municipalityId || data.municipality?.id,
      assistants: {
        create: validAssistants.map(a => ({ employeeId: a.employee?.id || a.employee })),
      },
      equipment: data.equipment,
      workType: data.workType,
    };
    if (data.type === 'bezpylne') {
      if (data.region?.id || data.region) {
        assignmentData.regionId = data.region?.id || data.region;
      }
      const validFractions = (data.fractions || []).filter(f => f && (f.fraction?.id || f.fraction));
      if (validFractions.length > 0) {
        assignmentData.fractions = {
          create: validFractions.map(f => ({ fractionId: f.fraction?.id || f.fraction })),
        };
      }
    }
    // Usuń undefined z assignmentData
    Object.keys(assignmentData).forEach(key => {
      if (assignmentData[key] === undefined) delete assignmentData[key];
    });
    const assignment = await prisma.dailyAssignment.create({
      data: assignmentData,
      include: {
        driver: true,
        assistants: { include: { employee: true } },
        vehicle: true,
        region: true,
        fractions: { include: { fraction: true } },
        municipality: true,
        equipment: true,
        workType: true,
      },
    });
    console.log('Assignment saved:', assignment); // Log saved assignment
    res.json(assignment);
  } catch (err) {
    console.error('Error creating daily assignment:', err); // Log error
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/dailyAssignments/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const data = req.body;
  // Remove old assistants/fractions
  await prisma.dailyAssignmentAssistant.deleteMany({ where: { dailyAssignmentId: id } });
  await prisma.dailyAssignmentFraction.deleteMany({ where: { dailyAssignmentId: id } });
  const validAssistants = (data.assistants || []).filter(a => a && (a.employee?.id || a.employee));
  const updateData = {
    shift: data.shift,
    driverId: data.driver?.id || data.driver,
    vehicleId: data.vehicle?.id || data.vehicle,
    municipalityId: data.municipalityId || data.municipality?.id,
    assistants: {
      create: validAssistants.map(a => ({ employeeId: a.employee?.id || a.employee })),
    },
    equipment: data.equipment,
    workType: data.workType,
  };
  if (data.type === 'bezpylne') {
    if (data.region?.id || data.region) {
      updateData.regionId = data.region?.id || data.region;
    }
    const validFractions = (data.fractions || []).filter(f => f && (f.fraction?.id || f.fraction));
    if (validFractions.length > 0) {
      updateData.fractions = {
        create: validFractions.map(f => ({ fractionId: f.fraction?.id || f.fraction })),
      };
    }
  }
  // Usuń undefined z updateData
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) delete updateData[key];
  });
  const assignment = await prisma.dailyAssignment.update({
    where: { id },
    data: updateData,
    include: {
      driver: true,
      assistants: { include: { employee: true } },
      vehicle: true,
      region: true,
      fractions: { include: { fraction: true } },
      municipality: true,
      equipment: true,
      workType: true,
    },
  });
  res.json(assignment);
});

// DELETE /api/dailyAssignments/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.dailyAssignmentAssistant.deleteMany({
      where: { dailyAssignmentId: id }
    });
    await prisma.dailyAssignmentFraction.deleteMany({
      where: { dailyAssignmentId: id }
    });
    await prisma.dailyAssignment.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(400).json({ error: err.message });
  }
});

// Reserve a resource (employee or vehicle) for a date/type
// POST /api/dailyAssignments/reserve-resource
router.post('/reserve-resource', (req, res) => {
  const { date, type, resourceType, id } = req.body;
  if (!date || !type || !resourceType || !id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const app = req.app;
  const resourceLocks = app.get('resourceLocks');
  const reserveResource = app.get('reserveResource');
  // Check if already locked
  if (resourceLocks[date] && resourceLocks[date][resourceType] && resourceLocks[date][resourceType].has(id)) {
    return res.status(409).json({ error: 'Resource already reserved' });
  }
  reserveResource(date, type, resourceType, id);
  // Emit event
  const io = app.get('io');
  io.emit('resourceReserved', { date, type, resourceType, id });
  res.json({ status: 'OK' });
});

// Release a resource
// POST /api/dailyAssignments/release-resource
router.post('/release-resource', (req, res) => {
  const { date, type, resourceType, id } = req.body;
  if (!date || !type || !resourceType || !id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const app = req.app;
  const releaseResource = app.get('releaseResource');
  releaseResource(date, type, resourceType, id);
  // Emit event
  const io = app.get('io');
  io.emit('resourceReleased', { date, type, resourceType, id });
  res.json({ status: 'OK' });
});

// Get current locks for a date
// GET /api/dailyAssignments/locks?date=YYYY-MM-DD
router.get('/locks', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date is required' });
  const app = req.app;
  const resourceLocks = app.get('resourceLocks');
  res.json(resourceLocks[date] || { employees: [], vehicles: [] });
});

router.get('/api/municipalities', async (req, res) => {
  try {
    const municipalities = await prisma.municipality.findMany();
    res.json(municipalities);
  } catch (err) {
    console.error('Error fetching municipalities:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 