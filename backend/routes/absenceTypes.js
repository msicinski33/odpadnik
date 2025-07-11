const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all absence types
router.get('/', async (req, res) => {
  try {
    const types = await prisma.rodzajAbsencji.findMany();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get one absence type by id
router.get('/:id', async (req, res) => {
  try {
    const type = await prisma.rodzajAbsencji.findUnique({ where: { id: Number(req.params.id) } });
    if (!type) return res.status(404).json({ error: 'Not found' });
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new absence type
router.post('/', async (req, res) => {
  try {
    const type = await prisma.rodzajAbsencji.create({ data: req.body });
    res.status(201).json(type);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update absence type
router.put('/:id', async (req, res) => {
  try {
    const type = await prisma.rodzajAbsencji.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(type);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete absence type
router.delete('/:id', async (req, res) => {
  try {
    await prisma.rodzajAbsencji.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 