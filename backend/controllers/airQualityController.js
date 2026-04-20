const PROVINCES = [
  { name: 'بغداد',        lat: 33.3152, lng: 44.3661 },
  { name: 'البصرة',       lat: 30.5085, lng: 47.7804 },
  { name: 'نينوى',        lat: 36.3566, lng: 43.1584 },
  { name: 'أربيل',        lat: 36.1912, lng: 44.0092 },
  { name: 'النجف',        lat: 31.9971, lng: 44.3318 },
  { name: 'كربلاء',       lat: 32.6160, lng: 44.0249 },
  { name: 'السليمانية',   lat: 35.5571, lng: 45.4367 },
  { name: 'دهوك',         lat: 36.8669, lng: 42.9503 },
  { name: 'الأنبار',      lat: 33.4258, lng: 43.3000 },
  { name: 'ديالى',        lat: 33.7732, lng: 44.6880 },
  { name: 'كركوك',        lat: 35.4681, lng: 44.3922 },
  { name: 'واسط',         lat: 32.4926, lng: 45.8268 },
  { name: 'بابل',         lat: 32.4740, lng: 44.4220 },
  { name: 'ميسان',        lat: 31.8290, lng: 47.1504 },
  { name: 'ذي قار',       lat: 31.0603, lng: 46.2754 },
  { name: 'المثنى',       lat: 29.3685, lng: 45.2899 },
  { name: 'القادسية',     lat: 32.0449, lng: 44.9259 },
  { name: 'صلاح الدين',   lat: 34.5338, lng: 43.4759 },
];

let cache     = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchProvince(prov) {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${prov.lat}&longitude=${prov.lng}` +
    `&current=pm10,pm2_5,nitrogen_dioxide,ozone`;
  const res  = await fetch(url);
  const data = await res.json();
  const c    = data.current ?? {};
  return {
    name: prov.name,
    pm25: c.pm2_5            != null ? Math.round(c.pm2_5 * 10) / 10 : null,
    pm10: c.pm10             != null ? Math.round(c.pm10  * 10) / 10 : null,
    no2:  c.nitrogen_dioxide != null ? Math.round(c.nitrogen_dioxide * 10) / 10 : null,
    o3:   c.ozone            != null ? Math.round(c.ozone * 10) / 10 : null,
  };
}

exports.getAirQuality = async (req, res) => {
  try {
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      return res.json(cache);
    }

    const provinces = await Promise.all(PROVINCES.map(fetchProvince));
    cache     = { provinces, updatedAt: new Date().toISOString() };
    cacheTime = Date.now();
    res.json(cache);
  } catch {
    res.status(500).json({ message: 'تعذّر جلب بيانات جودة الهواء' });
  }
};
