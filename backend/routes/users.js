const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, requireAdmin } = require('./authMiddleware');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');

// Multer setup for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}${ext}`);
  },
});
const upload = multer({ storage });

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Avatar upload endpoint
router.post('/me/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Password change endpoint
router.put('/me/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Example: admin-only route
router.get('/admin-only', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  res.json({ message: 'Welcome, admin!' });
});

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        avatarUrl: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role, isActive } = req.body;
    
    // Prevent admin from deactivating themselves
    if (userId === req.user.id && isActive === false) {
      return res.status(400).json({ error: 'Nie możesz zablokować własnego konta' });
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, role, isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        avatarUrl: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
    }
    
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Użytkownik usunięty' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 