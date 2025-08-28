const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addWinterActionPermissions() {
  console.log('Adding Winter Action Module permissions...');

  try {
    // Define all Winter Action permissions
    const winterPermissions = [
      // Main Winter Action module
      { module: 'winterAction', action: 'read' },
      { module: 'winterAction', action: 'create' },
      { module: 'winterAction', action: 'update' },
      { module: 'winterAction', action: 'delete' },

      // Winter Vehicle Status
      { module: 'winterVehicleStatus', action: 'read' },
      { module: 'winterVehicleStatus', action: 'create' },
      { module: 'winterVehicleStatus', action: 'update' },
      { module: 'winterVehicleStatus', action: 'delete' },

      // Winter Routes
      { module: 'winterRoutes', action: 'read' },
      { module: 'winterRoutes', action: 'create' },
      { module: 'winterRoutes', action: 'update' },
      { module: 'winterRoutes', action: 'delete' },

      // Winter Daily Plan
      { module: 'winterDailyPlan', action: 'read' },
      { module: 'winterDailyPlan', action: 'create' },
      { module: 'winterDailyPlan', action: 'update' },
      { module: 'winterDailyPlan', action: 'delete' },

      // Winter Materials (Salt & Sand)
      { module: 'winterMaterials', action: 'read' },
      { module: 'winterMaterials', action: 'create' },
      { module: 'winterMaterials', action: 'update' },
      { module: 'winterMaterials', action: 'delete' },

      // Winter Sidewalks
      { module: 'winterSidewalks', action: 'read' },
      { module: 'winterSidewalks', action: 'create' },
      { module: 'winterSidewalks', action: 'update' },
      { module: 'winterSidewalks', action: 'delete' },

      // Winter Bus Stops
      { module: 'winterBusStops', action: 'read' },
      { module: 'winterBusStops', action: 'create' },
      { module: 'winterBusStops', action: 'update' },
      { module: 'winterBusStops', action: 'delete' },

      // Winter Road Inventory
      { module: 'winterRoadInventory', action: 'read' },
      { module: 'winterRoadInventory', action: 'create' },
      { module: 'winterRoadInventory', action: 'update' },
      { module: 'winterRoadInventory', action: 'delete' }
    ];

    // Add permissions to database
    console.log('Creating permissions in database...');
    for (const permission of winterPermissions) {
      try {
        await prisma.permission.upsert({
          where: {
            module_action: {
              module: permission.module,
              action: permission.action
            }
          },
          update: {},
          create: {
            module: permission.module,
            action: permission.action
          }
        });
        console.log(`✓ Added permission: ${permission.module}:${permission.action}`);
      } catch (error) {
        console.log(`- Permission ${permission.module}:${permission.action} already exists`);
      }
    }

    // Get all roles
    const roles = await prisma.role.findMany();
    console.log(`\nFound ${roles.length} roles in the system`);

    // Define role-permission mappings for Winter Action
    const rolePermissionMappings = {
      'admin': winterPermissions, // Admin gets all permissions
      'kierownik': winterPermissions, // Manager gets all permissions
      'dyspozytor': [
        { module: 'winterAction', action: 'read' },
        { module: 'winterAction', action: 'create' },
        { module: 'winterAction', action: 'update' },
        { module: 'winterVehicleStatus', action: 'read' },
        { module: 'winterVehicleStatus', action: 'create' },
        { module: 'winterVehicleStatus', action: 'update' },
        { module: 'winterRoutes', action: 'read' },
        { module: 'winterRoutes', action: 'create' },
        { module: 'winterRoutes', action: 'update' },
        { module: 'winterDailyPlan', action: 'read' },
        { module: 'winterDailyPlan', action: 'create' },
        { module: 'winterDailyPlan', action: 'update' },
        { module: 'winterMaterials', action: 'read' },
        { module: 'winterMaterials', action: 'create' },
        { module: 'winterMaterials', action: 'update' },
        { module: 'winterSidewalks', action: 'read' },
        { module: 'winterSidewalks', action: 'create' },
        { module: 'winterSidewalks', action: 'update' },
        { module: 'winterBusStops', action: 'read' },
        { module: 'winterBusStops', action: 'create' },
        { module: 'winterBusStops', action: 'update' },
        { module: 'winterRoadInventory', action: 'read' },
        { module: 'winterRoadInventory', action: 'create' },
        { module: 'winterRoadInventory', action: 'update' }
      ],
      'specjalista': [
        { module: 'winterAction', action: 'read' },
        { module: 'winterAction', action: 'create' },
        { module: 'winterAction', action: 'update' },
        { module: 'winterVehicleStatus', action: 'read' },
        { module: 'winterVehicleStatus', action: 'create' },
        { module: 'winterVehicleStatus', action: 'update' },
        { module: 'winterRoutes', action: 'read' },
        { module: 'winterRoutes', action: 'create' },
        { module: 'winterRoutes', action: 'update' },
        { module: 'winterDailyPlan', action: 'read' },
        { module: 'winterDailyPlan', action: 'create' },
        { module: 'winterDailyPlan', action: 'update' },
        { module: 'winterMaterials', action: 'read' },
        { module: 'winterMaterials', action: 'create' },
        { module: 'winterMaterials', action: 'update' },
        { module: 'winterSidewalks', action: 'read' },
        { module: 'winterSidewalks', action: 'create' },
        { module: 'winterSidewalks', action: 'update' },
        { module: 'winterBusStops', action: 'read' },
        { module: 'winterBusStops', action: 'create' },
        { module: 'winterBusStops', action: 'update' },
        { module: 'winterRoadInventory', action: 'read' },
        { module: 'winterRoadInventory', action: 'create' },
        { module: 'winterRoadInventory', action: 'update' }
      ],
      'koordynator': [
        { module: 'winterAction', action: 'read' },
        { module: 'winterAction', action: 'create' },
        { module: 'winterAction', action: 'update' },
        { module: 'winterVehicleStatus', action: 'read' },
        { module: 'winterVehicleStatus', action: 'create' },
        { module: 'winterVehicleStatus', action: 'update' },
        { module: 'winterRoutes', action: 'read' },
        { module: 'winterRoutes', action: 'create' },
        { module: 'winterRoutes', action: 'update' },
        { module: 'winterDailyPlan', action: 'read' },
        { module: 'winterDailyPlan', action: 'create' },
        { module: 'winterDailyPlan', action: 'update' },
        { module: 'winterMaterials', action: 'read' },
        { module: 'winterMaterials', action: 'create' },
        { module: 'winterMaterials', action: 'update' },
        { module: 'winterSidewalks', action: 'read' },
        { module: 'winterSidewalks', action: 'create' },
        { module: 'winterSidewalks', action: 'update' },
        { module: 'winterBusStops', action: 'read' },
        { module: 'winterBusStops', action: 'create' },
        { module: 'winterBusStops', action: 'update' },
        { module: 'winterRoadInventory', action: 'read' },
        { module: 'winterRoadInventory', action: 'create' },
        { module: 'winterRoadInventory', action: 'update' }
      ],
      'pracownik_biurowy': [
        { module: 'winterAction', action: 'read' },
        { module: 'winterVehicleStatus', action: 'read' },
        { module: 'winterRoutes', action: 'read' },
        { module: 'winterDailyPlan', action: 'read' },
        { module: 'winterMaterials', action: 'read' },
        { module: 'winterSidewalks', action: 'read' },
        { module: 'winterBusStops', action: 'read' },
        { module: 'winterRoadInventory', action: 'read' }
      ],
      'kierowca': [
        { module: 'winterAction', action: 'read' },
        { module: 'winterVehicleStatus', action: 'read' },
        { module: 'winterVehicleStatus', action: 'create' },
        { module: 'winterRoutes', action: 'read' },
        { module: 'winterDailyPlan', action: 'read' },
        { module: 'winterMaterials', action: 'read' },
        { module: 'winterMaterials', action: 'create' }
      ],
      'bok': [
        { module: 'winterAction', action: 'read' },
        { module: 'winterVehicleStatus', action: 'read' },
        { module: 'winterDailyPlan', action: 'read' },
        { module: 'winterMaterials', action: 'read' }
      ],
      'viewer': [
        { module: 'winterAction', action: 'read' },
        { module: 'winterVehicleStatus', action: 'read' },
        { module: 'winterRoutes', action: 'read' },
        { module: 'winterDailyPlan', action: 'read' },
        { module: 'winterMaterials', action: 'read' },
        { module: 'winterSidewalks', action: 'read' },
        { module: 'winterBusStops', action: 'read' },
        { module: 'winterRoadInventory', action: 'read' }
      ]
    };

    // Assign permissions to roles
    console.log('\nAssigning Winter Action permissions to roles...');
    for (const role of roles) {
      const rolePermissions = rolePermissionMappings[role.name];
      if (!rolePermissions) {
        console.log(`- No Winter Action permissions defined for role: ${role.name}`);
        continue;
      }

      console.log(`\nProcessing role: ${role.name} (${rolePermissions.length} permissions)`);
      
      for (const permissionData of rolePermissions) {
        try {
          // Find the permission
          const permission = await prisma.permission.findUnique({
            where: {
              module_action: {
                module: permissionData.module,
                action: permissionData.action
              }
            }
          });

          if (!permission) {
            console.log(`  - Permission not found: ${permissionData.module}:${permissionData.action}`);
            continue;
          }

          // Check if role permission already exists
          const existingRolePermission = await prisma.rolePermission.findUnique({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            }
          });

          if (existingRolePermission) {
            console.log(`  - Already exists: ${permissionData.module}:${permissionData.action}`);
            continue;
          }

          // Create role permission
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
          console.log(`  ✓ Added: ${permissionData.module}:${permissionData.action}`);
        } catch (error) {
          console.log(`  ✗ Error adding ${permissionData.module}:${permissionData.action}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Winter Action Module permissions have been successfully added!');
    console.log('\nThe following Winter Action sub-modules are now available:');
    console.log('• Phone Numbers Directory');
    console.log('• Driver Qualifications');
    console.log('• Vehicle Readiness Timeline');
    console.log('• Daily Operational Plans (AZ Static Lists)');
    console.log('• Winter Route Management');
    console.log('• Sidewalk Clearing Management');
    console.log('• Bus Stops & Bins Maintenance');
    console.log('• Road Inventory Management');
    console.log('• Salt & Sand Consumption Tracking');
    console.log('• Winter Action Dashboard');

  } catch (error) {
    console.error('Error adding Winter Action permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addWinterActionPermissions();