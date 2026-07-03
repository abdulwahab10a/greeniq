// ════════════════════════════════════════════════════════════════════════════
// خدمة البيانات البيئية الحيّة — الطبقة الشبكية لنظام توصية الأشجار.
//
// تجلب لأي إحداثي في العراق: الحرارة + رطوبة التربة (Open-Meteo)، الأمطار
// السنوية 2023 (Open-Meteo Archive)، نوع التربة (SoilGrids ISRIC)، وعدد الأشجار
// الموجودة (OpenStreetMap/Overpass) — تماماً كخلية النوتبوك الثالثة. كل مصدر له
// مهلة قصيرة و«fallback» من قيم المدن المخزّنة، وتُرفَق شارة (real/estimate) لكل
// حقل ليعرض الواجهة مصدره. المنطق التقديري (الملوحة، تصنيف التربة، أقرب مدينة)
// نقيّ ومُصدَّر ليُختبَر.
// ════════════════════════════════════════════════════════════════════════════

const { getGovernorate } = require('./governorateService');

// ── مدن العراق الـ22 (من النوتبوك) مع قيم fallback مخزّنة ─────────────────────
const CITIES = [
  { name: 'بغداد',      lat: 33.3152, lng: 44.3661, region: 'وسط',        temp: 47.3, rain: 138.0, soil: 'clay' },
  { name: 'البصرة',     lat: 30.5085, lng: 47.7804, region: 'جنوب',       temp: 48.8, rain: 110.0, soil: 'saline' },
  { name: 'الموصل',     lat: 36.3566, lng: 43.1597, region: 'شمال',       temp: 42.4, rain: 248.0, soil: 'loamy' },
  { name: 'أربيل',      lat: 36.1901, lng: 44.0091, region: 'شمال-جبلي',  temp: 39.3, rain: 401.0, soil: 'mountain' },
  { name: 'الناصرية',   lat: 31.0580, lng: 46.2661, region: 'جنوب',       temp: 48.2, rain: 122.0, soil: 'saline' },
  { name: 'العمارة',    lat: 31.8384, lng: 47.1494, region: 'جنوب',       temp: 46.8, rain: 135.0, soil: 'saline' },
  { name: 'كركوك',      lat: 35.4681, lng: 44.3922, region: 'شمال',       temp: 43.1, rain: 278.0, soil: 'loamy' },
  { name: 'السليمانية', lat: 35.5578, lng: 45.4351, region: 'شمال-جبلي',  temp: 37.3, rain: 609.0, soil: 'mountain' },
  { name: 'الحلة',      lat: 32.4722, lng: 44.4419, region: 'وسط',        temp: 46.4, rain: 122.0, soil: 'clay' },
  { name: 'النجف',      lat: 31.9904, lng: 44.3300, region: 'وسط-جنوب',   temp: 45.9, rain: 91.0,  soil: 'sandy' },
  { name: 'كربلاء',     lat: 32.6160, lng: 44.0243, region: 'وسط',        temp: 45.5, rain: 106.0, soil: 'clay' },
  { name: 'الرمادي',    lat: 33.4232, lng: 43.2982, region: 'غرب',        temp: 46.2, rain: 105.0, soil: 'sandy' },
  { name: 'بعقوبة',     lat: 33.7430, lng: 44.6390, region: 'وسط',        temp: 44.7, rain: 166.0, soil: 'clay' },
  { name: 'السماوة',    lat: 31.3188, lng: 45.2783, region: 'جنوب',       temp: 47.3, rain: 104.0, soil: 'saline' },
  { name: 'الديوانية',  lat: 31.9926, lng: 44.9269, region: 'وسط-جنوب',   temp: 46.1, rain: 95.5,  soil: 'clay' },
  { name: 'تكريت',      lat: 34.6057, lng: 43.6793, region: 'شمال',       temp: 44.5, rain: 182.0, soil: 'clay' },
  { name: 'دهوك',       lat: 36.8670, lng: 42.9903, region: 'شمال-جبلي',  temp: 37.8, rain: 559.0, soil: 'mountain' },
  { name: 'الفلوجة',    lat: 33.3453, lng: 43.7762, region: 'غرب',        temp: 46.1, rain: 111.0, soil: 'sandy' },
  { name: 'الرطبة',     lat: 33.3744, lng: 40.2794, region: 'غرب',        temp: 44.0, rain: 82.0,  soil: 'sandy' },
  { name: 'حلبجة',      lat: 35.1787, lng: 45.9862, region: 'شمال-جبلي',  temp: 35.9, rain: 590.0, soil: 'mountain' },
  { name: 'الفاو',      lat: 29.9742, lng: 48.4690, region: 'جنوب-ساحل',  temp: 48.9, rain: 112.0, soil: 'saline' },
  { name: 'الزبير',     lat: 30.3897, lng: 47.7078, region: 'جنوب',       temp: 48.5, rain: 99.0,  soil: 'saline' },
];

// ── دوال تقديرية نقيّة (تُختبَر بلا شبكة) ─────────────────────────────────────

// أقرب مدينة بالمسافة الإقليدية على (lat,lng) — تُستخدم لقيم الـ fallback.
function nearestCity(lat, lng) {
  let best = CITIES[0];
  let bestDist = Infinity;
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// تقدير الملوحة (1-3) جغرافياً — منطق est_sal من النوتبوك.
function estimateSalinity(lat, lng) {
  if (lat < 31.5 && lng > 46) return { level: 3, noteAr: 'جنوب — ملوحة عالية', noteEn: 'South — high salinity' };
  if (lat >= 35.5) return { level: 1, noteAr: 'شمال جبلي — منخفضة', noteEn: 'Northern highlands — low' };
  if (lat >= 33.27 && lat <= 33.40 && lng <= 44.50) return { level: 1, noteAr: 'قريب دجلة — منخفضة', noteEn: 'Near the Tigris — low' };
  if (lat >= 32) return { level: 2, noteAr: 'وسط — متوسطة', noteEn: 'Central — moderate' };
  return { level: 2, noteAr: 'جنوب وسط — متوسطة', noteEn: 'South-central — moderate' };
}

// تصنيف التربة من نسب SoilGrids (رمل/طين/حموضة) + خط العرض — منطق get_soil.
function classifySoil({ sand, clay, ph, lat }) {
  if (lat >= 35.5) return 'mountain';
  if (sand >= 65) return 'sandy';
  if (clay >= 40) return 'clay';
  if (ph > 8.2) return 'saline';
  return 'loamy';
}

// ── جلب شبكي مع مهلة (AbortController) ────────────────────────────────────────
async function fetchJson(url, { timeout = 10000, ...opts } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getWeather(lat, lng) {
  try {
    const data = await fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,soil_moisture_0_to_7cm&timezone=auto`,
      { timeout: 8000 }
    );
    const c = data.current ?? {};
    return {
      temp: c.temperature_2m != null ? Math.round(c.temperature_2m * 10) / 10 : null,
      moisture: c.soil_moisture_0_to_7cm != null ? Math.round(c.soil_moisture_0_to_7cm * 100 * 100) / 100 : null,
      real: c.temperature_2m != null,
    };
  } catch {
    return { temp: null, moisture: null, real: false };
  }
}

async function getRain(lat, lng) {
  try {
    const data = await fetchJson(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
      `&start_date=2023-01-01&end_date=2023-12-31&daily=precipitation_sum&timezone=auto`,
      { timeout: 10000 }
    );
    const vals = data.daily?.precipitation_sum ?? [];
    const total = Math.round(vals.reduce((a, v) => a + (v || 0), 0) * 10) / 10;
    return { rain: total > 0 ? total : null, real: total > 0 };
  } catch {
    return { rain: null, real: false };
  }
}

async function getSoil(lat, lng) {
  try {
    const data = await fetchJson(
      `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}` +
      `&property=sand&property=clay&property=phh2o&depth=0-5cm&value=mean`,
      { timeout: 12000 }
    );
    const layers = data.properties?.layers ?? [];
    const vals = {};
    for (const l of layers) {
      const v = l.depths?.[0]?.values?.mean;
      if (v != null) vals[l.name] = v / 10;
    }
    const sand = vals.sand ?? 50;
    const clay = vals.clay ?? 25;
    const ph = (vals.phh2o ?? 70) / 10;
    const soil = classifySoil({ sand, clay, ph, lat });
    return { soil, sand: Math.round(sand * 10) / 10, clay: Math.round(clay * 10) / 10, ph: Math.round(ph * 10) / 10, real: true };
  } catch {
    return { soil: null, sand: null, clay: null, ph: null, real: false };
  }
}

async function getExistingTrees(lat, lng) {
  try {
    const query = `[out:json][timeout:8];node["natural"="tree"](around:80,${lat},${lng});out count;`;
    const data = await fetchJson('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      timeout: 10000,
    });
    const count = parseInt(data.elements?.[0]?.tags?.total ?? 0, 10) || 0;
    return { hasTrees: count > 0, count, real: true };
  } catch {
    return { hasTrees: false, count: 0, real: false };
  }
}

// ── التجميع: يجلب كل المصادر بالتوازي مع fallback من أقرب مدينة ────────────────
async function fetchEnvironment(lat, lng) {
  const fb = nearestCity(lat, lng);
  const [weather, rainData, soilData, treesData] = await Promise.all([
    getWeather(lat, lng),
    getRain(lat, lng),
    getSoil(lat, lng),
    getExistingTrees(lat, lng),
  ]);
  const sal = estimateSalinity(lat, lng);
  const govern = getGovernorate(lng, lat);

  return {
    lat, lng,
    nearestCity: fb.name,
    region: fb.region,
    governorate: govern,
    temp: weather.temp ?? fb.temp,
    tempReal: weather.real,
    moisture: weather.moisture ?? 5.0,
    moistureReal: weather.real,
    rain: rainData.rain ?? fb.rain,
    rainReal: rainData.real,
    soil: soilData.soil ?? fb.soil,
    soilReal: soilData.real,
    sand: soilData.sand,
    clay: soilData.clay,
    ph: soilData.ph,
    salinity: sal.level,
    salinityNoteAr: sal.noteAr,
    salinityNoteEn: sal.noteEn,
    hasTrees: treesData.hasTrees,
    treeCount: treesData.count,
    treesReal: treesData.real,
  };
}

module.exports = {
  CITIES, nearestCity, estimateSalinity, classifySoil,
  getWeather, getRain, getSoil, getExistingTrees, fetchEnvironment,
};
