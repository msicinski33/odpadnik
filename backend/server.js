const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// In-memory lock store: { [date]: { employees: Set, vehicles: Set, ... }, ... }
const resourceLocks = {};

// TTL for locks (ms)
const LOCK_TTL = 10 * 60 * 1000; // 10 minutes

// Helper: Set lock with TTL
function reserveResource(date, type, resourceType, id) {
  if (!resourceLocks[date]) resourceLocks[date] = { employees: new Set(), vehicles: new Set() };
  resourceLocks[date][resourceType].add(id);
  setTimeout(() => {
    if (resourceLocks[date]) resourceLocks[date][resourceType].delete(id);
    io.emit('resourceReleased', { date, type, resourceType, id });
  }, LOCK_TTL);
}

// Helper: Release lock
function releaseResource(date, type, resourceType, id) {
  if (resourceLocks[date]) resourceLocks[date][resourceType].delete(id);
  io.emit('resourceReleased', { date, type, resourceType, id });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Expose for routes (must be after io is defined)
app.set('io', io);
app.set('resourceLocks', resourceLocks);
app.set('reserveResource', reserveResource);
app.set('releaseResource', releaseResource);

// Routes
const employeeRoutes = require('./routes/employees');
const usersRoutes = require('./routes/users');
const monthlyWorkRoutes = require('./routes/monthlyWork');
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const fractionsRoutes = require('./routes/fractions');
const regionsRoutes = require('./routes/regions');
const pointsRoutes = require('./routes/points');
const pointFractionsRoutes = require('./routes/pointFractions');
const trasowkaRoutes = require('./routes/trasowka');
const calendarRoutes = require('./routes/calendar');
const dailyAssignmentsRoutes = require('./routes/dailyAssignments');
const workOrdersRouter = require('./routes/workorders');
const employeesRouter = require('./routes/employees');
const vehiclesRouter = require('./routes/vehicles');
const demoScheduleRouter = require('./routes/demoSchedule');
const municipalitiesRouter = require('./routes/municipalities');
const absenceTypesRouter = require('./routes/absenceTypes');
const workCardRouter = require('./routes/workCard');
const pdfRoute = require('./routes/pdf');
const oneTimeOrdersRouter = require('./routes/oneTimeOrders');
const debrisBagOrdersRouter = require('./routes/debrisBagOrders');
const damagesRouter = require('./routes/damages');
const rolesRouter = require('./routes/roles');
const leavePlanningRouter = require('./routes/leavePlanning');
const containersRouter = require('./routes/containers');
const scheduleChangesRouter = require('./routes/scheduleChanges');
const { authenticateToken, authorizeModule, attachPermissions, clearRoleCache } = require('./routes/authMiddleware');

// Winter Action Module Routes
const winterPhoneNumbersRouter = require('./routes/winterPhoneNumbers');
const winterDriverQualificationsRouter = require('./routes/winterDriverQualifications');
const winterVehicleReadinessRouter = require('./routes/winterVehicleReadiness');
const winterVehiclesRouter = require('./routes/winterVehicles');
const winterDailyPlanRouter = require('./routes/winterDailyPlan');
const winterRoutesRouter = require('./routes/winterRoutes');
const winterDashboardRouter = require('./routes/winterDashboard');


app.use('/api/employees', employeesRouter);
app.use('/api/users', usersRoutes);
app.use('/api/monthlyWork', monthlyWorkRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/fractions', fractionsRoutes);
app.use('/api/regions', regionsRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api', pointFractionsRoutes);
app.use('/api/trasowka', trasowkaRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/dailyAssignments', dailyAssignmentsRoutes);
app.use('/api/municipalities', municipalitiesRouter);
app.use('/api/absence-types', authenticateToken, attachPermissions, authorizeModule('absenceTypes'), absenceTypesRouter);
app.use('/api/work-card', workCardRouter);
app.use('/api/pdf', authenticateToken, attachPermissions, pdfRoute);
app.use('/api/one-time-orders', authenticateToken, attachPermissions, oneTimeOrdersRouter);
app.use('/api/debris-bag-orders', authenticateToken, attachPermissions, debrisBagOrdersRouter);
app.use('/api/damages', damagesRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/leave-planning', authenticateToken, attachPermissions, leavePlanningRouter);
app.use('/api/containers', authenticateToken, attachPermissions, containersRouter);
app.use('/api/schedule-changes', authenticateToken, attachPermissions, scheduleChangesRouter);
app.use('/api/workorders', authenticateToken, attachPermissions, workOrdersRouter);
app.use('/api', demoScheduleRouter);

// Winter Action Module Routes
app.use('/api/winter-phone-numbers', authenticateToken, attachPermissions, authorizeModule('winterAction'), winterPhoneNumbersRouter);
app.use('/api/winter-driver-qualifications', authenticateToken, attachPermissions, authorizeModule('winterAction'), winterDriverQualificationsRouter);
app.use('/api/winter-vehicles', authenticateToken, attachPermissions, authorizeModule('winterVehicles'), winterVehiclesRouter);
app.use('/api/winter-vehicle-readiness', authenticateToken, attachPermissions, authorizeModule('winterVehicleStatus'), winterVehicleReadinessRouter);
app.use('/api/winter-daily-plan', authenticateToken, attachPermissions, authorizeModule('winterDailyPlan'), winterDailyPlanRouter);
app.use('/api/winter-routes', authenticateToken, attachPermissions, authorizeModule('winterRoutes'), winterRoutesRouter);
app.use('/api/winter-dashboard', authenticateToken, attachPermissions, authorizeModule('winterAction'), winterDashboardRouter);


app.get('/', (req, res) => {
  res.send('Backend is running!');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
  console.log(`API accessible at http://192.168.1.7:${PORT}`);
  
  // Pre-warm permission cache for better performance
  console.log('Pre-warming permission cache...');
  clearRoleCache(); // Clear any existing cache
  console.log('Permission cache ready');
}); 