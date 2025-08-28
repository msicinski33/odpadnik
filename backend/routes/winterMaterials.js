const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// Material types
const MATERIAL_TYPES = {
  salt: 'Sól drogowa',
  sand: 'Piasek',
  gravel: 'Żwir',
  salt_brine: 'Solanka',
  calcium_chloride: 'Chlorek wapnia',
  mixed: 'Mieszanka'
};

// Stock status
const STOCK_STATUS = {
  available: 'Dostępny',
  low: 'Niski stan',
  critical: 'Krytyczny',
  out_of_stock: 'Brak'
};

// GET /api/winter-materials/stocks - Get material stocks overview
router.get('/stocks', async (req, res) => {
  try {
    const { materialType, status, location } = req.query;
    
    const where = {};
    if (materialType) where.materialType = materialType;
    if (status) where.status = status;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    
    const stocks = await prisma.winterMaterialStock.findMany({
      where,
      orderBy: [
        { status: 'desc' },
        { materialType: 'asc' }
      ]
    });
    
    const processedStocks = stocks.map(stock => ({
      ...stock,
      materialTypeLabel: MATERIAL_TYPES[stock.materialType] || stock.materialType,
      statusLabel: STOCK_STATUS[stock.status] || stock.status,
      statusColor: stock.status === 'available' ? 'green' :
                   stock.status === 'low' ? 'yellow' :
                   stock.status === 'critical' ? 'orange' : 'red',
      usagePercentage: stock.maxCapacity > 0 ? 
        Math.round(((stock.maxCapacity - stock.currentStock) / stock.maxCapacity) * 100) : 0
    }));
    
    // Calculate totals by material type
    const totalsByType = {};
    Object.keys(MATERIAL_TYPES).forEach(type => {
      const typeStocks = processedStocks.filter(s => s.materialType === type);
      totalsByType[type] = {
        totalStock: typeStocks.reduce((sum, s) => sum + s.currentStock, 0),
        totalCapacity: typeStocks.reduce((sum, s) => sum + s.maxCapacity, 0),
        locations: typeStocks.length
      };
    });
    
    const stats = {
      totalLocations: processedStocks.length,
      byStatus: {
        available: processedStocks.filter(s => s.status === 'available').length,
        low: processedStocks.filter(s => s.status === 'low').length,
        critical: processedStocks.filter(s => s.status === 'critical').length,
        out_of_stock: processedStocks.filter(s => s.status === 'out_of_stock').length
      },
      totalsByType
    };
    
    res.json({
      success: true,
      data: processedStocks,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching material stocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch material stocks',
      details: error.message
    });
  }
});

// GET /api/winter-materials/consumption - Get consumption history
router.get('/consumption', async (req, res) => {
  try {
    const { 
      startDate,
      endDate = new Date().toISOString().split('T')[0],
      materialType,
      vehicleId,
      routeId,
      operatorId
    } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date(endDate + 'T23:59:59.999Z');
    
    const where = {
      date: { gte: start, lte: end }
    };
    
    if (materialType) where.materialType = materialType;
    if (vehicleId) where.vehicleId = parseInt(vehicleId);
    if (routeId) where.routeId = parseInt(routeId);
    if (operatorId) where.operatorId = parseInt(operatorId);
    
    const consumptions = await prisma.winterMaterialConsumption.findMany({
      where,
      include: {
        operator: {
          select: {
            name: true,
            surname: true
          }
        },
        vehicle: {
          select: {
            registrationNumber: true,
            brand: true
          }
        },
        route: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    const processedConsumptions = consumptions.map(consumption => ({
      ...consumption,
      materialTypeLabel: MATERIAL_TYPES[consumption.materialType] || consumption.materialType,
      operatorName: consumption.operator ? 
        `${consumption.operator.name} ${consumption.operator.surname}` : null,
      vehicleInfo: consumption.vehicle ? 
        `${consumption.vehicle.registrationNumber} (${consumption.vehicle.brand})` : null,
      routeName: consumption.route?.name
    }));
    
    // Calculate consumption analytics
    const analytics = {
      totalConsumption: consumptions.reduce((sum, c) => sum + c.quantity, 0),
      byMaterial: {},
      byDay: {},
      byVehicle: {},
      averageDaily: 0
    };
    
    // Group by material type
    Object.keys(MATERIAL_TYPES).forEach(type => {
      const typeConsumptions = consumptions.filter(c => c.materialType === type);
      analytics.byMaterial[type] = {
        total: typeConsumptions.reduce((sum, c) => sum + c.quantity, 0),
        count: typeConsumptions.length,
        label: MATERIAL_TYPES[type]
      };
    });
    
    // Group by day
    consumptions.forEach(consumption => {
      const dateKey = consumption.date.toISOString().split('T')[0];
      if (!analytics.byDay[dateKey]) {
        analytics.byDay[dateKey] = 0;
      }
      analytics.byDay[dateKey] += consumption.quantity;
    });
    
    // Calculate average daily consumption
    const dayCount = Object.keys(analytics.byDay).length;
    analytics.averageDaily = dayCount > 0 ? analytics.totalConsumption / dayCount : 0;
    
    res.json({
      success: true,
      data: processedConsumptions,
      analytics,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        days: dayCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching consumption data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consumption data',
      details: error.message
    });
  }
});

// POST /api/winter-materials/consumption - Record material consumption
router.post('/consumption', async (req, res) => {
  try {
    const {
      materialType,
      quantity,
      unit = 'kg',
      date = new Date().toISOString().split('T')[0],
      operatorId,
      vehicleId,
      routeId,
      notes
    } = req.body;
    
    if (!materialType || !quantity || !operatorId) {
      return res.status(400).json({
        success: false,
        error: 'Material type, quantity, and operator are required'
      });
    }
    
    const consumption = await prisma.winterMaterialConsumption.create({
      data: {
        materialType,
        quantity: parseFloat(quantity),
        unit,
        date: new Date(date),
        operatorId,
        vehicleId: vehicleId || null,
        routeId: routeId || null,
        notes: notes || null
      },
      include: {
        operator: {
          select: { name: true, surname: true }
        },
        vehicle: {
          select: { registrationNumber: true, brand: true }
        },
        route: {
          select: { name: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...consumption,
        materialTypeLabel: MATERIAL_TYPES[consumption.materialType],
        operatorName: `${consumption.operator.name} ${consumption.operator.surname}`
      },
      message: 'Material consumption recorded successfully'
    });
    
  } catch (error) {
    console.error('Error recording consumption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record consumption',
      details: error.message
    });
  }
});

// PUT /api/winter-materials/stocks/:stockId - Update stock
router.put('/stocks/:stockId', async (req, res) => {
  try {
    const { stockId } = req.params;
    const { currentStock, status, notes } = req.body;
    
    const updatedStock = await prisma.winterMaterialStock.update({
      where: { id: parseInt(stockId) },
      data: {
        ...(currentStock !== undefined && { currentStock: parseFloat(currentStock) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      data: {
        ...updatedStock,
        materialTypeLabel: MATERIAL_TYPES[updatedStock.materialType],
        statusLabel: STOCK_STATUS[updatedStock.status]
      },
      message: 'Stock updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock',
      details: error.message
    });
  }
});

// GET /api/winter-materials/analytics - Get detailed analytics
router.get('/analytics', async (req, res) => {
  try {
    const { 
      period = '30',
      materialType,
      routeId
    } = req.query;
    
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    const where = {
      date: { gte: startDate, lte: endDate }
    };
    
    if (materialType) where.materialType = materialType;
    if (routeId) where.routeId = parseInt(routeId);
    
    const consumptions = await prisma.winterMaterialConsumption.findMany({
      where,
      include: {
        route: { select: { name: true } },
        vehicle: { select: { registrationNumber: true } }
      }
    });
    
    // Daily consumption trend
    const dailyTrend = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyTrend[dateKey] = 0;
    }
    
    consumptions.forEach(consumption => {
      const dateKey = consumption.date.toISOString().split('T')[0];
      if (dailyTrend[dateKey] !== undefined) {
        dailyTrend[dateKey] += consumption.quantity;
      }
    });
    
    // Material type breakdown
    const materialBreakdown = {};
    Object.keys(MATERIAL_TYPES).forEach(type => {
      const typeConsumptions = consumptions.filter(c => c.materialType === type);
      materialBreakdown[type] = {
        quantity: typeConsumptions.reduce((sum, c) => sum + c.quantity, 0),
        count: typeConsumptions.length,
        label: MATERIAL_TYPES[type]
      };
    });
    
    // Route consumption
    const routeConsumption = {};
    consumptions.forEach(consumption => {
      if (consumption.route) {
        const routeName = consumption.route.name;
        if (!routeConsumption[routeName]) {
          routeConsumption[routeName] = 0;
        }
        routeConsumption[routeName] += consumption.quantity;
      }
    });
    
    const analytics = {
      period: `${days} days`,
      totalConsumption: consumptions.reduce((sum, c) => sum + c.quantity, 0),
      totalRecords: consumptions.length,
      averageDaily: consumptions.length > 0 ? 
        consumptions.reduce((sum, c) => sum + c.quantity, 0) / days : 0,
      dailyTrend: Object.entries(dailyTrend).map(([date, quantity]) => ({
        date,
        quantity
      })),
      materialBreakdown,
      routeConsumption: Object.entries(routeConsumption)
        .map(([route, quantity]) => ({ route, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)
    };
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      details: error.message
    });
  }
});

// GET /api/winter-materials/types - Get material types and options
router.get('/types', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        materialTypes: Object.entries(MATERIAL_TYPES).map(([key, label]) => ({
          value: key,
          label
        })),
        stockStatus: Object.entries(STOCK_STATUS).map(([key, label]) => ({
          value: key,
          label,
          color: key === 'available' ? 'green' :
                 key === 'low' ? 'yellow' :
                 key === 'critical' ? 'orange' : 'red'
        })),
        units: [
          { value: 'kg', label: 'Kilogramy' },
          { value: 't', label: 'Tony' },
          { value: 'l', label: 'Litry' },
          { value: 'm3', label: 'Metry sześcienne' }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch types',
      details: error.message
    });
  }
});

// GET /api/winter-materials/export - Export materials data
router.get('/export', async (req, res) => {
  try {
    const { type = 'consumption', format = 'excel', startDate, endDate } = req.query;
    
    if (type === 'consumption') {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      const consumptions = await prisma.winterMaterialConsumption.findMany({
        where: {
          date: { gte: start, lte: end }
        },
        include: {
          operator: { select: { name: true, surname: true } },
          vehicle: { select: { registrationNumber: true, brand: true } },
          route: { select: { name: true } }
        },
        orderBy: { date: 'desc' }
      });
      
      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Material Consumption');
        
        worksheet.columns = [
          { header: 'Data', key: 'date', width: 12 },
          { header: 'Materiał', key: 'material', width: 20 },
          { header: 'Ilość', key: 'quantity', width: 10 },
          { header: 'Jednostka', key: 'unit', width: 10 },
          { header: 'Operator', key: 'operator', width: 25 },
          { header: 'Pojazd', key: 'vehicle', width: 20 },
          { header: 'Trasa', key: 'route', width: 25 },
          { header: 'Uwagi', key: 'notes', width: 30 }
        ];
        
        worksheet.getRow(1).font = { bold: true };
        
        consumptions.forEach(consumption => {
          worksheet.addRow({
            date: consumption.date.toLocaleDateString('pl-PL'),
            material: MATERIAL_TYPES[consumption.materialType] || consumption.materialType,
            quantity: consumption.quantity,
            unit: consumption.unit,
            operator: consumption.operator ? 
              `${consumption.operator.name} ${consumption.operator.surname}` : '',
            vehicle: consumption.vehicle ? 
              `${consumption.vehicle.registrationNumber} (${consumption.vehicle.brand})` : '',
            route: consumption.route?.name || '',
            notes: consumption.notes || ''
          });
        });
        
        const filename = `material-consumption-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        await workbook.xlsx.write(res);
        res.end();
      } else {
        res.json({
          success: true,
          data: consumptions.map(c => ({
            ...c,
            materialTypeLabel: MATERIAL_TYPES[c.materialType],
            operatorName: c.operator ? `${c.operator.name} ${c.operator.surname}` : null
          })),
          exportedAt: new Date().toISOString(),
          total: consumptions.length
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid export type'
      });
    }
    
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      details: error.message
    });
  }
});

module.exports = router;