const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Gig Insured Backend API',
    database: process.env.SUPABASE_URL ? 'Supabase PostgreSQL' : 'In-Memory Fallback',
    healthCheck: '/api/health'
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Gig Insured API Server is running',
    timestamp: new Date().toISOString(),
    service: 'gig-insured-server',
    database: process.env.SUPABASE_URL ? 'supabase' : 'in-memory'
  });
});

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Worker Routes
const workerRoutes = require('./routes/workerRoutes');
app.use('/api/workers', workerRoutes);

// Policy & Premium Quotes Routes
const policyRoutes = require('./routes/policyRoutes');
app.use('/api', policyRoutes);

// Claim Routes
const claimRoutes = require('./routes/claimRoutes');
app.use('/api/claims', claimRoutes);

// Admin Routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Initialize Disruption Monitoring Cron Job (Running every 15 minutes)
const disruptionMonitor = require('./jobs/disruptionMonitor');
disruptionMonitor.initCronJob();

app.listen(PORT, () => {
  console.log(`[Server] Gig Insured backend listening on port ${PORT}`);
  if (process.env.SUPABASE_URL) {
    console.log('[Server] Connected to Supabase (PostgreSQL)');
  } else {
    console.log('[Server] SUPABASE_URL not set — running in in-memory fallback mode');
  }
});
