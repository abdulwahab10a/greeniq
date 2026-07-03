const { fetchEnvironment, CITIES } = require('../services/environmentDataService');
const { recommend } = require('../services/treeRecommendationService');

// ذاكرة تخزين مؤقت بسيطة على الإحداثيات المقرّبة (شبكة ~1كم) لمدة ساعة — تحمي
// مصادر البيانات المجانية (Open-Meteo / SoilGrids / Overpass) من الطلبات المكررة.
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // ساعة
const CACHE_MAX = 500;
const key = (lat, lng) => `${lat.toFixed(2)},${lng.toFixed(2)}`;

// حدود العراق التقريبية للتحقق من المدخلات
const IRAQ_BOUNDS = { latMin: 28.5, latMax: 37.5, lngMin: 38.5, lngMax: 49.5 };

function buildResult(env) {
  const rec = recommend({
    temp: env.temp,
    rain: env.rain,
    soil: env.soil,
    salinity: env.salinity,
    region: env.region,
  });
  return { environment: env, recommendation: rec, generatedAt: new Date().toISOString() };
}

// GET /api/recommendation?lat=&lng=
exports.getRecommendation = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ message: 'يرجى تحديد إحداثيات صحيحة (lat و lng)' });
  }
  if (
    lat < IRAQ_BOUNDS.latMin || lat > IRAQ_BOUNDS.latMax ||
    lng < IRAQ_BOUNDS.lngMin || lng > IRAQ_BOUNDS.lngMax
  ) {
    return res.status(400).json({ message: 'الموقع المحدد خارج حدود العراق' });
  }

  try {
    const k = key(lat, lng);
    const hit = cache.get(k);
    if (hit && Date.now() - hit.time < CACHE_TTL) {
      return res.json(hit.data);
    }

    const env = await fetchEnvironment(lat, lng);
    const data = buildResult(env);

    // إخلاء أقدم إدخال إذا امتلأت الذاكرة (حماية من التضخّم)
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(k, { time: Date.now(), data });

    res.json(data);
  } catch {
    res.status(500).json({ message: 'تعذّر توليد التوصية، يرجى المحاولة لاحقاً' });
  }
};

// GET /api/recommendation/cities — قائمة المدن الـ22 للاختيار السريع في الواجهة
exports.getCities = (req, res) => {
  res.json(CITIES.map(({ name, lat, lng, region }) => ({ name, lat, lng, region })));
};
