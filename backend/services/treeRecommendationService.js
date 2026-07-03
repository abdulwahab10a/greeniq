// ════════════════════════════════════════════════════════════════════════════
// خدمة توصية الأشجار — منطق نقي (بلا شبكة ولا قاعدة بيانات) قابل للاختبار.
//
// أصلها نوتبوك GreenIQ v5 الذي درّب Random Forest على 6 أشجار عراقية. هنا أُعيد
// بناء منطق القرار كنموذج تسجيل صريح (rule-based scorer) مشتق من نفس بيانات
// التدريب: كل شجرة تحصل على درجة ملاءمة من الظروف البيئية، ثم تُطبّع الدرجات إلى
// احتمالات (كـ predict_proba) لنحصل على أعلى توصية + نسبة ثقة + أشرطة احتمالات
// لكل الأشجار الست. يُحافظ على كل ميزات النوتبوك:
//   • 6 أشجار (سدر، نخيل، بلوط، أكاسيا، زيتون، أثل)
//   • هندسة مزايا (مؤشر الجفاف، مؤشر الإجهاد، منطقة الأمطار، جبلي؟، ترميز التربة/المنطقة)
//   • منطق "لا تزرع هنا" الديناميكي + التحذيرات
//   • أسباب التوصية + إرشادات العناية والري
// المنطق نقي بالكامل ليُغطّى بـ tests/treeRecommendationService.test.js.
// ════════════════════════════════════════════════════════════════════════════

// ── الترميزات (مطابقة للنوتبوك) ──────────────────────────────────────────────
const SOIL_ENC = { clay: 0, saline: 1, sandy: 2, loamy: 3, mountain: 4 };
const REGION_ENC = {
  'وسط': 0, 'جنوب': 1, 'وسط-جنوب': 2, 'غرب': 3,
  'شمال': 4, 'شمال-جبلي': 5, 'جنوب-ساحل': 6,
};
const SOIL_AR = {
  clay: 'طينية', saline: 'ملحية', sandy: 'رملية', loamy: 'طميية', mountain: 'جبلية',
};
const SOIL_EN = {
  clay: 'Clay', saline: 'Saline', sandy: 'Sandy', loamy: 'Loamy', mountain: 'Mountain',
};

// ── تعريف الأشجار الست (ثنائي اللغة) ─────────────────────────────────────────
// label → معلومات العرض. الأسباب والعناية تُرجَع بالعربية والإنجليزية معاً حتى
// تختار الواجهة حسب اللغة دون تضخيم ملف الترجمة.
const TREES = [
  {
    label: 0, key: 'sidr', emoji: '🌲', color: '#16a34a',
    nameAr: 'سدر', nameEn: 'Sidr',
    reasonAr: 'التربة والأمطار والملوحة المتوسطة — السدر المحلي الأنسب.',
    reasonEn: 'Moderate soil, rainfall and salinity — the native Sidr fits best.',
    careAr: 'ري كل 2-3 أسابيع صيفاً. يتحمل الجفاف النسبي.',
    careEn: 'Water every 2–3 weeks in summer. Tolerates relative drought.',
  },
  {
    label: 1, key: 'palm', emoji: '🌴', color: '#dc2626',
    nameAr: 'نخيل', nameEn: 'Date Palm',
    reasonAr: 'الملوحة الشديدة والحرارة — النخيل يتحمل ما لا يتحمله غيره.',
    reasonEn: 'High salinity and heat — the palm endures what others cannot.',
    careAr: 'ري منتظم. يتحمل الملوحة الاستثنائية.',
    careEn: 'Regular watering. Withstands exceptional salinity.',
  },
  {
    label: 2, key: 'oak', emoji: '🌳', color: '#7c3aed',
    nameAr: 'بلوط', nameEn: 'Oak',
    reasonAr: 'الأمطار الغزيرة +500مم والتربة الجبلية — البيئة المثالية.',
    reasonEn: 'Heavy rainfall +500mm and mountain soil — the ideal habitat.',
    careAr: 'يعتمد على الأمطار الطبيعية. لا يحتاج ري إضافي.',
    careEn: 'Relies on natural rainfall. Needs no extra irrigation.',
  },
  {
    label: 3, key: 'acacia', emoji: '🪴', color: '#b45309',
    nameAr: 'أكاسيا', nameEn: 'Acacia',
    reasonAr: 'مناطق رملية شبه جافة وملوحة متوسطة — الأكاسيا سريعة النمو.',
    reasonEn: 'Semi-arid sandy areas with moderate salinity — fast-growing Acacia.',
    careAr: 'ري كل 3-4 أسابيع. تثبّت الرمال وتمنع التصحر.',
    careEn: 'Water every 3–4 weeks. Stabilises sand and curbs desertification.',
  },
  {
    label: 4, key: 'olive', emoji: '🫒', color: '#0369a1',
    nameAr: 'زيتون', nameEn: 'Olive',
    reasonAr: 'أمطار 200-350مم وتربة طميية وملوحة منخفضة — الزيتون يزدهر هنا.',
    reasonEn: 'Rain 200–350mm, loamy soil and low salinity — the olive thrives here.',
    careAr: 'ري خفيف. منتج اقتصادياً ويتحمل الجفاف الصيفي.',
    careEn: 'Light watering. Economically productive and drought-tolerant in summer.',
  },
  {
    label: 5, key: 'athel', emoji: '🌿', color: '#0f766e',
    nameAr: 'أثل', nameEn: 'Athel',
    reasonAr: 'ملوحة شديدة جداً وجفاف — الأثل مقاوم استثنائي ويُصحّح التربة.',
    reasonEn: 'Extreme salinity and drought — Athel is exceptionally resilient and reclaims soil.',
    careAr: 'لا يحتاج ري تقريباً. يُستخدم لاسترداد الأراضي الملحية.',
    careEn: 'Needs almost no watering. Used to reclaim saline land.',
  },
];

const TREE_BY_LABEL = Object.fromEntries(TREES.map((tr) => [tr.label, tr]));

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// ── هندسة المزايا (مطابقة لصيغ النوتبوك) ─────────────────────────────────────
// aridity_idx = أمطار ÷ (حرارة + 10) ، stress_idx = ملوحة × حرارة ÷ 50 ،
// rain_zone = تقطيع الأمطار إلى [0..4] عبر حدود [0,100,200,350,500,1000].
function rainZone(rain) {
  if (rain <= 100) return 0;
  if (rain <= 200) return 1;
  if (rain <= 350) return 2;
  if (rain <= 500) return 3;
  return 4;
}

function engineerFeatures({ temp, rain, soil, salinity, region }) {
  return {
    soilEnc: SOIL_ENC[soil] ?? 0,
    regionEnc: REGION_ENC[region] ?? 0,
    aridityIdx: rain / (temp + 10),
    stressIdx: (salinity * temp) / 50,
    isMountain: soil === 'mountain' ? 1 : 0,
    rainZone: rainZone(rain),
  };
}

// ── نموذج التسجيل — يعيد إنتاج حدود قرار الـ RF المشتقة من بيانات التدريب ───────
// كل دالة تُرجع درجة ملاءمة [0..1] للشجرة في الظروف المعطاة. البيانات الأصلية
// تفصل الأشجار جغرافياً بوضوح: جبلي→بلوط، ملحي حار→نخيل/أثل، غير ذلك→سدر، مع
// أكاسيا/زيتون كبدائل في المناطق الرملية الجافة/الشمالية الأمطر على التوالي.
function treeScores({ temp, rain, soil, salinity }) {
  const saline = soil === 'saline';
  const mountain = soil === 'mountain';

  // بلوط — جبلي + أمطار عالية + حرارة أخفض
  const oak =
    (mountain ? 0.6 : 0) +
    clamp01((rain - 350) / 300) * 0.3 +
    clamp01((42 - temp) / 8) * 0.1;

  // نخيل — ملوحة شديدة + حرارة عالية + تربة ملحية
  const palm =
    clamp01((salinity - 1) / 2) * 0.5 +
    clamp01((temp - 44) / 6) * 0.35 +
    (saline ? 0.15 : 0);

  // أثل — نفس بيئة النخيل (ملوحة/جفاف قصوى) لكنه بديل أدنى فيبقى النخيل الأول
  const athel =
    clamp01((salinity - 1) / 2) * 0.42 +
    (saline ? 0.15 : 0) +
    clamp01((temp - 44) / 6) * 0.13 +
    (salinity >= 3 ? clamp01((110 - rain) / 40) * 0.18 : 0);

  // سدر — واسع الانتشار: تربة طينية/رملية/طميية غير ملحية وملوحة متوسطة
  const sidr =
    (mountain || saline ? 0.05 : 0.6) +
    (salinity <= 2 ? 0.2 : 0) +
    clamp01((temp - 42) / 8) * 0.1;

  // أكاسيا — رملية جافة وملوحة متوسطة (بديل أدنى من السدر)
  const acacia =
    (soil === 'sandy' ? 0.4 : soil === 'clay' ? 0.2 : 0) +
    clamp01((130 - rain) / 60) * 0.2 +
    (salinity === 2 ? 0.12 : 0);

  // زيتون — طميية/طينية شمالية، أمطار 150-350، ملوحة منخفضة، حرارة أخفض
  const olive =
    (soil === 'loamy' ? 0.4 : soil === 'clay' ? 0.22 : 0) +
    clamp01((rain - 150) / 200) * 0.22 +
    (salinity <= 1 ? 0.15 : 0) +
    clamp01((44 - temp) / 8) * 0.08;

  // مرتّبة حسب label 0..5
  return [
    Math.max(0, sidr),
    Math.max(0, palm),
    Math.max(0, oak),
    Math.max(0, acacia),
    Math.max(0, olive),
    Math.max(0, athel),
  ];
}

// تطبيع الدرجات إلى احتمالات مع رفع للأس (gamma) لتوضيح الفائز — يعطي ثقة واقعية
// (~80-92% للحالات الواضحة) وأشرطة احتمالات للأشجار الست كما في النوتبوك.
function scoresToProbs(scores, gamma = 3) {
  const sharpened = scores.map((s) => Math.pow(s, gamma));
  const total = sharpened.reduce((a, b) => a + b, 0) || 1;
  return sharpened.map((s) => s / total);
}

// ── منطق "لا تزرع هنا" + التحذيرات (منقول حرفياً من النوتبوك، ثنائي اللغة) ─────
function getNogoAndWarnings(label, { temp, rain, salinity, confidence }) {
  const nogo = [];
  const warnings = [];

  if (label === 0) { // سدر
    nogo.push(
      { ar: '🌴 نخيل — يحتاج ملوحة أعلى', en: '🌴 Date Palm — needs higher salinity' },
      { ar: '🌳 بلوط — يحتاج أمطار جبلية +500مم', en: '🌳 Oak — needs +500mm mountain rainfall' },
      { ar: '🌿 أثل — للمناطق الملحية الشديدة فقط', en: '🌿 Athel — for severely saline areas only' },
    );
    if (rain < 80) warnings.push({ ar: '⚠️ أمطار منخفضة جداً — يحتاج ري مكثف صيفاً', en: '⚠️ Very low rainfall — needs intensive summer irrigation' });
  } else if (label === 1) { // نخيل
    nogo.push(
      { ar: '🌲 سدر — يتضرر من الملوحة الشديدة', en: '🌲 Sidr — harmed by high salinity' },
      { ar: '🌳 بلوط — يموت في التربة الملحية', en: '🌳 Oak — dies in saline soil' },
      { ar: '🫒 زيتون — يحتاج ملوحة أقل', en: '🫒 Olive — needs lower salinity' },
    );
    if (temp < 44) warnings.push({ ar: '⚠️ الحرارة أقل من المعتاد — تابع النمو الشتوي', en: '⚠️ Lower-than-usual heat — monitor winter growth' });
  } else if (label === 2) { // بلوط
    nogo.push(
      { ar: '🌴 نخيل — يحتاج ملوحة عالية وحرارة شديدة', en: '🌴 Date Palm — needs high salinity and extreme heat' },
      { ar: '🌲 سدر — أنسب للمناطق الجافة والسهلية', en: '🌲 Sidr — better for dry, plain areas' },
      { ar: '🪴 أكاسيا — للمناطق الرملية الجافة', en: '🪴 Acacia — for dry sandy areas' },
    );
    if (rain < 500) warnings.push({ ar: '⚠️ أمطار أقل من 500مم — البلوط في المرتفعات فقط', en: '⚠️ Rainfall below 500mm — Oak only in the highlands' });
    if (confidence < 70) warnings.push({ ar: `⚠️ ثقة ${confidence}% — يُنصح بفحص ميداني`, en: `⚠️ ${confidence}% confidence — a field check is advised` });
  } else if (label === 3) { // أكاسيا
    nogo.push(
      { ar: '🌳 بلوط — يحتاج رطوبة عالية وجبال', en: '🌳 Oak — needs high humidity and mountains' },
      { ar: '🫒 زيتون — يحتاج تربة طميية وأمطار أكثر', en: '🫒 Olive — needs loamy soil and more rain' },
      { ar: '🌿 أثل — للملوحة الشديدة فقط', en: '🌿 Athel — for severe salinity only' },
    );
    if (salinity > 2) warnings.push({ ar: '⚠️ الملوحة مرتفعة — فكّر بالأثل بدلاً من الأكاسيا', en: '⚠️ Salinity is high — consider Athel instead of Acacia' });
  } else if (label === 4) { // زيتون
    nogo.push(
      { ar: '🌴 نخيل — يحتاج ملوحة أعلى بكثير', en: '🌴 Date Palm — needs much higher salinity' },
      { ar: '🌳 بلوط — يحتاج أمطار جبلية أعلى', en: '🌳 Oak — needs higher mountain rainfall' },
      { ar: '🌿 أثل — للمناطق الملحية الشديدة فقط', en: '🌿 Athel — for severely saline areas only' },
    );
    if (rain < 150) warnings.push({ ar: '⚠️ أمطار منخفضة — الزيتون يحتاج ري تكميلي', en: '⚠️ Low rainfall — the olive needs supplemental irrigation' });
  } else if (label === 5) { // أثل
    nogo.push(
      { ar: '🌳 بلوط — يموت في الملوحة الشديدة', en: '🌳 Oak — dies in severe salinity' },
      { ar: '🫒 زيتون — يتضرر من الملوحة العالية', en: '🫒 Olive — harmed by high salinity' },
      { ar: '🌲 سدر — يحتاج ملوحة متوسطة فقط', en: '🌲 Sidr — needs moderate salinity only' },
    );
    warnings.push({ ar: '⚠️ الأثل للاسترداد البيئي — للإنتاج الاقتصادي أضف نخيلاً', en: '⚠️ Athel is for ecological reclamation — add palms for economic yield' });
  }

  return { nogo, warnings };
}

// ── التوصية الكاملة ──────────────────────────────────────────────────────────
// المدخلات: temp (°C)، rain (مم/سنة)، soil (مفتاح إنجليزي)، salinity (1-3)،
// region (اسم منطقة عربي، اختياري). تُرجع كائناً كاملاً جاهزاً للعرض.
function recommend({ temp, rain, soil, salinity, region }) {
  const features = engineerFeatures({ temp, rain, soil, salinity, region });
  const scores = treeScores({ temp, rain, soil, salinity });
  const probs = scoresToProbs(scores);

  let label = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[label]) label = i;
  const confidence = Math.round(probs[label] * 100);

  const tree = TREE_BY_LABEL[label];
  const { nogo, warnings } = getNogoAndWarnings(label, { temp, rain, salinity, confidence });

  // احتمالات كل الأشجار الست (نسبة مئوية) مرتّبة تنازلياً للعرض في أشرطة.
  const probabilities = TREES
    .map((tr) => ({
      label: tr.label, key: tr.key, emoji: tr.emoji, color: tr.color,
      nameAr: tr.nameAr, nameEn: tr.nameEn,
      percent: Math.round(probs[tr.label] * 100),
    }))
    .sort((a, b) => b.percent - a.percent);

  return {
    tree: {
      label: tree.label, key: tree.key, emoji: tree.emoji, color: tree.color,
      nameAr: tree.nameAr, nameEn: tree.nameEn,
      reasonAr: tree.reasonAr, reasonEn: tree.reasonEn,
      careAr: tree.careAr, careEn: tree.careEn,
    },
    confidence,
    probabilities,
    features: {
      aridityIdx: Math.round(features.aridityIdx * 100) / 100,
      stressIdx: Math.round(features.stressIdx * 100) / 100,
      rainZone: features.rainZone,
      isMountain: features.isMountain === 1,
    },
    warnings,
    nogo,
  };
}

module.exports = {
  SOIL_ENC, REGION_ENC, SOIL_AR, SOIL_EN, TREES,
  rainZone, engineerFeatures, treeScores, scoresToProbs,
  getNogoAndWarnings, recommend, clamp01,
};
