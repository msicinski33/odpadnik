const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/winter-dashboard - Base endpoint that returns overview data
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Vehicle readiness summary
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        winterStatusHistory: {
          where: {
            date: { lte: today }
          },
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    
    const vehicleStats = {
      total: vehicles.length,
      operational: 0,
      outOfService: 0,
      maintenance: 0
    };
    
    vehicles.forEach(vehicle => {
      const latestStatus = vehicle.winterStatusHistory[0];
      const status = latestStatus?.status || 'operational';
      
      if (status === 'operational') vehicleStats.operational++;
      else if (status.includes('out_of_service')) vehicleStats.outOfService++;
      else if (status === 'maintenance') vehicleStats.maintenance++;
    });
    
    // Material stocks summary
    const materialStocks = await prisma.winterMaterialStock.findMany();
    const stockStats = {
      totalLocations: materialStocks.length,
      lowStock: materialStocks.filter(s => s.status === 'low').length,
      criticalStock: materialStocks.filter(s => s.status === 'critical').length,
      outOfStock: materialStocks.filter(s => s.status === 'out_of_stock').length
    };
    
    // Routes summary
    const routes = await prisma.winterRoute.findMany({
      where: { isActive: true }
    });
    const routeStats = {
      total: routes.length,
      active: routes.filter(r => r.status === 'active' || !r.status).length,
      critical: routes.filter(r => r.priority === 'critical').length,
      high: routes.filter(r => r.priority === 'high').length,
      highPriority: routes.filter(r => r.priority === 'high' || r.priority === 'critical').length,
      completed: routes.filter(r => r.status === 'completed').length,
      totalDistance: routes.reduce((sum, r) => sum + (r.distance || 0), 0)
    };
    
    // Personnel summary (get employees with winter qualifications)
    const employees = await prisma.employee.findMany({
      where: { terminatedAt: null },
      include: {
        winterRouteAssignments: true,
        winterSidewalkWork: true,
        winterBusStopWork: true
      }
    });
    
    const personnelStats = {
      total: employees.length,
      available: employees.filter(e => e.terminatedAt === null).length,
      onDuty: employees.filter(e => 
        e.winterRouteAssignments.length > 0 || 
        e.winterSidewalkWork.length > 0 || 
        e.winterBusStopWork.length > 0
      ).length,
      qualified: employees.filter(e => 
        e.driversLicenseCategories && e.driversLicenseCategories.length > 0
      ).length
    };
    
    // Today's plans summary
    const todayPlans = await prisma.winterDailyPlan.findMany({
      where: {
        date: new Date(todayStr)
      },
      include: {
        assignments: true
      }
    });
    
    const todayPlansStats = {
      total: todayPlans.length,
      active: todayPlans.filter(p => p.status === 'active').length,
      completed: todayPlans.filter(p => p.status === 'completed').length,
      pending: todayPlans.filter(p => p.status === 'draft' || p.status === 'pending').length
    };
    
    // Mock alerts for now (can be expanded later)
    const alerts = [
      { id: 1, type: 'warning', message: 'System gotowy do operacji zimowych', time: '1 godz. temu' },
      { id: 2, type: 'info', message: 'Aktualizacja danych pogodowych', time: '2 godz. temu' }
    ];
    
    const overview = {
      vehicles: vehicleStats,
      materials: stockStats,
      routes: routeStats,
      personnel: personnelStats,
      todayPlans: todayPlansStats,
      alerts: alerts,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: overview
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
});

// GET /api/winter-dashboard/overview - Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Vehicle readiness summary
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        winterStatusHistory: {
          where: {
            date: { lte: today }
          },
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    
    const vehicleStats = {
      total: vehicles.length,
      operational: 0,
      outOfService: 0,
      maintenance: 0
    };
    
    vehicles.forEach(vehicle => {
      const latestStatus = vehicle.winterStatusHistory[0];
      const status = latestStatus?.status || 'operational';
      
      if (status === 'operational') vehicleStats.operational++;
      else if (status.includes('out_of_service')) vehicleStats.outOfService++;
      else if (status === 'maintenance') vehicleStats.maintenance++;
    });
    
    // Material stocks summary
    const materialStocks = await prisma.winterMaterialStock.findMany();
    const stockStats = {
      totalLocations: materialStocks.length,
      lowStock: materialStocks.filter(s => s.status === 'low').length,
      criticalStock: materialStocks.filter(s => s.status === 'critical').length,
      outOfStock: materialStocks.filter(s => s.status === 'out_of_stock').length
    };
    
    // Routes summary
    const routes = await prisma.winterRoute.findMany({
      where: { isActive: true }
    });
    const routeStats = {
      total: routes.length,
      critical: routes.filter(r => r.priority === 'critical').length,
      high: routes.filter(r => r.priority === 'high').length,
      totalDistance: routes.reduce((sum, r) => sum + (r.distance || 0), 0)
    };
    
    // Sidewalks summary
    const sidewalks = await prisma.winterSidewalk.findMany({
      where: { isActive: true }
    });
    const sidewalkStats = {
      total: sidewalks.length,
      critical: sidewalks.filter(s => s.priority === 'critical').length,
      totalLength: sidewalks.reduce((sum, s) => sum + (s.length || 0), 0)
    };
    
    // Bus stops summary
    const busStops = await prisma.winterBusStop.findMany({
      where: { isActive: true }
    });
    const busStopStats = {
      total: busStops.length,
      withWinterService: busStops.filter(b => b.hasWinterService).length,
      requireSpecialAccess: busStops.filter(b => b.requiresSpecialAccess).length
    };
    
    // Daily plans for today
    const todayPlans = await prisma.winterDailyPlan.findMany({
      where: {
        date: new Date(todayStr)
      },
      include: {
        assignments: true
      }
    });
    
    const planStats = {
      totalPlans: todayPlans.length,
      totalAssignments: todayPlans.reduce((sum, p) => sum + p.assignments.length, 0),
      completedPlans: todayPlans.filter(p => p.status === 'completed').length,
      inProgressPlans: todayPlans.filter(p => p.status === 'in_progress').length
    };
    
    // Recent material consumption (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentConsumption = await prisma.winterMaterialConsumption.findMany({
      where: {
        date: { gte: weekAgo }
      }
    });
    
    const consumptionStats = {
      totalConsumption: recentConsumption.reduce((sum, c) => sum + c.quantity, 0),
      saltConsumption: recentConsumption
        .filter(c => c.materialType === 'salt')
        .reduce((sum, c) => sum + c.quantity, 0),
      sandConsumption: recentConsumption
        .filter(c => c.materialType === 'sand')
        .reduce((sum, c) => sum + c.quantity, 0)
    };
    
    const overview = {
      vehicles: vehicleStats,
      materials: stockStats,
      routes: routeStats,
      sidewalks: sidewalkStats,
      busStops: busStopStats,
      dailyPlans: planStats,
      weeklyConsumption: consumptionStats,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: overview
    });
    
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard overview',
      details: error.message
    });
  }
});

// GET /api/winter-dashboard/alerts - Get critical alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = [];
    
    // Check for vehicles out of service
    const today = new Date();
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        winterStatusHistory: {
          where: { date: { lte: today } },
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    
    vehicles.forEach(vehicle => {
      const latestStatus = vehicle.winterStatusHistory[0];
      if (latestStatus && latestStatus.status.includes('out_of_service')) {
        alerts.push({
          type: 'vehicle_down',
          severity: 'high',
          title: 'Pojazd niesprawny',
          message: `${vehicle.registrationNumber} (${vehicle.brand}) - ${latestStatus.status}`,
          timestamp: latestStatus.date,
          vehicleId: vehicle.id
        });
      }
    });
    
    // Check for low material stocks
    const stocks = await prisma.winterMaterialStock.findMany({
      where: {
        OR: [
          { status: 'critical' },
          { status: 'out_of_stock' }
        ]
      }
    });
    
    stocks.forEach(stock => {
      alerts.push({
        type: 'low_stock',
        severity: stock.status === 'out_of_stock' ? 'critical' : 'medium',
        title: 'Niski stan materiału',
        message: `${stock.materialType} w ${stock.location} - ${stock.currentStock} ${stock.unit}`,
        timestamp: stock.updatedAt,
        stockId: stock.id
      });
    });
    
    // Check for overdue daily plans
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const overduePlans = await prisma.winterDailyPlan.findMany({
      where: {
        date: { lt: yesterday },
        status: { in: ['planned', 'in_progress'] }
      }
    });
    
    overduePlans.forEach(plan => {
      alerts.push({
        type: 'overdue_plan',
        severity: 'medium',
        title: 'Zaległy plan operacyjny',
        message: `Plan z ${plan.date.toLocaleDateString('pl-PL')} - ${plan.assignmentType}`,
        timestamp: plan.date,
        planId: plan.id
      });
    });
    
    // Sort alerts by severity and timestamp
    const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    res.json({
      success: true,
      data: alerts.slice(0, 20), // Limit to 20 most critical alerts
      total: alerts.length
    });
    
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      details: error.message
    });
  }
});

// GET /api/winter-dashboard/activity - Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const activities = [];
    
    // Recent vehicle status changes
    const recentStatuses = await prisma.winterVehicleStatus.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { registrationNumber: true } },
        reportedBy: { select: { name: true } }
      }
    });
    
    recentStatuses.forEach(status => {
      activities.push({
        type: 'vehicle_status',
        timestamp: status.createdAt,
        description: `Status pojazdu ${status.vehicle.registrationNumber} zmieniony na: ${status.status}`,
        user: status.reportedBy ? 
          status.reportedBy.name : null,
        details: {
          vehicleId: status.vehicleId,
          status: status.status
        }
      });
    });
    
    // Recent material consumption
    const recentConsumption = await prisma.winterMaterialConsumption.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        operator: { select: { name: true, surname: true } },
        vehicle: { select: { registrationNumber: true } },
        route: { select: { name: true } }
      }
    });
    
    recentConsumption.forEach(consumption => {
      activities.push({
        type: 'material_consumption',
        timestamp: consumption.createdAt,
        description: `Zużyto ${consumption.quantity} ${consumption.unit} ${consumption.materialType}`,
        user: consumption.operator ? 
          `${consumption.operator.name} ${consumption.operator.surname}` : null,
        details: {
          materialType: consumption.materialType,
          quantity: consumption.quantity,
          vehicle: consumption.vehicle?.registrationNumber,
          route: consumption.route?.name
        }
      });
    });
    
    // Recent daily plan updates
    const recentPlans = await prisma.winterDailyPlan.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        supervisor: { select: { name: true, surname: true } }
      }
    });
    
    recentPlans.forEach(plan => {
      activities.push({
        type: 'daily_plan',
        timestamp: plan.updatedAt,
        description: `Zaktualizowano plan operacyjny: ${plan.assignmentType}`,
        user: plan.supervisor ? 
          `${plan.supervisor.name} ${plan.supervisor.surname}` : null,
        details: {
          planId: plan.id,
          date: plan.date,
          status: plan.status
        }
      });
    });
    
    // Sort by timestamp and limit results
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      data: activities.slice(0, parseInt(limit))
    });
    
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity',
      details: error.message
    });
  }
});

// GET /api/winter-dashboard/weather - Get weather impact summary
router.get('/weather', async (req, res) => {
  try {
    // This would typically integrate with a weather API
    // For now, return a placeholder structure
    const weatherData = {
      current: {
        temperature: -5,
        condition: 'snow',
        windSpeed: 15,
        humidity: 85,
        lastUpdated: new Date().toISOString()
      },
      forecast: [
        { date: new Date().toISOString().split('T')[0], temp: -5, condition: 'snow' },
        { date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], temp: -8, condition: 'snow' },
        { date: new Date(Date.now() + 48*60*60*1000).toISOString().split('T')[0], temp: -3, condition: 'cloudy' }
      ],
      alerts: [
        {
          type: 'snow_warning',
          severity: 'high',
          message: 'Oczekiwane intensywne opady śniegu - zwiększyć częstotliwość odśnieżania'
        }
      ],
      recommendations: [
        'Zwiększyć zapasy soli',
        'Przygotować dodatkowe pojazdy',
        'Monitorować trasy krytyczne'
      ]
    };
    
    res.json({
      success: true,
      data: weatherData
    });
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      details: error.message
    });
  }
});

// GET /api/winter-dashboard/performance - Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Route completion metrics
    const routeAssignments = await prisma.winterRouteAssignment.findMany({
      where: {
        date: { gte: startDate }
      }
    });
    
    const routeMetrics = {
      totalAssignments: routeAssignments.length,
      completed: routeAssignments.filter(a => a.status === 'completed').length,
      inProgress: routeAssignments.filter(a => a.status === 'in_progress').length,
      completionRate: routeAssignments.length > 0 ? 
        (routeAssignments.filter(a => a.status === 'completed').length / routeAssignments.length) * 100 : 0
    };
    
    // Material efficiency
    const consumption = await prisma.winterMaterialConsumption.findMany({
      where: {
        date: { gte: startDate }
      }
    });
    
    const materialMetrics = {
      totalConsumption: consumption.reduce((sum, c) => sum + c.quantity, 0),
      averageDaily: consumption.length > 0 ? 
        consumption.reduce((sum, c) => sum + c.quantity, 0) / days : 0,
      byType: {
        salt: consumption.filter(c => c.materialType === 'salt').reduce((sum, c) => sum + c.quantity, 0),
        sand: consumption.filter(c => c.materialType === 'sand').reduce((sum, c) => sum + c.quantity, 0)
      }
    };
    
    // Vehicle utilization
    const vehicleMetrics = {
      totalVehicles: await prisma.vehicle.count({ where: { isActive: true } }),
      activeToday: await prisma.winterVehicleStatus.count({
        where: {
          date: new Date(),
          status: 'operational'
        }
      })
    };
    
    const performance = {
      period: `${days} days`,
      routes: routeMetrics,
      materials: materialMetrics,
      vehicles: vehicleMetrics,
      overallScore: Math.round((routeMetrics.completionRate + 
        (vehicleMetrics.activeToday / vehicleMetrics.totalVehicles * 100)) / 2)
    };
    
    res.json({
      success: true,
      data: performance
    });
    
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics',
      details: error.message
    });
  }
});

// GET /api/winter-dashboard/quick-stats - Get quick statistics for widgets
router.get('/quick-stats', async (req, res) => {
  try {
    const today = new Date();
    
    // Quick counts
    const [
      totalVehicles,
      totalRoutes,
      totalSidewalks,
      totalBusStops,
      todayPlans,
      activeAlerts
    ] = await Promise.all([
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.winterRoute.count({ where: { isActive: true } }),
      prisma.winterSidewalk.count({ where: { isActive: true } }),
      prisma.winterBusStop.count({ where: { isActive: true } }),
      prisma.winterDailyPlan.count({ 
        where: { 
          date: new Date(today.toISOString().split('T')[0]) 
        } 
      }),
      prisma.winterMaterialStock.count({
        where: {
          status: { in: ['low', 'critical', 'out_of_stock'] }
        }
      })
    ]);
    
    const stats = {
      vehicles: totalVehicles,
      routes: totalRoutes,
      sidewalks: totalSidewalks,
      busStops: totalBusStops,
      todayPlans: todayPlans,
      alerts: activeAlerts
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick stats',
      details: error.message
    });
  }
});

module.exports = router;