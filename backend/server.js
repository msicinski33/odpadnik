const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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
const { authenticateToken } = require('./routes/authMiddleware');


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
app.use('/api/absence-types', absenceTypesRouter);
app.use('/api/work-card', workCardRouter);
app.use('/api/pdf', pdfRoute);
app.use('/api/one-time-orders', authenticateToken, oneTimeOrdersRouter);
app.use('/workorders', workOrdersRouter);
app.use('/api', demoScheduleRouter);


app.get('/', (req, res) => {
  res.send('Backend is running!');
});

server.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
}); 