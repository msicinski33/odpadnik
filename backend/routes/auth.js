const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin } = require('./authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register (admin only)
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { ...rest, password: hashedPassword },
    });
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ error: 'Konto zostało zablokowane. Skontaktuj się z administratorem.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 