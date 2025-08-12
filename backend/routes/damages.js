const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all damages for an employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const damages = await prisma.employeeDamage.findMany({
      where: { employeeId: parseInt(employeeId) },
      orderBy: { date: 'desc' }
    });
    res.json(damages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new damage record
router.post('/', async (req, res) => {
  try {
    const { employeeId, date, description, estimatedCost, supervisor } = req.body;
    const damage = await prisma.employeeDamage.create({
      data: {
        employeeId: parseInt(employeeId),
        date: new Date(date),
        description,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        supervisor
      }
    });
    res.json(damage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a damage record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, estimatedCost, supervisor } = req.body;
    const damage = await prisma.employeeDamage.update({
      where: { id: parseInt(id) },
      data: {
        date: new Date(date),
        description,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        supervisor
      }
    });
    res.json(damage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a damage record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.employeeDamage.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Damage record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 