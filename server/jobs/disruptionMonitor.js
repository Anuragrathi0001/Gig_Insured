const cron = require('node-cron');
const supabase = require('../config/supabase');
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
    let zones = [];

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase.from('zone_configs').select('*');
      if (error) throw new Error(error.message);
      zones = data || [];
    } else {
      zones = zoneData.getActiveZones();
    }

    const createdTriggers = [];

    for (const zone of zones) {
      // Support both snake_case (Supabase) and camelCase (in-memory) zone name fields
      const zoneName = zone.zone_name || zone.zoneName;
      const thresholds = zone.trigger_thresholds || zone.triggerThresholds || {
        rainMmPerHour: 20,
        heatTempCelsius: 40,
        aqiThreshold: 300,
        floodWaterLevelCm: 15
      };

      const weather = await weatherService.getZoneWeather(zoneName);
      const platformSignals = platformSignalService.getZonePlatformSignals(zoneName);

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

      // PRD Multi-Signal Requirement: >= 2 independent signals required
      const hasMultiSignal = signalsUsed.length >= 2;

      if (hasMultiSignal && primaryDisruptionType) {
        const status = bypassObservationWindow ? 'confirmed' : 'pending';
        const now = new Date();

        const triggerPayload = {
          zone: zoneName,
          disruption_type: primaryDisruptionType,
          status,
          signals_used: signalsUsed,
          confirmed_at: status === 'confirmed' ? now.toISOString() : null,
          observation_window_start: now.toISOString(),
          data_snapshot: {
            weatherSnapshot: weather,
            platformSignalsSnapshot: platformSignals,
            thresholdsApplied: thresholds,
            multiSignalVerified: true,
            signalsCount: signalsUsed.length
          },
          timestamp: now.toISOString()
        };

        let triggerDoc = null;

        if (process.env.SUPABASE_URL) {
          const { data: inserted, error } = await supabase
            .from('trigger_events')
            .insert(triggerPayload)
            .select()
            .single();

          if (error) {
            console.error(`[Trigger Insert Error]: ${error.message}`);
            continue;
          }
          triggerDoc = inserted;
        } else {
          triggerDoc = {
            id: `trigger_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            ...triggerPayload,
            // Keep camelCase aliases for backward compat with in-memory claim processing
            disruptionType: primaryDisruptionType,
            signalsUsed,
            confirmedAt: triggerPayload.confirmed_at
          };
          mockTriggerEventsStore.unshift(triggerDoc);
        }

        createdTriggers.push(triggerDoc);
        console.log(`[DISRUPTION TRIGGER CREATED]: Zone=${zoneName} | Type=${primaryDisruptionType} | Status=${status} | Signals=${signalsUsed.length}`);

        // If confirmed, automatically generate zero-manual claims for matching policyholders
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
