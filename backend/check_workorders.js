const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkOrders() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      select: {
        id: true,
        type: true,
        dateReceived: true,
        realizationDate: true,
        executionDate: true,
        address: true,
        company: true,
      },
      orderBy: { id: 'desc' },
      take: 10
    });
    
    console.log('Recent work orders:');
    workOrders.forEach(order => {
      console.log(`ID: ${order.id}, Type: ${order.type}, DateReceived: ${order.dateReceived}, RealizationDate: ${order.realizationDate}, ExecutionDate: ${order.executionDate}, Address: ${order.address}, Company: ${order.company}`);
    });
    
    // Check for orders with null executionDate
    const nullExecutionDateOrders = await prisma.workOrder.findMany({
      where: {
        executionDate: null
      },
      select: {
        id: true,
        type: true,
        dateReceived: true,
        realizationDate: true,
        executionDate: true,
      }
    });
    
    console.log(`\nOrders with null executionDate: ${nullExecutionDateOrders.length}`);
    nullExecutionDateOrders.forEach(order => {
      console.log(`ID: ${order.id}, Type: ${order.type}, DateReceived: ${order.dateReceived}, RealizationDate: ${order.realizationDate}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkOrders();
