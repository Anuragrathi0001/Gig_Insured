/**
 * Risk-Adjusted Premium Pricing Engine for Gig Insured
 * Calculates weekly premium quotes per tier based on worker risk scores and zone bands.
 */

const BASE_TIERS = {
  Basic: {
    tier: 'Basic',
    name: 'Starter Wage Guard',
    basePremium: 25, // Base ₹25/week
    weeklyBenefitCap: 1500, // Max payout ₹1,500/week
    hourlyDisruptionRate: 150, // ₹150 per unworkable hour
    description: 'Essential coverage for part-time delivery partners'
  },
  Standard: {
    tier: 'Standard',
    name: 'Pro Delivery Shield',
    basePremium: 45, // Base ₹45/week
    weeklyBenefitCap: 3000, // Max payout ₹3,000/week
    hourlyDisruptionRate: 250, // ₹250 per unworkable hour
    description: 'Recommended for full-time Swiggy & Zomato partners'
  },
  Premium: {
    tier: 'Premium',
    name: 'Max Protection Ultra',
    basePremium: 75, // Base ₹75/week
    weeklyBenefitCap: 5000, // Max payout ₹5,000/week
    hourlyDisruptionRate: 400, // ₹400 per unworkable hour
    description: 'Maximum income safeguard with priority UPI payouts'
  }
};

/**
 * Calculate Tier Quotes for a Worker
 * 
 * TODO: Replace this rule-based multiplier function with the real ML Dynamic-Pricing
 * Model microservice described in the PRD (which adjusts premiums dynamically based on
 * real-time weather forecasts, urban traffic risk, and ensemble claims risk models).
 */
const calculateQuotes = (riskProfile = {}, zoneConfigBands = null) => {
  const zoneScore = Number(riskProfile.zoneRiskScore) || 50;
  const weatherScore = Number(riskProfile.weatherExposureScore) || 50;

  // Composite risk factor centered around 1.0 (range 0.8x to 1.4x)
  const combinedRisk = (zoneScore + weatherScore) / 2;
  const riskMultiplier = 0.8 + (combinedRisk / 100) * 0.6;

  const quotes = Object.keys(BASE_TIERS).map(tierKey => {
    const baseTier = BASE_TIERS[tierKey];
    
    // Override base premium if zone-specific pricing band exists
    const zoneBasePremium = zoneConfigBands && zoneConfigBands[tierKey]
      ? zoneConfigBands[tierKey]
      : baseTier.basePremium;

    const calculatedPremium = Math.round(zoneBasePremium * riskMultiplier);

    return {
      tier: baseTier.tier,
      name: baseTier.name,
      weeklyPremium: calculatedPremium,
      basePremium: zoneBasePremium,
      weeklyBenefitCap: baseTier.weeklyBenefitCap,
      hourlyDisruptionRate: baseTier.hourlyDisruptionRate,
      description: baseTier.description,
      riskMultiplier: Math.round(riskMultiplier * 100) / 100
    };
  });

  return quotes;
};

module.exports = {
  calculateQuotes,
  BASE_TIERS
};
