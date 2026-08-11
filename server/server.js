const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.log('[Server]: MONGO_URI not provided. Skipping DB connection for initial health check mode.');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Gig Insured API Server is running',
    timestamp: new Date().toISOString(),
    service: 'gig-insured-server'
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
});
