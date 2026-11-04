const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const { checkConnection } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*', // Allows local Vite dev server and custom origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.json({
    project: 'BLACKSITE // OPERATOR ARMORY',
    service: 'Express & PostgreSQL REST Backend',
    status: 'OPERATIONAL',
    apiDocumentation: '/api/health',
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[UNCAUGHT ERROR]', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred.',
  });
});

// Start Server with error handling
function startServer(portToTry) {
  const server = app.listen(portToTry, async () => {
    console.log(`\n======================================================`);
    console.log(`[BLACKSITE SERVER] Tactical Backend engaged on port ${portToTry}`);
    console.log(`[BLACKSITE SERVER] REST Base: http://localhost:${portToTry}/api`);
    console.log(`======================================================\n`);

    // Probe database connection
    const dbStatus = await checkConnection();
    if (dbStatus.connected) {
      console.log(`[BLACKSITE DB] Link established with ${dbStatus.engine} (${dbStatus.database}) at ${dbStatus.host}:${dbStatus.port}`);
      try {
        const { setupWheelSchema } = require('./scripts/setup-wheel');
        await setupWheelSchema();
      } catch (e) {
        console.warn('[LUCK ROYALE] Wheel initialization skipped:', e.message);
      }
    } else {
      console.warn(`[BLACKSITE DB] WARNING: Database offline or unreachable.`);
      console.warn(`[BLACKSITE DB] Details: ${dbStatus.error}`);
      console.warn(`[BLACKSITE DB] For XAMPP: Start MySQL in XAMPP and run "npm run db:setup:xampp".`);
      console.warn(`[BLACKSITE DB] For PostgreSQL: Start PostgreSQL and run "npm run db:setup".`);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[BLACKSITE SERVER] Port ${portToTry} is already in use. Retrying on port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('[BLACKSITE SERVER] Fatal server error:', err);
    }
  });
}

startServer(parseInt(PORT, 10));
