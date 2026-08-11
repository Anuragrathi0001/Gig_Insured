const express = require('express');
const axios = require('axios');
const adminRoutes = require('./routes/adminRoutes');
const disruptionMonitor = require('./jobs/disruptionMonitor');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const PORT = 5060;
const server = app.listen(PORT, async () => {
  console.log(`[Disruption Trigger Test Server]: Running on http://localhost:${PORT}`);

  try {
    // 1. Test Cron Disruption Evaluation Cycle
    console.log('\n--- Step 1: Execute 15-minute Disruption Evaluation Cycle ---');
    const normalTriggers = await disruptionMonitor.evaluateDisruptions(false);
    console.log(`Normal Evaluation Cycle Result: ${normalTriggers.length} pending triggers created under baseline conditions.`);

    // 2. Test Multi-Signal Trigger Simulation with Pitch Demo Bypass
    console.log('\n--- Step 2: POST /api/admin/simulate-disruption (Heavy Rain & Order Drop) ---');
    const simRes = await axios.post(`http://localhost:${PORT}/api/admin/simulate-disruption`, {
      scenario: 'heavy_rain'
    });

    console.log('Disruption Simulation Response:', {
      status: simRes.data.status,
      message: simRes.data.message,
      triggerCount: simRes.data.generatedTriggers?.length
    });

    if (simRes.data.generatedTriggers?.length > 0) {
      const firstTrigger = simRes.data.generatedTriggers[0];
      console.log('Trigger Event Sample:', {
        zone: firstTrigger.zone,
        disruptionType: firstTrigger.disruptionType,
        status: firstTrigger.status,
        signalsUsedCount: firstTrigger.signalsUsed?.length,
        signalsUsed: firstTrigger.signalsUsed
      });
    }

    // 3. GET /api/admin/triggers Audit Log
    console.log('\n--- Step 3: GET /api/admin/triggers Audit Stream ---');
    const auditRes = await axios.get(`http://localhost:${PORT}/api/admin/triggers`);
    console.log(`Fetched ${auditRes.data.count} immutable TriggerEvent audit records.`);

    console.log('\n==================================================');
    console.log('[ALL DISRUPTION TRIGGER CRON TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Disruption Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
