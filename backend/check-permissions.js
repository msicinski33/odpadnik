const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndSeedPermissions() {
  try {
    console.log('Checking existing permissions...');
    
    // Check existing permissions
    const existingPermissions = await prisma.permission.findMany();
    console.log('Existing permissions:', existingPermissions.length);
    
    if (existingPermissions.length === 0) {
      console.log('No permissions found. Creating basic permissions...');
      
      // Define basic permissions
      const basicPermissions = [
        // Employees
        { module: 'employees', action: 'read' },
        { module: 'employees', action: 'create' },
        { module: 'employees', action: 'update' },
        { module: 'employees', action: 'delete' },
        
        // Vehicles
        { module: 'vehicles', action: 'read' },
        { module: 'vehicles', action: 'create' },
        { module: 'vehicles', action: 'update' },
        { module: 'vehicles', action: 'delete' },
        
        // Regions
        { module: 'regions', action: 'read' },
        { module: 'regions', action: 'create' },
        { module: 'regions', action: 'update' },
        { module: 'regions', action: 'delete' },
        
        // Points
        { module: 'points', action: 'read' },
        { module: 'points', action: 'create' },
        { module: 'points', action: 'update' },
        { module: 'points', action: 'delete' },
        
        // Fractions
        { module: 'fractions', action: 'read' },
        { module: 'fractions', action: 'create' },
        { module: 'fractions', action: 'update' },
        { module: 'fractions', action: 'delete' },
        
        // Work orders
        { module: 'workorders', action: 'read' },
        { module: 'workorders', action: 'create' },
        { module: 'workorders', action: 'update' },
        { module: 'workorders', action: 'delete' },
        
        // Daily assignments
        { module: 'dailyAssignments', action: 'read' },
        { module: 'dailyAssignments', action: 'create' },
        { module: 'dailyAssignments', action: 'update' },
        { module: 'dailyAssignments', action: 'delete' },
        
        // Calendar
        { module: 'calendar', action: 'read' },
        { module: 'calendar', action: 'create' },
        { module: 'calendar', action: 'update' },
        { module: 'calendar', action: 'delete' },
        
        // One time orders
        { module: 'oneTimeOrders', action: 'read' },
        { module: 'oneTimeOrders', action: 'create' },
        { module: 'oneTimeOrders', action: 'update' },
        { module: 'oneTimeOrders', action: 'delete' },
        
        // Debris bag orders
        { module: 'debrisBagOrders', action: 'read' },
        { module: 'debrisBagOrders', action: 'create' },
        { module: 'debrisBagOrders', action: 'update' },
        { module: 'debrisBagOrders', action: 'delete' },
        
        // Damages
        { module: 'damages', action: 'read' },
        { module: 'damages', action: 'create' },
        { module: 'damages', action: 'update' },
        { module: 'damages', action: 'delete' },
        
        // Monthly plan
        { module: 'monthlyPlan', action: 'read' },
        { module: 'monthlyPlan', action: 'create' },
        { module: 'monthlyPlan', action: 'update' },
        { module: 'monthlyPlan', action: 'delete' },
        
        // Work card
        { module: 'workCard', action: 'read' },
        { module: 'workCard', action: 'create' },
        { module: 'workCard', action: 'update' },
        { module: 'workCard', action: 'delete' },
        
        // Trasowka
        { module: 'trasowka', action: 'read' },
        { module: 'trasowka', action: 'create' },
        { module: 'trasowka', action: 'update' },
        { module: 'trasowka', action: 'delete' },
        
        // Absence types
        { module: 'absenceTypes', action: 'read' },
        { module: 'absenceTypes', action: 'create' },
        { module: 'absenceTypes', action: 'update' },
        { module: 'absenceTypes', action: 'delete' },
        
        // Leave Planning
        { module: 'leavePlanning', action: 'read' },
        { module: 'leavePlanning', action: 'create' },
        { module: 'leavePlanning', action: 'update' },
        { module: 'leavePlanning', action: 'delete' },
        
        // Users
        { module: 'users', action: 'read' },
        { module: 'users', action: 'create' },
        { module: 'users', action: 'update' },
        { module: 'users', action: 'delete' },
        
        // Containers
        { module: 'containers', action: 'read' },
        { module: 'containers', action: 'create' },
        { module: 'containers', action: 'update' },
        { module: 'containers', action: 'delete' },
      ];
      
      // Create permissions
      for (const perm of basicPermissions) {
        await prisma.permission.create({
          data: perm
        });
      }
      
      console.log(`Created ${basicPermissions.length} basic permissions`);
    } else {
      console.log('Permissions already exist. Skipping creation.');
    }
    
    // Check existing roles
    const existingRoles = await prisma.role.findMany();
    console.log('Existing roles:', existingRoles.length);
    
    if (existingRoles.length === 0) {
      console.log('No roles found. Creating basic roles...');
      
      // Create admin role with all permissions
      const adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator with full access'
        }
      });
      
      // Get all permissions
      const allPermissions = await prisma.permission.findMany();
      
      // Assign all permissions to admin role
      for (const perm of allPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: perm.id
          }
        });
      }
      
      console.log('Created admin role with all permissions');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeedPermissions();
