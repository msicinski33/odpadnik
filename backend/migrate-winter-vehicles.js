const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateVehiclesToWinterVehicles() {
  try {
    console.log('Starting migration of vehicles to winter vehicle system...');
    
    // Get all active vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        isActive: true
      }
    });
    
    console.log(`Found ${vehicles.length} active vehicles to migrate`);
    
    for (const vehicle of vehicles) {
      // Check if winter vehicle already exists
      const existingWinterVehicle = await prisma.winterVehicle.findUnique({
        where: {
          registrationNumber: vehicle.registrationNumber
        }
      });
      
      if (existingWinterVehicle) {
        console.log(`Winter vehicle ${vehicle.registrationNumber} already exists, skipping...`);
        continue;
      }
      
      // Create winter vehicle
      const winterVehicle = await prisma.winterVehicle.create({
        data: {
          brand: vehicle.brand,
          registrationNumber: vehicle.registrationNumber,
          vehicleType: vehicle.vehicleType,
          capacity: vehicle.capacity,
          fuelType: vehicle.fuelType,
          purchaseDate: vehicle.purchaseDate,
          winterSeasonStart: new Date('2024-11-01'), // Default winter season start
          winterSeasonEnd: new Date('2025-03-31'), // Default winter season end
          baseDepartment: 'Sektor Zimowy', // Default department
          winterEquipment: JSON.stringify(['plow', 'salt_spreader']), // Default equipment
          isActive: vehicle.isActive,
          notes: `Migrated from regular vehicle system. Original fault status: ${vehicle.faultStatus}`
        }
      });
      
      console.log(`Created winter vehicle: ${winterVehicle.registrationNumber}`);
      
      // Migrate existing winter vehicle status if any
      const existingStatuses = await prisma.winterVehicleStatus.findMany({
        where: {
          vehicleId: vehicle.id
        },
        include: {
          reportedBy: true
        }
      });
      
      if (existingStatuses.length > 0) {
        console.log(`Migrating ${existingStatuses.length} status records for ${vehicle.registrationNumber}`);
        
        for (const status of existingStatuses) {
          await prisma.winterVehicleStatusHistory.create({
            data: {
              winterVehicleId: winterVehicle.id,
              date: status.date,
              status: status.status,
              equipmentType: status.equipmentType,
              notes: status.notes,
              reportedById: status.reportedById,
              createdAt: status.createdAt,
              updatedAt: status.updatedAt
            }
          });
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateVehiclesToWinterVehicles();
}

module.exports = { migrateVehiclesToWinterVehicles };