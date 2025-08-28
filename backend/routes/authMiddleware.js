const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Role-based permissions
// Define permissions in the form of module:action, e.g., 'employees:read', 'employees:create'
// Special wildcard '*' grants access to everything
const ROLE_PERMISSIONS = {
  admin: ['*'],
  dyspozytor: [
    'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
    'workorders:read', 'dailyAssignments:read', 'calendar:read',
    'oneTimeOrders:read', 'debrisBagOrders:read', 'damages:read', 'absenceTypes:read',
    'containers:read', 'containers:create', 'containers:update', 'containers:delete',
    'scheduleChanges:read', 'scheduleChanges:create', 'scheduleChanges:approve', 'scheduleChanges:read_all',
    'winterAction:read', 'winterAction:create', 'winterAction:update',
    'winterVehicles:read', 'winterVehicles:create', 'winterVehicles:update',
    'winterVehicleStatus:read', 'winterVehicleStatus:create', 'winterVehicleStatus:update',
    'winterRoutes:read', 'winterRoutes:create', 'winterRoutes:update',
    'winterDailyPlan:read', 'winterDailyPlan:create', 'winterDailyPlan:update',
    'winterMaterials:read', 'winterMaterials:create', 'winterMaterials:update',
    'winterSidewalks:read', 'winterSidewalks:create', 'winterSidewalks:update',
    'winterBusStops:read', 'winterBusStops:create', 'winterBusStops:update',
    'winterRoadInventory:read', 'winterRoadInventory:create', 'winterRoadInventory:update'
  ],
  bok: [
    
    'oneTimeOrders:read', 'oneTimeOrders:create',
    'debrisBagOrders:read', 'debrisBagOrders:create',
    'containers:read', 'containers:create', 'containers:update', 'containers:delete'
  ],
  kierownik: [
    'monthlyPlan:read', 'workCard:read', 'trasowka:read',
    'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
    'workorders:read', 'dailyAssignments:read', 'calendar:read', 'absenceTypes:read',
    'leavePlanning:read', 'leavePlanning:create', 'leavePlanning:update',
    'containers:read', 'containers:create', 'containers:update', 'containers:delete',
    'scheduleChanges:read', 'scheduleChanges:create', 'scheduleChanges:update',
    'scheduleChanges:approve', 'scheduleChanges:auto_approve', 'scheduleChanges:read_all',
    'winterAction:read', 'winterAction:create', 'winterAction:update', 'winterAction:delete',
    'winterVehicles:read', 'winterVehicles:create', 'winterVehicles:update', 'winterVehicles:delete',
    'winterVehicleStatus:read', 'winterVehicleStatus:create', 'winterVehicleStatus:update', 'winterVehicleStatus:delete',
    'winterRoutes:read', 'winterRoutes:create', 'winterRoutes:update', 'winterRoutes:delete',
    'winterDailyPlan:read', 'winterDailyPlan:create', 'winterDailyPlan:update', 'winterDailyPlan:delete',
    'winterMaterials:read', 'winterMaterials:create', 'winterMaterials:update', 'winterMaterials:delete',
    'winterSidewalks:read', 'winterSidewalks:create', 'winterSidewalks:update', 'winterSidewalks:delete',
    'winterBusStops:read', 'winterBusStops:create', 'winterBusStops:update', 'winterBusStops:delete',
    'winterRoadInventory:read', 'winterRoadInventory:create', 'winterRoadInventory:update', 'winterRoadInventory:delete'
  ],
  specjalista: [
    'employees:read', 'employees:create', 'employees:update',
    'vehicles:read', 'vehicles:update',
    'regions:read', 'regions:update',
    'points:read', 'points:update',
    'fractions:read', 'fractions:update',
    'workorders:read', 'workorders:create', 'workorders:update',
    'dailyAssignments:read', 'dailyAssignments:update',
    'oneTimeOrders:read', 'oneTimeOrders:create', 'oneTimeOrders:update',
    'debrisBagOrders:read', 'debrisBagOrders:create', 'debrisBagOrders:update',
    'damages:read', 'damages:create', 'damages:update',
    'users:read', 'absenceTypes:read', 'absenceTypes:create', 'absenceTypes:update', 'absenceTypes:delete',
    'containers:read', 'containers:create', 'containers:update', 'containers:delete',
    'scheduleChanges:read', 'scheduleChanges:create', 'scheduleChanges:approve', 'scheduleChanges:read_all',
    'winterAction:read', 'winterAction:create', 'winterAction:update',
    'winterVehicles:read', 'winterVehicles:create', 'winterVehicles:update', 'winterVehicles:delete',
    'winterVehicleStatus:read', 'winterVehicleStatus:create', 'winterVehicleStatus:update',
    'winterRoutes:read', 'winterRoutes:create', 'winterRoutes:update',
    'winterDailyPlan:read', 'winterDailyPlan:create', 'winterDailyPlan:update',
    'winterMaterials:read', 'winterMaterials:create', 'winterMaterials:update',
    'winterSidewalks:read', 'winterSidewalks:create', 'winterSidewalks:update',
    'winterBusStops:read', 'winterBusStops:create', 'winterBusStops:update',
    'winterRoadInventory:read', 'winterRoadInventory:create', 'winterRoadInventory:update'
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
    'damages:read', 'absenceTypes:read',
    'containers:read', 'containers:create', 'containers:update', 'containers:delete',
    'scheduleChanges:read', 'scheduleChanges:create',
    'winterAction:read',
    'winterVehicles:read',
    'winterVehicleStatus:read',
    'winterRoutes:read',
    'winterDailyPlan:read',
    'winterMaterials:read',
    'winterSidewalks:read',
    'winterBusStops:read',
    'winterRoadInventory:read'
  ],
  kierowca: [
    'workorders:read', 'workorders:update',
    'oneTimeOrders:read', 'oneTimeOrders:update',
    'debrisBagOrders:read', 'debrisBagOrders:update',
    'damages:create',
    'dailyAssignments:read', 'absenceTypes:read',
    'containers:read',
    'scheduleChanges:read', 'scheduleChanges:create',
    'winterAction:read',
    'winterVehicles:read',
    'winterVehicleStatus:read', 'winterVehicleStatus:create',
    'winterRoutes:read',
    'winterDailyPlan:read',
    'winterMaterials:read', 'winterMaterials:create'
  ],
  viewer: [
    'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
    'workorders:read', 'oneTimeOrders:read', 'debrisBagOrders:read', 'calendar:read', 'dailyAssignments:read',
    'absenceTypes:read',
    'containers:read',
    'scheduleChanges:read',
    'winterAction:read',
    'winterVehicles:read',
    'winterVehicleStatus:read',
    'winterRoutes:read',
    'winterDailyPlan:read',
    'winterMaterials:read',
    'winterSidewalks:read',
    'winterBusStops:read',
    'winterRoadInventory:read'
  ]
};

// In-memory cache of dynamic permissions per role
const rolePermissionsCache = new Map(); // role(lowercase) -> Set of permission strings or '*' present

// Function to clear cache for a specific role (useful when permissions are updated)
function clearRoleCache(roleName) {
  if (roleName) {
    rolePermissionsCache.delete(roleName.toLowerCase());
    console.log(`[CACHE] Cleared cache for role: ${roleName}`);
  } else {
    rolePermissionsCache.clear();
    console.log(`[CACHE] Cleared all role caches`);
  }
}

function hasPermission(user, permission) {
  if (!user || !user.role) {
    return false;
  }
  
  // Admin users have access to everything
  if (user.role === 'admin') {
    return true;
  }
  
  // Temporary override for containers permissions - allow all authenticated users
  if (permission.startsWith('containers:')) {
    return true;
  }
  
  // Prefer dynamic permissions if present on user
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    if (user.permissions.includes('*')) {
      return true;
    }
    const [module, action] = permission.split(':');
    if (user.permissions.includes(`${module}:*`)) {
      return true;
    }
    return user.permissions.includes(permission);
  }
  
  // Fallback to static permissions from ROLE_PERMISSIONS
  const roleName = user.role.toLowerCase(); // Convert to lowercase for consistent lookup
  const allowed = ROLE_PERMISSIONS[roleName] || [];
  
  if (allowed.includes('*')) return true;
  
  // Support module wildcard like 'employees:*'
  const [module, action] = permission.split(':');
  if (allowed.includes(`${module}:*`)) return true;
  
  return allowed.includes(permission);
}

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
      return res.status(403).json({ error: `Forbidden: ${permission} required` });
    }
    next();
  };
}

// Middleware to attach permissions to req.user
async function attachPermissions(req, res, next) {
  try {
    if (!req.user || !req.user.role) {
      return next();
    }
    
    // Check if we have cached permissions for this role
    const roleKey = req.user.role.toLowerCase();
    if (rolePermissionsCache.has(roleKey)) {
      req.user.permissions = rolePermissionsCache.get(roleKey);
      return next();
    }
    
    // Use static permissions by default (much faster)
    const roleName = req.user.role.toLowerCase(); // Convert to lowercase for consistent lookup
    const staticPermissions = ROLE_PERMISSIONS[roleName] || [];
    req.user.permissions = staticPermissions;
    rolePermissionsCache.set(roleKey, staticPermissions);
    
    // Only query database for additional permissions if needed (async, don't wait)
    if (process.env.NODE_ENV === 'development' || process.env.LOAD_DB_PERMISSIONS === 'true') {
      // Load database permissions in background, don't block the request
      loadDatabasePermissions(req.user.role, roleKey).catch(console.error);
    }
    
    next();
  } catch (error) {
    console.error('Error in attachPermissions:', error);
    // Fallback to static permissions if anything fails
    const roleName = req.user.role ? req.user.role.toLowerCase() : '';
    req.user.permissions = ROLE_PERMISSIONS[roleName] || [];
    next();
  }
}

// Load database permissions in background (non-blocking)
async function loadDatabasePermissions(roleName, roleKey) {
  try {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
      include: { 
        rolePermissions: { 
          include: { permission: true } 
        } 
      }
    });
    
    if (role && role.rolePermissions && role.rolePermissions.length > 0) {
      const permissions = role.rolePermissions.map(rp => 
        `${rp.permission.module}:${rp.permission.action}`
      );
      
      // Update cache with database permissions
      rolePermissionsCache.set(roleKey, permissions);
      console.log(`[PERMISSIONS] Updated ${roleName} with ${permissions.length} database permissions`);
    }
  } catch (error) {
    console.error(`Error loading database permissions for ${roleName}:`, error);
  }
}

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  hasPermission, 
  authorize, 
  authorizeModule, 
  attachPermissions,
  clearRoleCache
}; 