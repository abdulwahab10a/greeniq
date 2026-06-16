const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateImpact } = require('../services/impactService');

// daysSincePlanting يُحسب من تاريخ اليوم؛ بتمرير اليوم كتاريخ زراعة يصبح = 0،
// فيصير إجمالي العمر مساوياً تماماً لـ ageAtPlantingDays — ما يجعل الاختبار حتمياً.
const today = () => new Date();

test('عند الزراعة (0 يوم): الرصيد الأساسي فقط', () => {
  const { co2Absorbed, o2Produced } = calculateImpact(today(), 0);
  assert.equal(co2Absorbed, 5);
  assert.equal(o2Produced, 3.65); // 5 × 0.73
});

test('نهاية المرحلة الأولى (365 يوم) بالضبط', () => {
  const { co2Absorbed, o2Produced } = calculateImpact(today(), 365);
  assert.equal(co2Absorbed, 11); // 5 + (6/365)×365
  assert.equal(o2Produced, 8.03); // 11 × 0.73
});

test('نهاية المرحلة الثانية (1095 يوم) بالضبط', () => {
  const { co2Absorbed, o2Produced } = calculateImpact(today(), 1095);
  assert.equal(co2Absorbed, 39); // 5 + 6 + (14/365)×730
  assert.equal(o2Produced, 28.47); // 39 × 0.73
});

test('المرحلة الثالثة (4 سنوات = 1460 يوم)', () => {
  const { co2Absorbed } = calculateImpact(today(), 1460);
  assert.equal(co2Absorbed, 61); // 5 + 6 + 28 + (22/365)×365
});

test('O₂ يساوي دائماً 73% من CO₂', () => {
  for (const age of [0, 100, 500, 1200, 3000]) {
    const { co2Absorbed, o2Produced } = calculateImpact(today(), age);
    assert.equal(o2Produced, parseFloat((co2Absorbed * 0.73).toFixed(2)));
  }
});

test('التأثير لا يتناقص مع تقدّم العمر (تزايد رتيب)', () => {
  let prev = -Infinity;
  for (const age of [0, 364, 365, 366, 1094, 1095, 1096, 5000]) {
    const { co2Absorbed } = calculateImpact(today(), age);
    assert.ok(co2Absorbed >= prev, `تراجع غير متوقع عند ${age} يوم`);
    prev = co2Absorbed;
  }
});

test('العمر السالب عند الزراعة يُقصّ إلى صفر', () => {
  const neg = calculateImpact(today(), -500);
  const zero = calculateImpact(today(), 0);
  assert.deepEqual(neg, zero);
});

test('تاريخ زراعة في المستقبل يُقصّ إلى صفر يوم', () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const { co2Absorbed } = calculateImpact(tomorrow, 0);
  assert.equal(co2Absorbed, 5);
});
