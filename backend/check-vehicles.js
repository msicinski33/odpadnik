const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVehicles() {
  try {
    const vehicles = await prisma.vehicle.findMany();
    console.log('Vehicles in database:', vehicles);
    console.log('Total vehicles:', vehicles.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVehicles(); 