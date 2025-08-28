const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addScheduleChangesPermissions() {
  try {
    console.log('Adding schedule changes permissions to database...');
    
    // First, create the schedule changes permissions if they don't exist
    const scheduleChangesPermissions = [
      { module: 'scheduleChanges', action: 'read' },
      { module: 'scheduleChanges', action: 'create' },
      { module: 'scheduleChanges', action: 'update' },
      { module: 'scheduleChanges', action: 'approve' },
      { module: 'scheduleChanges', action: 'auto_approve' },
      { module: 'scheduleChanges', action: 'read_all' },
      { module: 'scheduleChanges', action: 'admin' }
    ];
    
    for (const perm of scheduleChangesPermissions) {
      try {
        await prisma.permission.upsert({
          where: { module_action: { module: perm.module, action: perm.action } },
          update: {},
          create: perm
        });
        console.log(`✓ Permission ${perm.module}:${perm.action} created/updated`);
      } catch (error) {
        console.log(`Permission ${perm.module}:${perm.action} already exists`);
      }
    }
    
    // Get all roles
    const roles = await prisma.role.findMany();
    console.log(`Found ${roles.length} roles:`, roles.map(r => r.name));
    
    // Define which permissions each role should have
    const rolePermissionMapping = {
      'admin': ['read', 'create', 'update', 'approve', 'auto_approve', 'read_all', 'admin'],
      'kierownik': ['read', 'create', 'update', 'approve', 'auto_approve', 'read_all'],
      'dyspozytor': ['read', 'create', 'approve', 'read_all'],
      'specjalista': ['read', 'create', 'read_all'],
      'koordynator': ['read', 'create', 'approve', 'read_all'],
      'pracownik_biurowy': ['read', 'create'],
      'kierowca': ['read', 'create'],
      'viewer': ['read']
    };
    
    // Add schedule changes permissions to each role
    for (const role of roles) {
      console.log(`\nProcessing role: ${role.name}`);
      
      const permissionsForRole = rolePermissionMapping[role.name] || [];
      
      if (permissionsForRole.length === 0) {
        console.log(`  No schedule changes permissions defined for role: ${role.name}`);
        continue;
      }
      
      for (const action of permissionsForRole) {
        try {
          // Get the permission
          const permission = await prisma.permission.findUnique({
            where: { module_action: { module: 'scheduleChanges', action } }
          });
          
          if (permission) {
            // Check if role already has this permission
            const existing = await prisma.rolePermission.findUnique({
              where: { 
                roleId_permissionId: { 
                  roleId: role.id, 
                  permissionId: permission.id 
                } 
              }
            });
            
            if (!existing) {
              await prisma.rolePermission.create({
                data: {
                  roleId: role.id,
                  permissionId: permission.id
                }
              });
              console.log(`  ✓ Added scheduleChanges:${action} to ${role.name}`);
            } else {
              console.log(`  - scheduleChanges:${action} already exists for ${role.name}`);
            }
          }
        } catch (error) {
          console.error(`  ✗ Error adding scheduleChanges:${action} to ${role.name}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Schedule changes permissions added successfully!');
    
  } catch (error) {
    console.error('Error adding schedule changes permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addScheduleChangesPermissions();