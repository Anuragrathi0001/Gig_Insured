const supabase = require('../config/supabase');
const premiumEngine = require('../services/premiumEngine');

// In-memory mock policy store for offline DB fallback
const mockPolicyStore = new Map(); // workerId -> Policy object

/**
 * Get current week's Monday 00:00:00 and Sunday 23:59:59 dates
 */
const getCurrentWeekBounds = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday

  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

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
    const riskProfile = {
      zoneRiskScore: worker.zone_risk_score || worker.riskProfile?.zoneRiskScore || 50,
      weatherExposureScore: worker.weather_exposure_score || worker.riskProfile?.weatherExposureScore || 50
    };
    const quotes = premiumEngine.calculateQuotes(riskProfile);

    return res.status(200).json({
      status: 'success',
      workerZone: worker.zone,
      riskProfile,
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
      upiId: upiId || req.worker.upi_id || req.worker.upiId,
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

    const riskProfile = {
      zoneRiskScore: req.worker.zone_risk_score || 50,
      weatherExposureScore: req.worker.weather_exposure_score || 50
    };
    const quotes = premiumEngine.calculateQuotes(riskProfile);
    const chosenQuote = quotes.find(q => q.tier === tier);

    const { coveragePeriodStart, coveragePeriodEnd } = getCurrentWeekBounds();

    let policy;

    if (process.env.SUPABASE_URL) {
      // Expire any existing active policy for this worker
      await supabase
        .from('policies')
        .update({ status: 'Expired' })
        .eq('worker_id', req.worker.id)
        .eq('status', 'Active');

      const { data, error } = await supabase
        .from('policies')
        .insert({
          worker_id: req.worker.id,
          tier: chosenQuote.tier,
          weekly_premium: chosenQuote.weeklyPremium,
          weekly_benefit_cap: chosenQuote.weeklyBenefitCap,
          coverage_period_start: coveragePeriodStart.toISOString(),
          coverage_period_end: coveragePeriodEnd.toISOString(),
          status: 'Active',
          auto_renew: Boolean(autoRenew ?? true)
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      policy = data;
    } else {
      console.log('[Policy Controller]: Offline mode. Storing policy in-memory.');
      policy = {
        id: `mock_policy_${Date.now()}`,
        worker_id: req.worker.id || req.worker.worker_id,
        tier: chosenQuote.tier,
        weekly_premium: chosenQuote.weeklyPremium,
        weekly_benefit_cap: chosenQuote.weeklyBenefitCap,
        hourly_disruption_rate: chosenQuote.hourlyDisruptionRate,
        coverage_period_start: coveragePeriodStart.toISOString(),
        coverage_period_end: coveragePeriodEnd.toISOString(),
        status: 'Active',
        auto_renew: Boolean(autoRenew ?? true),
        transaction_id: transactionId || `TXN-UPI-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      mockPolicyStore.set(req.worker.id?.toString() || req.worker.mobile, policy);
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
    let policy = null;

    if (process.env.SUPABASE_URL) {
      const { data } = await supabase
        .from('policies')
        .select('*')
        .eq('worker_id', req.worker.id)
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      policy = data || null;
    } else {
      policy = mockPolicyStore.get(req.worker.id?.toString() || req.worker.mobile) || null;
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
