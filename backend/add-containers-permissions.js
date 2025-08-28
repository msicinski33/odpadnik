const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addContainersPermissions() {
  try {
    console.log('Adding containers permissions to database...');
    
    // First, create the containers permissions if they don't exist
    const containersPermissions = [
      { module: 'containers', action: 'read' },
      { module: 'containers', action: 'create' },
      { module: 'containers', action: 'update' },
      { module: 'containers', action: 'delete' }
    ];
    
    for (const perm of containersPermissions) {
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
    
    // Add containers permissions to each role
    for (const role of roles) {
      console.log(`\nProcessing role: ${role.name}`);
      
      // Get existing permissions for this role
      const existingPermissions = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
        include: { permission: true }
      });
      
      console.log(`Role ${role.name} has ${existingPermissions.length} existing permissions`);
      
      // Add containers permissions based on role type
      const containersPerms = ['containers:read'];
      
      // Add full permissions to most roles
      if (['dyspozytor', 'bok', 'kierownik', 'specjalista', 'koordynator', 'pracownik_biurowy'].includes(role.name)) {
        containersPerms.push('containers:create', 'containers:update', 'containers:delete');
      }
      
      for (const permName of containersPerms) {
        const [module, action] = permName.split(':');
        
        try {
          // Get the permission
          const permission = await prisma.permission.findUnique({
            where: { module_action: { module, action } }
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
              console.log(`  ✓ Added ${permName} to ${role.name}`);
            } else {
              console.log(`  - ${permName} already exists for ${role.name}`);
            }
          }
        } catch (error) {
          console.error(`  ✗ Error adding ${permName} to ${role.name}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Containers permissions added successfully!');
    
  } catch (error) {
    console.error('Error adding containers permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addContainersPermissions();


