const { generateReply } = require('../services/geminiService');
const Tree = require('../models/Tree');
const { calculateImpact } = require('../services/impactService');

// عدد الرسائل الأقصى المقبول في الطلب الواحد (حماية من الإساءة)
const MAX_MESSAGES = 40;
// أقصى طول لرسالة المستخدم الواحدة
const MAX_CONTENT_LENGTH = 2000;

// بناء بلوك مختصر ببيانات المستخدم الحقيقية (للمسجّلين فقط) ليخصّص رد نبتة.
// يبقى صغيراً (أرقام فقط) لتقليل استهلاك التوكنز.
async function buildUserContext(user) {
  if (!user) return null;
  const trees = await Tree.find({ userId: user._id })
    .select('createdAt ageAtPlanting')
    .lean();

  let totalCO2 = 0;
  let totalO2 = 0;
  for (const t of trees) {
    const { co2Absorbed, o2Produced } = calculateImpact(t.createdAt, t.ageAtPlanting);
    totalCO2 += co2Absorbed;
    totalO2 += o2Produced;
  }

  return {
    displayName: user.displayName,
    treesCount: trees.length,
    totalCO2: Math.round(totalCO2),
    totalO2: Math.round(totalO2),
  };
}

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ message: 'صيغة المحادثة غير صحيحة' });
    }

    if (messages.length > MAX_MESSAGES) {
      return res
        .status(400)
        .json({ message: 'المحادثة طويلة جداً، يرجى بدء محادثة جديدة' });
    }

    const valid = messages.every(
      (m) =>
        m &&
        typeof m.role === 'string' &&
        typeof m.content === 'string' &&
        m.content.length <= MAX_CONTENT_LENGTH
    );
    if (!valid) {
      return res
        .status(400)
        .json({ message: 'صيغة الرسائل غير صحيحة' });
    }

    // req.user مُرفق من optionalAuth إن كان المستخدم مسجّلاً (وإلا null)
    const userContext = await buildUserContext(req.user);
    const reply = await generateReply(messages, userContext);
    res.json({ reply });
  } catch (err) {
    console.error('❌ خطأ في المساعدة نبتة:', err.message);

    // حدّ الكوتا/الطلبات (429): رسالة واضحة + ترويسة Retry-After ليعرف الفرونت متى يعيد
    if (err.status === 429) {
      res.set('Retry-After', '15');
      return res.status(429).json({
        message: 'نبتة عليها ضغط هسة 🌱 جرّب تسألني بعد لحظات قليلة.',
      });
    }

    res
      .status(503)
      .json({ message: 'تعذّر الوصول إلى نبتة الآن، يرجى المحاولة بعد قليل 🌱' });
  }
};
