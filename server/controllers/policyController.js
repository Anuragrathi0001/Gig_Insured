const mongoose = require('mongoose');
const { Policy, Worker, ZoneConfig } = require('../models');
const premiumEngine = require('../services/premiumEngine');

// In-memory mock policy store for offline DB fallback
const mockPolicyStore = new Map(); // workerId -> Policy object

/**
 * Get current week's Monday 00:00:00 and Sunday 23:59:59 dates
 */
const getCurrentWeekBounds = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  
  // Calculate Monday of current week
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Calculate Sunday of current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { coveragePeriodStart: monday, coveragePeriodEnd: sunday };
};

/**
 * @desc    Get weekly premium quotes for all tiers
 * @route   GET /api/premium/quote
 * @access  Private (JWT Protected)
 */
const getPremiumQuotes = async (req, res) => {
  try {
    const worker = req.worker;
    const quotes = premiumEngine.calculateQuotes(worker.riskProfile || {});

    return res.status(200).json({
      status: 'success',
      workerZone: worker.zone,
      riskProfile: worker.riskProfile,
      quotes
    });
  } catch (error) {
    console.error(`[Get Quotes Error]: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate premium quotes'
    });
  }
};

/**
 * @desc    Simulate UPI payment confirmation
 * @route   POST /api/payments/mock-upi
 * @access  Private (JWT Protected)
 */
const mockUpiPayment = async (req, res) => {
  try {
    const { amount, tier, upiId } = req.body;
    const transactionId = `TXN-UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.status(200).json({
      status: 'success',
      message: 'Mock UPI Payment confirmed successfully',
      transactionId,
      amount: Number(amount) || 45,
      tier: tier || 'Standard',
      upiId: upiId || req.worker.upiId,
      paidAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Mock UPI payment failed'
    });
  }
};

/**
 * @desc    Activate weekly insurance policy
 * @route   POST /api/policy/activate
 * @access  Private (JWT Protected)
 */
const activatePolicy = async (req, res) => {
  try {
    const { tier, autoRenew, transactionId } = req.body;

    if (!tier || !['Basic', 'Standard', 'Premium'].includes(tier)) {
      return res.status(400).json({
        status: 'fail',
        message: 'A valid policy tier (Basic, Standard, or Premium) is required.'
      });
    }

    const quotes = premiumEngine.calculateQuotes(req.worker.riskProfile || {});
    const chosenQuote = quotes.find(q => q.tier === tier);

    const { coveragePeriodStart, coveragePeriodEnd } = getCurrentWeekBounds();
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    let policy;

    if (isDbConnected) {
      // Deactivate any existing active policy for the current worker first
      await Policy.updateMany(
        { workerId: req.worker._id, status: 'Active' },
        { status: 'Expired' }
      );

      policy = await Policy.create({
        workerId: req.worker._id,
        tier: chosenQuote.tier,
        weeklyPremium: chosenQuote.weeklyPremium,
        weeklyBenefitCap: chosenQuote.weeklyBenefitCap,
        coveragePeriodStart,
        coveragePeriodEnd,
        status: 'Active',
        autoRenew: Boolean(autoRenew ?? true)
      });
    } else {
      // Offline DB Mock Fallback
      console.log('[Policy Controller]: Offline mode. Storing policy in-memory.');
      policy = {
        _id: `mock_policy_${Date.now()}`,
        workerId: req.worker._id || req.worker.workerId,
        tier: chosenQuote.tier,
        weeklyPremium: chosenQuote.weeklyPremium,
        weeklyBenefitCap: chosenQuote.weeklyBenefitCap,
        hourlyDisruptionRate: chosenQuote.hourlyDisruptionRate,
        coveragePeriodStart,
        coveragePeriodEnd,
        status: 'Active',
        autoRenew: Boolean(autoRenew ?? true),
        transactionId: transactionId || `TXN-UPI-${Date.now()}`,
        createdAt: new Date()
      };
      mockPolicyStore.set(req.worker._id?.toString() || req.worker.mobile, policy);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Policy activated successfully for current coverage week!',
      policy
    });
  } catch (error) {
    console.error(`[Activate Policy Error]: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to activate policy'
    });
  }
};

/**
 * @desc    Get worker's active policy
 * @route   GET /api/policy/active
 * @access  Private (JWT Protected)
 */
const getActivePolicy = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let policy = null;

    if (isDbConnected) {
      policy = await Policy.findOne({
        workerId: req.worker._id,
        status: 'Active'
      }).sort({ createdAt: -1 });
    } else {
      policy = mockPolicyStore.get(req.worker._id?.toString() || req.worker.mobile) || null;
    }

    return res.status(200).json({
      status: 'success',
      hasActivePolicy: Boolean(policy),
      policy
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve active policy'
    });
  }
};

module.exports = {
  getPremiumQuotes,
  mockUpiPayment,
  activatePolicy,
  getActivePolicy,
  mockPolicyStore
};
