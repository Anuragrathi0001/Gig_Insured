/**
 * Parametric Disruption Payout Calculation Engine for Gig Insured
 * Implements PRD Formula:
 * Payout = (hoursLost / avgDailyWorkingHours) * dailyWageEquivalent
 * where dailyWageEquivalent = avgWeeklyIncome / 7, capped at tier's weeklyBenefitCap.
 */

const calculatePayout = ({ hoursLost, avgWeeklyIncome, weeklyBenefitCap }) => {
  const hours = Number(hoursLost) || 4;
  const income = Number(avgWeeklyIncome) || 4500;
  const cap = Number(weeklyBenefitCap) || 3000;

  const avgDailyWorkingHours = 8;
  const dailyWageEquivalent = income / 7;
  const hourlyWageEquivalent = dailyWageEquivalent / avgDailyWorkingHours;

  const rawPayout = hours * hourlyWageEquivalent;
  const finalPayout = Math.min(Math.round(rawPayout), cap);

  return {
    hoursLost: hours,
    dailyWageEquivalent: Math.round(dailyWageEquivalent),
    hourlyWageEquivalent: Math.round(hourlyWageEquivalent),
    rawPayout: Math.round(rawPayout),
    payoutAmount: finalPayout,
    weeklyBenefitCap: cap,
    formulaApplied: `(${hours}h / 8h) * ₹${Math.round(dailyWageEquivalent)}/day = ₹${Math.round(rawPayout)} (Capped at ₹${cap})`
  };
};

module.exports = {
  calculatePayout
};
