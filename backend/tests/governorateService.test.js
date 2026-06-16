const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GOVERNORATES, getGovernorate } = require('../services/governorateService');

test('عدد المحافظات 18', () => {
  assert.equal(GOVERNORATES.length, 18);
});

test('نقطة وسط بغداد تُنسب لبغداد', () => {
  assert.equal(getGovernorate(44.40, 33.35), 'بغداد');
});

test('نقطة وسط البصرة تُنسب للبصرة', () => {
  assert.equal(getGovernorate(47.80, 30.50), 'البصرة');
});

test('نقطة وسط أربيل تُنسب لأربيل', () => {
  assert.equal(getGovernorate(44.00, 36.20), 'أربيل');
});

test('نقطة خارج حدود العراق تُرجع null', () => {
  assert.equal(getGovernorate(0, 0), null);        // المحيط الأطلسي
  assert.equal(getGovernorate(35.0, 50.0), null);  // أوروبا الشرقية
});

test('عند تداخل الحدود تفوز أول محافظة في الترتيب (بغداد قبل بابل)', () => {
  // 33.05 هي الحافة المشتركة بين بغداد (latMin) وبابل (latMax)؛
  // الدالة تُرجع أول تطابق، وبغداد تسبق بابل في المصفوفة.
  assert.equal(getGovernorate(44.05, 33.05), 'بغداد');
});

test('كل صندوق حدود صالح (min < max)', () => {
  for (const g of GOVERNORATES) {
    assert.ok(g.lngMin < g.lngMax, `حدود طول خاطئة في ${g.name}`);
    assert.ok(g.latMin < g.latMax, `حدود عرض خاطئة في ${g.name}`);
  }
});

test('مركز كل صندوق حدود يُنسب لمحافظة ما (ليس null)', () => {
  for (const g of GOVERNORATES) {
    const cLng = (g.lngMin + g.lngMax) / 2;
    const cLat = (g.latMin + g.latMax) / 2;
    assert.notEqual(getGovernorate(cLng, cLat), null, `مركز ${g.name} لم يُطابق أي محافظة`);
  }
});
