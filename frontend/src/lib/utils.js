import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple RBAC helper for frontend UI visibility
// permissions use format module:action, e.g. 'employees:read'
export function hasPermission(user, permission) {
  if (!user) return false;
  
  // Admin users have access to everything
  if (user.role === 'admin') return true;
  
  // If permissions are not loaded yet, use role-based fallback for better UX
  if (!Array.isArray(user.permissions) || user.permissions.length === 0) {
    // Fallback to role-based permissions for common actions
    if (user.role) {
      const rolePermissions = getRoleBasedPermissions(user.role);
      if (rolePermissions.includes('*')) return true;
      
      const [module, action] = permission.split(':');
      if (rolePermissions.includes(`${module}:*`)) return true;
      
      const hasPerm = rolePermissions.includes(permission);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Permission check: ${permission} = ${hasPerm} (fallback to role-based)`);
      }
      return hasPerm;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Permission check: ${permission} = false (no user role)`);
    }
    return false;
  }
  
  // Use dynamic permissions from backend
  if (user.permissions.includes('*')) return true;
  const [module, action] = permission.split(':');
  if (user.permissions.includes(`${module}:*`)) return true;
  const hasPerm = user.permissions.includes(permission);
  if (process.env.NODE_ENV === 'development') {
    console.log(`Permission check: ${permission} = ${hasPerm} (from backend)`);
  }
  return hasPerm;
}

// Fallback role-based permissions (matches backend ROLE_PERMISSIONS)
function getRoleBasedPermissions(role) {
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
      'monthlyPlan:read', 'workCard:read', 'trasowka:read',
      'employees:read', 'vehicles:read', 'regions:read', 'points:read', 'fractions:read',
      'workorders:read', 'dailyAssignments:read', 'calendar:read', 'absenceTypes:read',
      'leavePlanning:read', 'leavePlanning:create', 'leavePlanning:update',
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
      'users:read', 'absenceTypes:read', 'absenceTypes:create', 'absenceTypes:update', 'absenceTypes:delete',
      'containers:read', 'containers:create', 'containers:update', 'containers:delete'
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
  
  return ROLE_PERMISSIONS[role.toLowerCase()] || [];
}