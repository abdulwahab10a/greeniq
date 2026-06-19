const axios = require('axios');
require('dotenv').config();

// شخصية المساعدة "نبتة" — تُمرَّر إلى Gemini عبر system_instruction
const NABTA_SYSTEM_PROMPT = `اسمك (نبتة) 🌱، المساعدة الذكية لتطبيق GreenIQ لتتبّع زراعة الأشجار وقياس الأثر البيئي. تحدّثي بالعربية بشخصية ودودة ومشجّعة بصيغة المؤنث. عرّفي عن نفسك بهذا الاسم في أول رسالة. مهمتك: شرح طريقة زراعة الأشجار، ومساعدة المستخدم على استخدام التطبيق (إضافة شجرة، تحديد موقعها على الخريطة، متابعة نموها، ورؤية الأثر البيئي). راعي مناخ العراق في إرشادات الزراعة. أجيبي باختصار ووُدّ، وأعيدي توجيه أي سؤال خارج نطاق الزراعة والبيئة والتطبيق بلطف.`;

// النموذج قابل للضبط عبر متغيّر البيئة. الافتراضي gemini-2.5-flash (مستقر ومجاني)؛
// يمكن ترقيته إلى gemini-3.5-flash بضبط GEMINI_MODEL دون تعديل الكود.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// تحويل رسائل المحادثة إلى صيغة محتوى Gemini.
// Gemini يعرف دورين فقط: "user" و "model".
function toGeminiContents(messages) {
  return messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

/**
 * يرسل تاريخ المحادثة إلى Gemini ويرجّع نص رد "نبتة".
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
async function generateReply(messages) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY غير مهيأ في متغيرات البيئة');
  }

  const contents = toGeminiContents(messages);
  if (contents.length === 0) {
    throw new Error('لا توجد رسالة صالحة لإرسالها');
  }

  const response = await axios.post(
    GEMINI_URL,
    {
      system_instruction: { parts: [{ text: NABTA_SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    },
    {
      // المفتاح يُمرَّر في الترويسة بدل الـ query string حتى لا يُسجَّل في السجلّات
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      timeout: 20000, // الفشل سريعاً بدل التعليق إذا تعذّر الوصول إلى Gemini
    }
  );

  const reply =
    response.data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .join('')
      .trim();

  if (!reply) {
    throw new Error('Gemini returned no text: ' + JSON.stringify(response.data));
  }

  return reply;
}

module.exports = { generateReply, NABTA_SYSTEM_PROMPT, GEMINI_MODEL };
