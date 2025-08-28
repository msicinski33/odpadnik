const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testContainersAccess() {
  try {
    console.log('=== TESTING CONTAINERS ACCESS ===\n');
    
    // 1. Check if containers permissions exist
    const containersPerms = await prisma.permission.findMany({
      where: { module: 'containers' }
    });
    console.log(`1. Containers permissions found: ${containersPerms.length}`);
    for (const perm of containersPerms) {
      console.log(`   - ${perm.module}:${perm.action}`);
    }
    
    // 2. Check which roles have containers permissions
    const rolesWithContainers = await prisma.role.findMany({
      where: {
        rolePermissions: {
          some: {
            permission: {
              module: 'containers'
            }
          }
        }
      },
      include: {
        rolePermissions: {
          where: {
            permission: {
              module: 'containers'
            }
          },
          include: {
            permission: true
          }
        }
      }
    });
    
    console.log(`\n2. Roles with containers permissions: ${rolesWithContainers.length}`);
    for (const role of rolesWithContainers) {
      console.log(`   Role: ${role.name}`);
      for (const rp of role.rolePermissions) {
        console.log(`     - ${rp.permission.module}:${rp.permission.action}`);
      }
    }
    
    // 3. Check specific user (Michał Sicinski)
    const michal = await prisma.user.findFirst({
      where: { email: 'michal.sicinski@pgkslupsk.pl' }
    });
    
    if (michal) {
      console.log(`\n3. User: ${michal.name} (${michal.email})`);
      console.log(`   Role: ${michal.role}`);
      
      if (michal.role === 'admin') {
        console.log('   ✅ Admin role - should have access to everything');
      } else {
        // Check if this role has containers permissions
        const role = await prisma.role.findFirst({
          where: { name: michal.role },
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        });
        
        if (role) {
          const containersPerms = role.rolePermissions.filter(rp => rp.permission.module === 'containers');
          if (containersPerms.length > 0) {
            console.log('   ✅ Role has containers permissions:');
            for (const rp of containersPerms) {
              console.log(`     - ${rp.permission.module}:${rp.permission.action}`);
            }
          } else {
            console.log('   ❌ Role does NOT have containers permissions');
          }
        } else {
          console.log('   ❌ Role not found in database');
        }
      }
    }
    
    // 4. Test the permission loading logic
    console.log('\n4. Testing permission loading logic...');
    if (michal && michal.role !== 'admin') {
      const role = await prisma.role.findFirst({
        where: { name: michal.role },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      if (role && role.rolePermissions.length > 0) {
        const permissions = role.rolePermissions.map(rp =>
          `${rp.permission.module}:${rp.permission.action}`
        );
        console.log('   Permissions loaded:', permissions);
        
        const hasContainersRead = permissions.includes('containers:read');
        console.log(`   Has containers:read: ${hasContainersRead ? '✅ YES' : '❌ NO'}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContainersAccess();
