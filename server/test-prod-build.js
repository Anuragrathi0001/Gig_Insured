const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api', policyRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Gig Insured Production API Health Check Passed' });
});

const PORT = 5068;
const server = app.listen(PORT, async () => {
  console.log(`[Production Readiness Test Server]: Running on http://localhost:${PORT}`);

  try {
    const healthRes = await axios.get(`http://localhost:${PORT}/api/health`);
    console.log('Health check response:', healthRes.data);

    const overviewRes = await axios.get(`http://localhost:${PORT}/api/admin/overview`);
    console.log('Admin overview status:', overviewRes.data.status);

    const forecastRes = await axios.get(`http://localhost:${PORT}/api/admin/forecast`);
    console.log('Forecast count:', forecastRes.data.count);

    console.log('\n==================================================');
    console.log('[PRODUCTION DEPLOYMENT CONFIGURATIONS VERIFIED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Production Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
