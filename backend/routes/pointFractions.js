const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all fraction assignments for a point
router.get('/points/:pointId/fractions', async (req, res) => {
  try {
    const pointId = Number(req.params.pointId);
    if (isNaN(pointId)) return res.status(400).json({ error: 'Invalid point ID' });
    const pointFractions = await prisma.pointFraction.findMany({
      where: { pointId },
      include: { fraction: true },
    });
    res.json(pointFractions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new fraction assignment to a point
router.post('/points/:pointId/fractions', async (req, res) => {
  try {
    const pointId = Number(req.params.pointId);
    const { fractionId, containerSize, pickupFrequency } = req.body;
    if (!fractionId || !containerSize || !pickupFrequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const created = await prisma.pointFraction.create({
      data: {
        pointId,
        fractionId: Number(fractionId),
        containerSize,
        pickupFrequency,
      },
      include: { fraction: true },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a fraction assignment
router.put('/point-fractions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fractionId, containerSize, pickupFrequency } = req.body;
    const updated = await prisma.pointFraction.update({
      where: { id },
      data: {
        fractionId: fractionId ? Number(fractionId) : undefined,
        containerSize,
        pickupFrequency,
      },
      include: { fraction: true },
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a fraction assignment
router.delete('/point-fractions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.pointFraction.delete({ where: { id } });
    res.json({ message: 'Fraction assignment deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 