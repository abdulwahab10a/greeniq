const axios = require('axios');
require('dotenv').config();

// شخصية المساعدة "نبتة" — تُمرَّر إلى Gemini عبر system_instruction
const NABTA_PERSONA = `اسمك (نبتة) 🌱، المساعدة الذكية لتطبيق GreenIQ لتتبّع زراعة الأشجار وقياس الأثر البيئي. تحدّثي بالعربية بشخصية ودودة ومشجّعة بصيغة المؤنث. عرّفي عن نفسك بهذا الاسم في أول رسالة. مهمتك: شرح طريقة زراعة الأشجار، ومساعدة المستخدم على استخدام التطبيق (إضافة شجرة، تحديد موقعها على الخريطة، متابعة نموها، ورؤية الأثر البيئي). راعي مناخ العراق في إرشادات الزراعة. أجيبي باختصار ووُدّ، وأعيدي توجيه أي سؤال خارج نطاق الزراعة والبيئة والتطبيق بلطف.`;

// دليل معرفة بحقائق التطبيق الفعلية (مستخرَج من واجهة GreenIQ).
// تعتمد عليه نبتة لإعطاء خطوات دقيقة، ويُمنع اختراع أزرار أو خطوات غير موجودة.
const APP_KNOWLEDGE = `
معلومات دقيقة عن تطبيق GreenIQ — اعتمدي عليها حصراً عند شرح خطوات التطبيق، ولا تخترعي أزراراً أو حقولاً أو خطوات غير مذكورة هنا. إن لم تتأكدي من تفصيلة، وجّهي المستخدم لتجربتها بنفسه بدل التخمين.

【إنشاء حساب جديد】
- من صفحة تسجيل الدخول اضغطي رابط "إنشاء حساب"، أو افتحي صفحة التسجيل مباشرة.
- الحقول المطلوبة:
  • معرّف المستخدم (UserID): من 3 إلى 20 حرفاً، أحرف إنجليزية وأرقام و _ و . فقط (يُحفظ بأحرف صغيرة).
  • الاسم الظاهر: من 2 إلى 30 حرفاً.
  • كلمة المرور: 8 أحرف على الأقل، مع إعادة كتابتها للتأكيد.
- حقول اختيارية: صورة الملف الشخصي، ورابط تواصل اجتماعي (يبدأ بـ https://) مثل إنستغرام أو فيسبوك أو سناب أو تيليجرام أو X.
- بعد إنشاء الحساب يدخل المستخدم تلقائياً وينتقل إلى صفحة الخريطة.

【تسجيل الدخول】
- يحتاج معرّف المستخدم وكلمة المرور (8 أحرف على الأقل).

【غرس/إضافة شجرة】
- يجب تسجيل الدخول أولاً.
- من صفحة "خريطة الأشجار" اضغطي زر "غرس شجرة جديدة".
- سيطلب المتصفح إذن تحديد الموقع ويحدّده تلقائياً — لا بد من السماح بالوصول إلى الموقع وإلا لن يكتمل الغرس.
- الحقول: اسم الشجرة (اختياري، حتى 100 حرف)، صورة (اختياري)، العمر التقريبي الحالي بالسنوات (اختياري)، ملاحظات (اختياري، حتى 500 حرف).
- ثم اضغطي "تأكيد الغرس"، وتظهر شجرتك على الخريطة فوراً.

【متابعة الأثر البيئي】
- لكل شجرة يُحسب CO₂ المختزَل وO₂ المنبعث تلقائياً حسب عمرها، ويظهران في بطاقة الشجرة على الخريطة.
- إجمالي أثرك يظهر في صفحة "الملف الشخصي" مع الشارات وبطاقة المشاركة.

【صفحات أخرى】
- "اللوحة" (Leaderboard): ترتيب المستخدمين حسب عدد الأشجار والأثر.
- "المحافظات": إحصائيات مجمّعة لكل محافظة عراقية.
- "جودة الهواء": بيانات حيّة لجودة الهواء في المحافظات.
- "الملف الشخصي": إحصائياتك وشاراتك وزر مشاركة بطاقة الأثر.
`;

const NABTA_SYSTEM_PROMPT = `${NABTA_PERSONA}\n${APP_KNOWLEDGE}`;

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
