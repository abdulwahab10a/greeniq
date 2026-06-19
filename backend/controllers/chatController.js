const { generateReply } = require('../services/geminiService');

// عدد الرسائل الأقصى المقبول في الطلب الواحد (حماية من الإساءة)
const MAX_MESSAGES = 40;
// أقصى طول لرسالة المستخدم الواحدة
const MAX_CONTENT_LENGTH = 2000;

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

    const reply = await generateReply(messages);
    res.json({ reply });
  } catch (err) {
    console.error('❌ خطأ في المساعدة نبتة:', err.message);
    res
      .status(503)
      .json({ message: 'تعذّر الوصول إلى نبتة الآن، يرجى المحاولة بعد قليل 🌱' });
  }
};
