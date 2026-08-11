const mongoose = require('mongoose');
require('dotenv').config();

const { Worker, ZoneConfig, Policy, TriggerEvent, Claim, FraudFlag } = require('../models');
const zoneData = require('../services/zoneData');
const { mockClaimsStore } = require('../controllers/claimController');
const { mockPolicyStore } = require('../controllers/policyController');
const { mockWorkerStore } = require('../controllers/authController');

const seedData = async () => {
  console.log('==================================================');
  console.log('[GIG INSURED]: Seeding End-to-End Demo Database...');
  console.log('==================================================');

  const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

  const demoZones = [
    {
      _id: 'zone_indiranagar_01',
      zoneName: 'Indiranagar',
      city: 'Bengaluru',
      geoBoundary: {
        type: 'Polygon',
        coordinates: [[[77.63, 12.97], [77.65, 12.97], [77.65, 12.99], [77.63, 12.99], [77.63, 12.97]]]
      },
      triggerThresholds: { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300 },
      premiumBand: { Basic: 25, Standard: 45, Premium: 75 }
    },
    {
      _id: 'zone_koramangala_02',
      zoneName: 'Koramangala',
      city: 'Bengaluru',
      geoBoundary: {
        type: 'Polygon',
        coordinates: [[[77.61, 12.92], [77.63, 12.92], [77.63, 12.94], [77.61, 12.94], [77.61, 12.92]]]
      },
      triggerThresholds: { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300 },
      premiumBand: { Basic: 30, Standard: 50, Premium: 80 }
    },
    {
      _id: 'zone_andheri_03',
      zoneName: 'Andheri West',
      city: 'Mumbai',
      geoBoundary: {
        type: 'Polygon',
        coordinates: [[[72.82, 19.11], [72.84, 19.11], [72.84, 19.13], [72.82, 19.13], [72.82, 19.11]]]
      },
      triggerThresholds: { rainMmPerHour: 25, heatTempCelsius: 38, aqiThreshold: 280 },
      premiumBand: { Basic: 35, Standard: 60, Premium: 95 }
    },
    {
      _id: 'zone_cp_04',
      zoneName: 'Connaught Place',
      city: 'Delhi NCR',
      geoBoundary: {
        type: 'Polygon',
        coordinates: [[[77.21, 28.62], [77.23, 28.62], [77.23, 28.64], [77.21, 28.64], [77.21, 28.62]]]
      },
      triggerThresholds: { rainMmPerHour: 20, heatTempCelsius: 42, aqiThreshold: 350 },
      premiumBand: { Basic: 40, Standard: 65, Premium: 100 }
    }
  ];

  const demoWorkers = [
    { _id: 'w_01', mobile: '9876543210', name: 'Rahul Sharma', city: 'Bengaluru', zone: 'Indiranagar', platform: 'Zomato', workerId: 'ZOM-9921', avgWeeklyIncome: 6500, upiId: 'rahul@paytm' },
    { _id: 'w_02', mobile: '9876543211', name: 'Ananya Roy', city: 'Bengaluru', zone: 'Koramangala', platform: 'Swiggy', workerId: 'SWG-8812', avgWeeklyIncome: 7000, upiId: 'ananya@upi' },
    { _id: 'w_03', mobile: '9876543212', name: 'Vikram Singh', city: 'Mumbai', zone: 'Andheri West', platform: 'Zomato', workerId: 'ZOM-4410', avgWeeklyIncome: 6000, upiId: 'vikram@okicici' },
    { _id: 'w_04', mobile: '9876543213', name: 'Priya Patel', city: 'Delhi NCR', zone: 'Connaught Place', platform: 'Swiggy', workerId: 'SWG-1102', avgWeeklyIncome: 5500, upiId: 'priya@ybl' },
    { _id: 'w_05', mobile: '9876543214', name: 'Devendra Kumar', city: 'Bengaluru', zone: 'Indiranagar', platform: 'Zomato', workerId: 'ZOM-5533', avgWeeklyIncome: 5800, upiId: 'devendra@paytm' }
  ];

  const demoPolicies = [
    { _id: 'pol_01', workerId: 'w_01', zone: 'Indiranagar', tier: 'Standard', weeklyPremium: 45, weeklyBenefitCap: 1500, status: 'Active', autoRenew: true, transactionId: 'TXN-SEED-01' },
    { _id: 'pol_02', workerId: 'w_02', zone: 'Koramangala', tier: 'Premium', weeklyPremium: 80, weeklyBenefitCap: 2500, status: 'Active', autoRenew: true, transactionId: 'TXN-SEED-02' },
    { _id: 'pol_03', workerId: 'w_03', zone: 'Andheri West', tier: 'Basic', weeklyPremium: 35, weeklyBenefitCap: 1000, status: 'Active', autoRenew: true, transactionId: 'TXN-SEED-03' },
    { _id: 'pol_04', workerId: 'w_04', zone: 'Connaught Place', tier: 'Standard', weeklyPremium: 65, weeklyBenefitCap: 1800, status: 'Active', autoRenew: true, transactionId: 'TXN-SEED-04' },
    { _id: 'pol_05', workerId: 'w_05', zone: 'Indiranagar', tier: 'Premium', weeklyPremium: 75, weeklyBenefitCap: 2200, status: 'Active', autoRenew: true, transactionId: 'TXN-SEED-05' }
  ];

  const demoClaims = [
    {
      _id: 'claim_hist_01',
      workerId: 'w_01',
      workerName: 'Rahul Sharma',
      workerMobile: '9876543210',
      workerUpiId: 'rahul@paytm',
      policyId: 'pol_01',
      zoneName: 'Indiranagar',
      claimState: 'Paid',
      payoutAmount: 464,
      fraudRiskScore: 2,
      transactionRef: 'RZP_PYUT_DEMO9981',
      reason: 'Monsoon Heavy Downpour (32mm/h)',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      _id: 'claim_hist_02',
      workerId: 'w_02',
      workerName: 'Ananya Roy',
      workerMobile: '9876543211',
      workerUpiId: 'ananya@upi',
      policyId: 'pol_02',
      zoneName: 'Koramangala',
      claimState: 'Paid',
      payoutAmount: 500,
      fraudRiskScore: 5,
      transactionRef: 'RZP_PYUT_DEMO9982',
      reason: 'Severe Urban Flash Flood (38mm/h)',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ];

  if (isDbConnected) {
    try {
      await ZoneConfig.deleteMany({});
      await Worker.deleteMany({});
      await Policy.deleteMany({});
      await Claim.deleteMany({});
      await TriggerEvent.deleteMany({});
      await FraudFlag.deleteMany({});

      await ZoneConfig.insertMany(demoZones);
      await Worker.insertMany(demoWorkers);
      await Policy.insertMany(demoPolicies);
      await Claim.insertMany(demoClaims);
      console.log('[MongoDB]: Seeded 4 Zones, 5 Workers, 5 Active Policies, and 2 Paid Claims.');
    } catch (err) {
      console.error('[MongoDB Seed Error]:', err.message);
    }
  }

  // Seed In-Memory Store Fallbacks for offline demo resilience
  demoZones.forEach(z => zoneData.addZoneToStore(z));
  demoWorkers.forEach(w => {
    if (mockWorkerStore) {
      mockWorkerStore.set(w.mobile, w);
    }
  });
  demoPolicies.forEach(p => {
    if (mockPolicyStore) {
      mockPolicyStore.set(p.workerId, p);
    }
  });
  demoClaims.forEach(c => {
    if (!mockClaimsStore.find(x => x._id === c._id)) {
      mockClaimsStore.push(c);
    }
  });

  console.log('[In-Memory Store]: Hydrated offline fallbacks.');
  console.log('==================================================');
  console.log('[SEED COMPLETE]: Demo Environment Ready for Pitching!');
  console.log('==================================================\n');
};

// Execute if run directly
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gig-insured';
  mongoose.connect(MONGO_URI)
    .then(() => seedData())
    .catch(() => seedData())
    .finally(() => {
      setTimeout(() => process.exit(0), 1000);
    });
}

module.exports = seedData;
