const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken } = require('./authMiddleware');

// List all debris bag orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.debrisBagOrder.findMany({
      orderBy: { dateReceived: 'desc' },
      include: { vehicle: true },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await prisma.debrisBagOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: { vehicle: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    // Optionally validate required fields here
    const order = await prisma.debrisBagOrder.create({ data });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update order
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const order = await prisma.debrisBagOrder.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark as completed
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const order = await prisma.debrisBagOrder.update({
      where: { id: Number(req.params.id) },
      data: {
        ...data,
        status: 'COMPLETED',
      },
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete order
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.debrisBagOrder.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly report
router.get('/report/monthly', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month parameters are required' });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // Get all orders for the specified month
    // Include orders whose dateReceived OR serviceExecutionDate falls within the month
    const orders = await prisma.debrisBagOrder.findMany({
      where: {
        OR: [
          { dateReceived: { gte: startDate, lte: endDate } },
          { serviceExecutionDate: { gte: startDate, lte: endDate } },
        ],
      },
      include: { vehicle: true },
      orderBy: { dateReceived: 'asc' }
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;
    const pendingOrders = orders.filter(order => order.status === 'PENDING_COMPLETION').length;
    
    const totalBags = orders.reduce((sum, order) => sum + order.numberOfBags, 0);
    const bagsCollected = orders.reduce((sum, order) => sum + (order.bagsCollected || 0), 0);
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
    const completedRevenue = orders
      .filter(order => order.status === 'COMPLETED')
      .reduce((sum, order) => sum + (order.price || 0), 0);
    
    // Bag type breakdown
    const bagTypeBreakdown = orders.reduce((acc, order) => {
      acc[order.bagType] = (acc[order.bagType] || 0) + order.numberOfBags;
      return acc;
    }, {});
    
    // Payment type breakdown
    const paymentTypeBreakdown = orders.reduce((acc, order) => {
      acc[order.paymentType] = (acc[order.paymentType] || 0) + 1;
      return acc;
    }, {});
    
    // Vehicle usage breakdown
    const vehicleUsage = orders
      .filter(order => order.vehicle)
      .reduce((acc, order) => {
        const vehicleName = order.vehicle.registrationNumber;
        acc[vehicleName] = (acc[vehicleName] || 0) + 1;
        return acc;
      }, {});
    
    // Daily breakdown
    const dailyBreakdown = orders.reduce((acc, order) => {
      const baseDate = order.serviceExecutionDate || order.dateReceived;
      const date = baseDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          orders: 0,
          bags: 0,
          revenue: 0,
          completed: 0
        };
      }
      acc[date].orders++;
      acc[date].bags += order.numberOfBags;
      acc[date].revenue += (order.price || 0);
      if (order.status === 'COMPLETED') {
        acc[date].completed++;
      }
      return acc;
    }, {});

    // Top clients by revenue
    const clientRevenue = orders.reduce((acc, order) => {
      if (!acc[order.clientName]) {
        acc[order.clientName] = {
          orders: 0,
          bags: 0,
          revenue: 0
        };
      }
      acc[order.clientName].orders++;
      acc[order.clientName].bags += order.numberOfBags;
      acc[order.clientName].revenue += (order.price || 0);
      return acc;
    }, {});

    const topClients = Object.entries(clientRevenue)
      .map(([client, data]) => ({ client, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const report = {
      period: {
        year: parseInt(year),
        month: parseInt(month),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      summary: {
        totalOrders,
        completedOrders,
        pendingOrders,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0,
        totalBags,
        bagsCollected,
        collectionRate: totalBags > 0 ? (bagsCollected / totalBags * 100).toFixed(2) : 0,
        totalRevenue,
        completedRevenue,
        averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
        averageBagsPerOrder: totalOrders > 0 ? (totalBags / totalOrders).toFixed(2) : 0
      },
      breakdowns: {
        bagTypes: bagTypeBreakdown,
        paymentTypes: paymentTypeBreakdown,
        vehicleUsage,
        daily: dailyBreakdown
      },
      topClients,
      orders: orders.map(order => ({
        id: order.id,
        clientName: order.clientName,
        orderNumber: order.orderNumber,
        dateReceived: order.dateReceived,
        status: order.status,
        numberOfBags: order.numberOfBags,
        bagType: order.bagType,
        price: order.price,
        serviceExecutionDate: order.serviceExecutionDate,
        vehicle: order.vehicle?.registrationNumber,
        bagsCollected: order.bagsCollected,
        kpoNumber: order.kpoNumber,
        invoiceNumber: order.invoiceNumber
      }))
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 