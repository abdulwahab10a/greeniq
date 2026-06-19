const {
  generateReply,
  openGeminiStream,
  extractTextFromSSE,
} = require('../services/geminiService');
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

// تحقّق من صيغة الرسائل؛ يرجّع رسالة خطأ عربية أو null إن كانت صحيحة
function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'صيغة المحادثة غير صحيحة';
  }
  if (messages.length > MAX_MESSAGES) {
    return 'المحادثة طويلة جداً، يرجى بدء محادثة جديدة';
  }
  const valid = messages.every(
    (m) =>
      m &&
      typeof m.role === 'string' &&
      typeof m.content === 'string' &&
      m.content.length <= MAX_CONTENT_LENGTH
  );
  return valid ? null : 'صيغة الرسائل غير صحيحة';
}

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;
    const validationError = validateMessages(messages);
    if (validationError) {
      return res.status(400).json({ message: validationError });
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

// بثّ الرد كلمة-كلمة عبر SSE
exports.chatStream = async (req, res) => {
  const { messages } = req.body;
  const validationError = validateMessages(messages);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  // نفتح بثّ Gemini أولاً حتى نتمكّن من إرجاع خطأ JSON صحيح قبل بدء البثّ
  let geminiStream;
  try {
    const userContext = await buildUserContext(req.user);
    geminiStream = await openGeminiStream(messages, userContext);
  } catch (err) {
    console.error('❌ خطأ في بثّ نبتة:', err.message);
    if (err.status === 429) {
      res.set('Retry-After', '15');
      return res.status(429).json({ message: 'نبتة عليها ضغط هسة 🌱 جرّب تسألني بعد لحظات قليلة.' });
    }
    return res.status(503).json({ message: 'تعذّر الوصول إلى نبتة الآن، يرجى المحاولة بعد قليل 🌱' });
  }

  // فتح قناة SSE نحو العميل (X-Accel-Buffering: no يمنع تخزين الوسيط المؤقّت)
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  let buffer = '';
  geminiStream.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop(); // نحتفظ بالسطر غير المكتمل
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      const text = extractTextFromSSE(payload);
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  });

  geminiStream.on('end', () => {
    res.write('data: [DONE]\n\n');
    res.end();
  });

  geminiStream.on('error', (err) => {
    console.error('❌ انقطاع بثّ نبتة:', err.message);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  // إيقاف بثّ Gemini إذا أغلق العميل الاتصال
  req.on('close', () => geminiStream.destroy?.());
};
