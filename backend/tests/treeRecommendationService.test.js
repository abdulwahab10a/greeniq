const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  TREES, rainZone, engineerFeatures, recommend, getNogoAndWarnings,
} = require('../services/treeRecommendationService');

// عيّنة تمثيلية من بيانات التدريب الأصلية (iraq_tree_dataset.csv) — كلها
// سدر/نخيل/بلوط. كل صف: [temp, rain, soil, salinity, region, الشجرة المتوقعة].
const DATASET = [
  [47.4, 135.8, 'clay',    2, 'وسط',       'سدر'],
  [46.2, 139.2, 'clay',    2, 'وسط',       'سدر'],
  [45.0, 96.4,  'sandy',   2, 'وسط-جنوب',  'سدر'],  // النجف
  [45.7, 97.0,  'clay',    2, 'وسط',       'سدر'],  // كربلاء
  [47.0, 100.2, 'sandy',   2, 'غرب',       'سدر'],  // الرمادي
  [42.8, 250.5, 'loamy',   1, 'شمال',      'سدر'],  // الموصل
  [43.2, 292.2, 'loamy',   1, 'شمال',      'سدر'],  // كركوك
  [44.1, 167.9, 'clay',    1, 'شمال',      'سدر'],  // تكريت
  [43.8, 158.0, 'clay',    1, 'وسط',       'سدر'],  // بعقوبة
  [48.2, 110.2, 'saline',  3, 'جنوب',      'نخيل'], // البصرة
  [49.2, 116.5, 'saline',  3, 'جنوب',      'نخيل'],
  [48.6, 120.2, 'saline',  3, 'جنوب',      'نخيل'], // الناصرية
  [47.1, 144.2, 'saline',  3, 'جنوب',      'نخيل'], // العمارة
  [48.1, 111.0, 'saline',  3, 'جنوب',      'نخيل'], // السماوة
  [49.1, 107.1, 'saline',  3, 'جنوب-ساحل', 'نخيل'], // الفاو
  [48.4, 92.8,  'saline',  3, 'جنوب',      'نخيل'], // الزبير
  [39.2, 390.7, 'mountain', 1, 'شمال-جبلي', 'بلوط'], // أربيل
  [36.7, 565.0, 'mountain', 1, 'شمال-جبلي', 'بلوط'], // دهوك
  [36.6, 614.6, 'mountain', 1, 'شمال-جبلي', 'بلوط'], // السليمانية
  [35.4, 594.1, 'mountain', 1, 'شمال-جبلي', 'بلوط'], // حلبجة
];

test('التطبيق يعرّف الأشجار الست بالضبط', () => {
  assert.equal(TREES.length, 6);
  const names = TREES.map((t) => t.nameAr);
  assert.deepEqual(names, ['سدر', 'نخيل', 'بلوط', 'أكاسيا', 'زيتون', 'أثل']);
});

test('كل صفوف بيانات التدريب تُصنَّف إلى شجرتها الصحيحة', () => {
  for (const [temp, rain, soil, salinity, region, expected] of DATASET) {
    const { tree } = recommend({ temp, rain, soil, salinity, region });
    assert.equal(tree.nameAr, expected,
      `فشل التصنيف: temp=${temp} rain=${rain} soil=${soil} sal=${salinity} → توقع ${expected} لكن حصل ${tree.nameAr}`);
  }
});

test('نسبة الثقة بين 0 و100 والاحتمالات تجمع إلى ~100%', () => {
  for (const [temp, rain, soil, salinity, region] of DATASET) {
    const { confidence, probabilities } = recommend({ temp, rain, soil, salinity, region });
    assert.ok(confidence >= 0 && confidence <= 100, `ثقة خارج المدى: ${confidence}`);
    const sum = probabilities.reduce((a, p) => a + p.percent, 0);
    assert.ok(Math.abs(sum - 100) <= 2, `مجموع الاحتمالات ${sum} بعيد عن 100`);
  }
});

test('الاحتمالات تشمل الأشجار الست وأعلاها = الشجرة الموصى بها', () => {
  const { tree, probabilities } = recommend({ temp: 47, rain: 135, soil: 'clay', salinity: 2, region: 'وسط' });
  assert.equal(probabilities.length, 6);
  assert.equal(probabilities[0].nameAr, tree.nameAr); // مرتّبة تنازلياً
});

test('rainZone يطابق حدود النوتبوك [0,100,200,350,500,1000]', () => {
  assert.equal(rainZone(80), 0);
  assert.equal(rainZone(100), 0);
  assert.equal(rainZone(150), 1);
  assert.equal(rainZone(300), 2);
  assert.equal(rainZone(400), 3);
  assert.equal(rainZone(600), 4);
});

test('هندسة المزايا تطابق صيغ النوتبوك', () => {
  const f = engineerFeatures({ temp: 47.4, rain: 135.8, soil: 'clay', salinity: 2, region: 'وسط' });
  // aridity = rain / (temp + 10)
  assert.ok(Math.abs(f.aridityIdx - 135.8 / 57.4) < 1e-9);
  // stress = salinity * temp / 50
  assert.ok(Math.abs(f.stressIdx - (2 * 47.4) / 50) < 1e-9);
  assert.equal(f.isMountain, 0);
  assert.equal(f.rainZone, 1);

  const m = engineerFeatures({ temp: 39.2, rain: 390.7, soil: 'mountain', salinity: 1, region: 'شمال-جبلي' });
  assert.equal(m.isMountain, 1);
  assert.equal(m.rainZone, 3);
});

test('التوصية تُرجع مؤشري الجفاف والإجهاد مقرّبين', () => {
  const { features } = recommend({ temp: 47.4, rain: 135.8, soil: 'clay', salinity: 2, region: 'وسط' });
  assert.equal(features.aridityIdx, Math.round((135.8 / 57.4) * 100) / 100);
  assert.equal(features.stressIdx, Math.round((2 * 47.4 / 50) * 100) / 100);
});

test('منطق "لا تزرع هنا" يعطي 3 بدائل لكل شجرة (ثنائي اللغة)', () => {
  for (let label = 0; label < 6; label++) {
    const { nogo } = getNogoAndWarnings(label, { temp: 46, rain: 120, salinity: 2, confidence: 85 });
    assert.equal(nogo.length, 3, `الشجرة ${label} لا تملك 3 بدائل`);
    for (const n of nogo) {
      assert.ok(n.ar && n.en, `بديل بلا ترجمة كاملة في الشجرة ${label}`);
    }
  }
});

test('تحذير السدر عند أمطار منخفضة جداً (<80مم)', () => {
  const { warnings } = getNogoAndWarnings(0, { temp: 46, rain: 70, salinity: 2, confidence: 85 });
  assert.ok(warnings.some((w) => w.ar.includes('ري مكثف')), 'يجب تحذير الري المكثف للسدر الجاف');
});

test('تحذير البلوط عند ثقة منخفضة (<70%)', () => {
  const { warnings } = getNogoAndWarnings(2, { temp: 40, rain: 400, salinity: 1, confidence: 60 });
  assert.ok(warnings.some((w) => w.ar.includes('فحص ميداني')), 'يجب تحذير الفحص الميداني عند الثقة المنخفضة');
});
