// الحدود التقريبية للمحافظات العراقية الـ 18 [lng_min, lng_max, lat_min, lat_max]
const GOVERNORATES = [
  { name: 'بغداد',        lngMin: 44.05, lngMax: 44.90, latMin: 33.05, latMax: 33.70 },
  { name: 'صلاح الدين',   lngMin: 43.00, lngMax: 45.00, latMin: 33.70, latMax: 35.30 },
  { name: 'ديالى',        lngMin: 44.85, lngMax: 46.50, latMin: 33.00, latMax: 34.80 },
  { name: 'الأنبار',      lngMin: 38.50, lngMax: 43.20, latMin: 32.00, latMax: 34.50 },
  { name: 'كركوك',        lngMin: 43.50, lngMax: 44.90, latMin: 34.50, latMax: 36.10 },
  { name: 'السليمانية',   lngMin: 44.80, lngMax: 46.50, latMin: 34.80, latMax: 36.40 },
  { name: 'أربيل',        lngMin: 43.50, lngMax: 45.90, latMin: 35.80, latMax: 37.10 },
  { name: 'دهوك',         lngMin: 42.40, lngMax: 43.80, latMin: 36.80, latMax: 37.40 },
  { name: 'نينوى',        lngMin: 41.20, lngMax: 44.30, latMin: 35.30, latMax: 37.40 },
  { name: 'بابل',         lngMin: 44.00, lngMax: 45.00, latMin: 32.30, latMax: 33.05 },
  { name: 'كربلاء',       lngMin: 43.20, lngMax: 44.05, latMin: 32.30, latMax: 33.05 },
  { name: 'واسط',         lngMin: 45.00, lngMax: 46.60, latMin: 32.00, latMax: 33.50 },
  { name: 'القادسية',     lngMin: 44.20, lngMax: 45.60, latMin: 31.50, latMax: 32.30 },
  { name: 'النجف',        lngMin: 43.00, lngMax: 44.60, latMin: 29.50, latMax: 32.30 },
  { name: 'ذي قار',       lngMin: 45.00, lngMax: 47.50, latMin: 30.50, latMax: 32.00 },
  { name: 'ميسان',        lngMin: 46.50, lngMax: 48.00, latMin: 31.50, latMax: 33.00 },
  { name: 'المثنى',       lngMin: 44.00, lngMax: 47.00, latMin: 28.50, latMax: 30.50 },
  { name: 'البصرة',       lngMin: 46.80, lngMax: 48.60, latMin: 29.50, latMax: 31.50 },
];

// تُرجع اسم المحافظة التي تقع ضمن صندوق حدودها النقطة [lng, lat]، أو null إن لم تُطابق أياً منها
function getGovernorate(lng, lat) {
  for (const gov of GOVERNORATES) {
    if (lng >= gov.lngMin && lng <= gov.lngMax && lat >= gov.latMin && lat <= gov.latMax) {
      return gov.name;
    }
  }
  return null;
}

module.exports = { GOVERNORATES, getGovernorate };
