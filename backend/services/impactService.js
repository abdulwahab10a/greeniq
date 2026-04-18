// Points-based daily accumulation system
// Scientific approximations:
//   Young sapling (0-1 yr):  ~6 kg CO2/year  = 0.0164 kg/day
//   Growing tree (1-3 yrs): ~14 kg CO2/year  = 0.0384 kg/day
//   Mature tree   (3+ yrs): ~22 kg CO2/year  = 0.0603 kg/day
//   O2 produced = CO2 absorbed × 0.73
//   Base credit of 5 kg CO2 at planting (sapling grew in nursery before logging)

function calculateImpact(plantingDate) {
  const now = new Date();
  const planted = new Date(plantingDate);
  const days = Math.max(0, Math.floor((now - planted) / (1000 * 60 * 60 * 24)));

  const BASE_CO2    = 5;        // kg — immediate nursery-sapling credit
  const PHASE1_RATE = 6  / 365; // kg/day  (year 0–1)
  const PHASE2_RATE = 14 / 365; // kg/day  (year 1–3)
  const PHASE3_RATE = 22 / 365; // kg/day  (year 3+)

  let accumulated = 0;

  if (days <= 365) {
    accumulated = PHASE1_RATE * days;
  } else if (days <= 1095) {
    accumulated = PHASE1_RATE * 365
                + PHASE2_RATE * (days - 365);
  } else {
    accumulated = PHASE1_RATE * 365
                + PHASE2_RATE * 730
                + PHASE3_RATE * (days - 1095);
  }

  const co2Absorbed = parseFloat((BASE_CO2 + accumulated).toFixed(2));
  const o2Produced  = parseFloat((co2Absorbed * 0.73).toFixed(2));

  return { co2Absorbed, o2Produced };
}

module.exports = { calculateImpact };
