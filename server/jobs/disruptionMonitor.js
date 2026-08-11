const cron = require('node-cron');
const mongoose = require('mongoose');
const { ZoneConfig, TriggerEvent } = require('../models');
const weatherService = require('../services/weatherService');
const platformSignalService = require('../services/platformSignalService');
const zoneData = require('../services/zoneData');
const claimController = require('../controllers/claimController');

// In-memory trigger event store for offline DB fallback
const mockTriggerEventsStore = [];

/**
 * Evaluate Real-Time Disruption Triggers Across All Configured Zones
 * PRD Rule Compliance:
 * 1. Multi-Signal Requirement: >= 2 independent signals (Weather API + Platform Order Drop).
 * 2. Observation Window: Pending for 15 minutes unless bypassed for pitch demo.
 * 3. Immutable TriggerEvent: Insert-only audit logging.
 * 4. Auto Claim Generation: Triggering confirmed events creates zero-manual worker claims.
 */
const evaluateDisruptions = async (bypassObservationWindow = false) => {
  console.log(`\n[Disruption Monitor Cron]: Starting 15-minute trigger evaluation cycle (Bypass Window: ${bypassObservationWindow})...`);

  try {
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let zones = [];

    if (isDbConnected) {
      zones = await ZoneConfig.find({}).lean();
    } else {
      zones = zoneData.getActiveZones();
    }

    const createdTriggers = [];

    for (const zone of zones) {
      const weather = await weatherService.getZoneWeather(zone.zoneName);
      const platformSignals = platformSignalService.getZonePlatformSignals(zone.zoneName);
      const thresholds = zone.triggerThresholds || { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300, floodWaterLevelCm: 15 };

      const signalsUsed = [];
      let primaryDisruptionType = null;

      // 1. Environmental Signal Checks
      if (weather.rainMmPerHour >= thresholds.rainMmPerHour) {
        primaryDisruptionType = 'rain';
        signalsUsed.push(`Weather API Rainfall: ${weather.rainMmPerHour} mm/h (Threshold >= ${thresholds.rainMmPerHour} mm/h)`);
      }
      if (weather.heatTempCelsius >= thresholds.heatTempCelsius) {
        primaryDisruptionType = primaryDisruptionType || 'heat';
        signalsUsed.push(`Weather API Temp: ${weather.heatTempCelsius}°C (Threshold >= ${thresholds.heatTempCelsius}°C)`);
      }
      if (weather.aqi >= thresholds.aqiThreshold) {
        primaryDisruptionType = primaryDisruptionType || 'AQI';
        signalsUsed.push(`Air Quality API AQI: ${weather.aqi} (Threshold >= ${thresholds.aqiThreshold})`);
      }
      if (weather.floodWaterLevelCm >= (thresholds.floodWaterLevelCm || 15)) {
        primaryDisruptionType = primaryDisruptionType || 'flood';
        signalsUsed.push(`Flood Sensor Water Level: ${weather.floodWaterLevelCm} cm (Threshold >= ${thresholds.floodWaterLevelCm || 15} cm)`);
      }

      // 2. Platform Telemetry Signal Checks
      if (platformSignals.orderDropPercentage >= 40) {
        signalsUsed.push(...platformSignals.signalsUsed);
      }
      if (platformSignals.civicDisruptionFlag) {
        primaryDisruptionType = primaryDisruptionType || 'curfew';
        signalsUsed.push('Platform Civic Disruption Alert: Curfew / Strike Flag Active');
      }

      // PRD Multi-Signal Requirement: >= 2 independent signals required to trigger payout
      const hasMultiSignal = signalsUsed.length >= 2;

      if (hasMultiSignal && primaryDisruptionType) {
        const status = bypassObservationWindow ? 'confirmed' : 'pending';
        const now = new Date();

        const triggerPayload = {
          zone: zone.zoneName,
          disruptionType: primaryDisruptionType,
          status,
          signalsUsed,
          confirmedAt: status === 'confirmed' ? now : null,
          observationWindowStart: now,
          dataSnapshot: {
            weatherSnapshot: weather,
            platformSignalsSnapshot: platformSignals,
            thresholdsApplied: thresholds,
            multiSignalVerified: true,
            signalsCount: signalsUsed.length
          },
          timestamp: now
        };

        let triggerDoc = null;
        if (isDbConnected) {
          triggerDoc = await TriggerEvent.create(triggerPayload);
        } else {
          triggerDoc = {
            _id: `trigger_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            ...triggerPayload
          };
          mockTriggerEventsStore.unshift(triggerDoc);
        }

        createdTriggers.push(triggerDoc);
        console.log(`[DISRUPTION TRIGGER CREATED]: Zone=${zone.zoneName} | Type=${primaryDisruptionType} | Status=${status} | Signals=${signalsUsed.length}`);

        // If TriggerEvent is confirmed, automatically generate zero-manual claims for matching policyholders
        if (status === 'confirmed') {
          await claimController.autoCreateClaimsForTrigger(triggerDoc);
        }
      }
    }

    console.log(`[Disruption Monitor Cron]: Cycle completed. Created ${createdTriggers.length} trigger events.\n`);
    return createdTriggers;

  } catch (error) {
    console.error(`[Disruption Monitor Cron Error]: ${error.message}`);
    return [];
  }
};

/**
 * Initialize Node-Cron Scheduler
 */
const initCronJob = () => {
  cron.schedule('*/15 * * * *', () => {
    evaluateDisruptions(false);
  });
  console.log('[Cron Scheduler]: Disruption Monitor Cron initialized (Running every 15 mins)');
};

module.exports = {
  initCronJob,
  evaluateDisruptions,
  mockTriggerEventsStore
};
