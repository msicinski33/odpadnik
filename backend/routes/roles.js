const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, requireAdmin } = require('./authMiddleware');
const { invalidateRoleCache } = require('./authMiddleware');

// All routes here are admin-only
router.use(authenticateToken, requireAdmin);

// List roles with permissions
router.get('/', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.rolePermissions.map(rp => ({ id: rp.permission.id, module: rp.permission.module, action: rp.permission.action }))
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create role
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const role = await prisma.role.create({ data: { name, description } });
    res.status(201).json(role);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update role
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;
    const role = await prisma.role.update({ where: { id }, data: { name, description } });
    invalidateRoleCache(role.name);
    res.json(role);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete role
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const role = await prisma.role.delete({ where: { id } });
    invalidateRoleCache(role.name);
    res.status(204).end();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List all permissions (catalog)
router.get('/permissions/all', async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
    res.json(permissions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Upsert permission (module+action)
router.post('/permissions', async (req, res) => {
  try {
    const { module, action } = req.body;
    const permission = await prisma.permission.upsert({
      where: { module_action: { module, action } },
      update: {},
      create: { module, action }
    });
    res.status(201).json(permission);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Assign permissions to role (replace set)
router.put('/:id/permissions', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { permissions } = req.body; // array of { module, action }
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    // Ensure permissions exist
    const created = [];
    for (const p of permissions) {
      const perm = await prisma.permission.upsert({
        where: { module_action: { module: p.module, action: p.action } },
        update: {},
        create: { module: p.module, action: p.action }
      });
      created.push(perm);
    }
    // Replace role permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.rolePermission.createMany({
      data: created.map(p => ({ roleId: id, permissionId: p.id }))
    });
    invalidateRoleCache(role.name);
    res.json({ message: 'Permissions updated' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;


