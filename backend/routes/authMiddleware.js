const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Role-based permissions
// Define permissions in the form of module:action, e.g., 'employees:read', 'employees:create'
// Special wildcard '*' grants access to everything
const ROLE_PERMISSIONS = {
  admin: ['*'],
  dyspozytor: [
    'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
    'workorders:read', 'dailyAssignments:read', 'calendar:read',
    'oneTimeOrders:read', 'debrisBagOrders:read', 'damages:read'
  ],
  bok: [
    'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
    'oneTimeOrders:read', 'oneTimeOrders:create',
    'debrisBagOrders:read', 'debrisBagOrders:create'
  ],
  kierownik: [
    'monthlyPlan:read', 'workCard:read', 'trasowka:read',
    'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
    'workorders:read', 'dailyAssignments:read', 'calendar:read'
  ],
  specjalista: [
    'monthlyPlan:read', 'workCard:read', 'trasowka:read',
    'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
    'workorders:read', 'dailyAssignments:read', 'calendar:read'
  ],
  koordynator: [
    'employees:read', 'employees:update',
    'vehicles:read', 'vehicles:update',
    'regions:read', 'regions:update',
    'points:read', 'points:update',
    'fractions:read', 'fractions:update',
    'workorders:read', 'workorders:create', 'workorders:update',
    'dailyAssignments:read', 'dailyAssignments:update',
    'oneTimeOrders:read', 'oneTimeOrders:create', 'oneTimeOrders:update',
    'debrisBagOrders:read', 'debrisBagOrders:create', 'debrisBagOrders:update',
    'damages:read', 'damages:create', 'damages:update',
    'users:read'
  ],
  pracownik_biurowy: [
    'employees:read',
    'vehicles:read',
    'regions:read',
    'points:read',
    'fractions:read',
    'workorders:read',
    'dailyAssignments:read',
    'oneTimeOrders:read', 'oneTimeOrders:create', 'oneTimeOrders:update',
    'debrisBagOrders:read', 'debrisBagOrders:create', 'debrisBagOrders:update',
    'damages:read'
  ],
  kierowca: [
    'workorders:read', 'workorders:update',
    'oneTimeOrders:read', 'oneTimeOrders:update',
    'debrisBagOrders:read', 'debrisBagOrders:update',
    'damages:create',
    'dailyAssignments:read'
  ],
  viewer: [
    'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
    'workorders:read', 'oneTimeOrders:read', 'debrisBagOrders:read', 'calendar:read', 'dailyAssignments:read'
  ]
};

// In-memory cache of dynamic permissions per role
const rolePermissionsCache = new Map(); // role(lowercase) -> Set of permission strings or '*' present

function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  // Prefer dynamic permissions if present on user
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    if (user.permissions.includes('*')) return true;
    const [module, action] = permission.split(':');
    if (user.permissions.includes(`${module}:*`)) return true;
    return user.permissions.includes(permission);
  }
  const allowed = ROLE_PERMISSIONS[user.role] || [];
  if (allowed.includes('*')) return true;
  // Support module wildcard like 'employees:*'
  const [module, action] = permission.split(':');
  if (allowed.includes(`${module}:*`)) return true;
  return allowed.includes(permission);
}

function authorize(requiredPermission) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!hasPermission(req.user, requiredPermission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Create a middleware that authorizes by HTTP method for a given module
// GET -> read, POST -> create, PUT/PATCH -> update, DELETE -> delete
function authorizeModule(moduleName) {
  return function (req, res, next) {
    const method = req.method.toUpperCase();
    let action;
    switch (method) {
      case 'GET':
        action = 'read';
        break;
      case 'POST':
        action = 'create';
        break;
      case 'PUT':
      case 'PATCH':
        action = 'update';
        break;
      case 'DELETE':
        action = 'delete';
        break;
      default:
        action = 'read';
    }
    const permission = `${moduleName}:${action}`;
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: 'Forbidden', required: permission, role: req.user?.role, permissions: req.user?.permissions || [] });
    }
    next();
  };
}

// Middleware to attach dynamic permissions to req.user if available in DB
async function attachPermissions(req, res, next) {
  try {
    if (!req.user || !req.user.id) return next();
    // Always fetch fresh role from DB to avoid stale JWT role after changes
    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
    if (!dbUser) return next();
    const effectiveRole = dbUser.role || req.user.role;
    req.user.role = effectiveRole; // override to the latest role from DB

    const roleKey = String(effectiveRole).toLowerCase();
    // Check cache first
    if (rolePermissionsCache.has(roleKey)) {
      req.user.permissions = Array.from(rolePermissionsCache.get(roleKey));
      return next();
    }
    // Try load from DB tables by exact name first
    let role = await prisma.role.findUnique({
      where: { name: effectiveRole },
      include: { rolePermissions: { include: { permission: true } } }
    });
    // For providers that don't support case-insensitive comparisons (e.g., sqlite),
    // do a manual case-insensitive match in JS as a fallback
    if (!role) {
      const allRoles = await prisma.role.findMany({ include: { rolePermissions: { include: { permission: true } } } });
      role = allRoles.find(r => String(r.name).toLowerCase() === roleKey);
    }
    if (role) {
      const perms = new Set();
      for (const rp of role.rolePermissions) {
        const p = rp.permission;
        perms.add(`${p.module}:${p.action}`);
      }
      rolePermissionsCache.set(roleKey, perms);
      req.user.permissions = Array.from(perms);
    } else {
      // No dynamic role config found; fall back to static mapping for this request
      const staticPerms = ROLE_PERMISSIONS[roleKey] || ROLE_PERMISSIONS[effectiveRole] || [];
      req.user.permissions = Array.from(staticPerms);
    }
    next();
  } catch (e) {
    // Silent fallback to static permissions
    try {
      const roleKey = String(req.user?.role || '').toLowerCase();
      const staticPerms = ROLE_PERMISSIONS[roleKey] || [];
      req.user.permissions = Array.from(staticPerms);
    } catch {}
    next();
  }
}

function invalidateRoleCache(roleName) {
  if (!roleName) return;
  rolePermissionsCache.delete(String(roleName).toLowerCase());
}

module.exports = { authenticateToken, requireAdmin, authorize, authorizeModule, ROLE_PERMISSIONS, attachPermissions, invalidateRoleCache };