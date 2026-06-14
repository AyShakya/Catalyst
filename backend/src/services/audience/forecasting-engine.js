/**
 * Deterministic Forecasting Engine
 * 
 * Based on Catalyst Metrics & Analytics Specification (Frozen V1)
 */

const DEFAULT_RATES = {
  DELIVERY_RATE: 0.90, // 90%
  OPEN_RATE: 0.70,     // 70%
  CTR: 0.30,           // 30%
  CONVERSION_RATE: 0.10 // 10%
};

/**
 * Calculates deterministic forecast based on audience size.
 * 
 * @param {number} audienceSize 
 * @param {Object} customRates - Optional overrides for rates
 * @returns {Object} Forecasted metrics
 */
function calculateForecast(audienceSize, customRates = {}) {
  const rates = { ...DEFAULT_RATES, ...customRates };

  const delivered = Math.round(audienceSize * rates.DELIVERY_RATE);
  const opened = Math.round(delivered * rates.OPEN_RATE);
  const clicked = Math.round(opened * rates.CTR);
  const purchased = Math.round(clicked * rates.CONVERSION_RATE);

  return {
    forecast_delivered: delivered,
    forecast_opened: opened,
    forecast_clicked: clicked,
    forecast_purchased: purchased,
    rates_used: rates
  };
}

module.exports = { calculateForecast, DEFAULT_RATES };
