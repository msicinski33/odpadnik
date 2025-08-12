import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple RBAC helper for frontend UI visibility
// permissions use format module:action, e.g. 'employees:read'
export function hasPermission(user, permission) {
  if (!user) return false;
  // Prefer dynamic permissions provided from backend
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    if (user.permissions.includes('*')) return true;
    const [module, action] = permission.split(':');
    if (user.permissions.includes(`${module}:*`)) return true;
    return user.permissions.includes(permission);
  }

  const role = user.role;
  if (!role) return false;

  // Mirror of backend ROLE_PERMISSIONS. Keep in sync.
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

  const allowed = ROLE_PERMISSIONS[role] || [];
  if (allowed.includes('*')) return true;
  const [module, action] = permission.split(':');
  if (allowed.includes(`${module}:*`)) return true;
  return allowed.includes(permission);
}