const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all fractions
router.get('/', async (req, res) => {
  try {
    const fractions = await prisma.fraction.findMany();
    res.json(fractions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fraction by ID
router.get('/:id', async (req, res) => {
  try {
    const fraction = await prisma.fraction.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!fraction) return res.status(404).json({ error: 'Fraction not found' });
    res.json(fraction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create fraction
router.post('/', async (req, res) => {
  try {
    const fraction = await prisma.fraction.create({
      data: req.body,
    });
    res.status(201).json(fraction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update fraction
router.put('/:id', async (req, res) => {
  try {
    const fraction = await prisma.fraction.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(fraction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete fraction
router.delete('/:id', async (req, res) => {
  try {
    await prisma.fraction.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 