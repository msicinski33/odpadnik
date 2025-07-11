const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const municipalities = await prisma.municipality.findMany();
    res.json(municipalities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 