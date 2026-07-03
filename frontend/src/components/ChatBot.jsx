import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Send, X, Sparkles, RotateCcw, MapPin, Wind, Trophy, BarChart3, User, Leaf } from 'lucide-react';
import api from '../api/axios';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// صفحات الموقع وكلماتها المفتاحية — لعرض أزرار تنقّل تحت رد نبتة عند ذكرها.
// auth: لا يظهر إلا للمستخدم المسجّل (الصفحة محمية).
const PAGE_LINKS = [
  { to: '/recommend',   label: 'أي شجرة أزرع؟',  Icon: Leaf,      keywords: ['أي شجرة أزرع', 'اي شجرة أزرع', 'اقتراح شجرة', 'اقتراح الأشجار', 'الشجرة المناسبة', 'اقترح لي شجرة'] },
  { to: '/map',         label: 'الخريطة',        Icon: MapPin,    keywords: ['الخريطة', 'الخارطة', 'خريطة الأشجار'] },
  { to: '/air-quality', label: 'جودة الهواء',    Icon: Wind,      keywords: ['جودة الهواء', 'جوده الهواء'] },
  { to: '/leaderboard', label: 'اللوحة',         Icon: Trophy,    keywords: ['اللوحة', 'الترتيب', 'لوحة الصدارة', 'المتصدرين', 'المتصدّرين'] },
  { to: '/governorates',label: 'المحافظات',      Icon: BarChart3, keywords: ['المحافظات'] },
  { to: '/profile',     label: 'الملف الشخصي',   Icon: User,      keywords: ['الملف الشخصي', 'ملفك الشخصي', 'البروفايل', 'شارك إنجازك', 'الشارات'], auth: true },
];

// يرجّع أزرار الصفحات المذكورة في نص الرد (بدون تكرار، مع مراعاة تسجيل الدخول)
function linksForReply(text, isLoggedIn) {
  if (!text) return [];
  return PAGE_LINKS.filter(
    (p) => (!p.auth || isLoggedIn) && p.keywords.some((k) => text.includes(k))
  );
}

// رسالة الترحيب الأولى من نبتة
const WELCOME = {
  role: 'assistant',
  content: 'مرحباً! آني نبتة 🌱 مساعدتك بمنصة GreenIQ. أكدر أساعدك بزراعة الأشجار، إضافتها على الخارطة، ومتابعة أثرك البيئي. شلون أكدر أساعدك اليوم؟',
};

// اقتراحات سريعة تظهر بأول فتح ليختار المستخدم بنقرة بدل الكتابة
const QUICK_REPLIES = [
  'شنو الشجرة المناسبة لمنطقتي؟',
  'شلون أزرع شجرة؟',
  'شلون أعرف أثر شجرتي؟',
  'وين أشوف جودة الهواء؟',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// حفظ المحادثة محلياً مقسّمة لكل مستخدم (وللضيف) حتى لا تختلط المحادثات
// على الجهاز المشترك، ولتبقى بعد إعادة التحميل/التنقّل بين الصفحات.
const STORAGE_PREFIX = 'greeniq_chat_';
const MAX_STORED = 40; // مطابق لحد الرسائل في الباك

function loadThread(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    const parsed = raw && JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length &&
        parsed.every((m) => m && typeof m.role === 'string' && typeof m.content === 'string')) {
      return parsed;
    }
  } catch { /* تجاهل بيانات تالفة */ }
  return [WELCOME];
}

// ── عرض Markdown خفيف (عريض، كود سطري، قوائم مرقّمة/نقطية، فقرات) ─────────────
// مصمّم لمخرجات نبتة دون مكتبات إضافية.
function renderInline(text, keyBase) {
  const out = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m, i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      out.push(<strong key={`${keyBase}-${i}`} style={{ fontWeight: 800 }}>{tok.slice(2, -2)}</strong>);
    } else {
      out.push(
        <code key={`${keyBase}-${i}`} style={{
          fontFamily: 'monospace', fontSize: '0.85em',
          background: 'rgba(135,152,106,0.18)', borderRadius: '4px', padding: '1px 4px',
        }}>{tok.slice(1, -1)}</code>
      );
    }
    last = m.index + tok.length; i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function MarkdownLite({ text }) {
  const lines = String(text).split('\n');
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };

  lines.forEach((raw) => {
    const line = raw.replace(/\s+$/, '');
    const ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    if (ol) {
      if (!list || list.type !== 'ol') { flush(); list = { type: 'ol', items: [] }; }
      list.items.push(ol[2]);
    } else if (ul) {
      if (!list || list.type !== 'ul') { flush(); list = { type: 'ul', items: [] }; }
      list.items.push(ul[1]);
    } else if (line.trim() === '') {
      flush();
    } else {
      flush();
      blocks.push({ type: 'p', text: line });
    }
  });
  flush();

  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === 'p') {
          return <div key={i} style={{ margin: i ? '0.35rem 0 0' : 0 }}>{renderInline(b.text, `p${i}`)}</div>;
        }
        const Tag = b.type === 'ol' ? 'ol' : 'ul';
        return (
          <Tag key={i} style={{ margin: '0.3rem 0 0', paddingInlineStart: '1.35rem' }}>
            {b.items.map((it, j) => (
              <li key={j} style={{ margin: '0.15rem 0' }}>{renderInline(it, `l${i}-${j}`)}</li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// بثّ الرد كلمة-كلمة عبر SSE. onDelta(النص التراكمي) تُستدعى مع كل دفعة جديدة.
// يرجّع النص الكامل. يرمي خطأ يحمل status (مثل 429) إن فشل قبل بدء البثّ.
async function streamChat(payload, onDelta) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    const e = new Error('stream failed');
    e.status = res.status;
    throw e;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop(); // الحدث غير المكتمل يبقى للدورة القادمة
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return full;
      try {
        const { text } = JSON.parse(data);
        if (text) { full += text; onDelta(full); }
      } catch { /* تجاهل دفعة غير صالحة */ }
    }
  }
  return full;
}

export default function ChatBot() {
  const C = useColors();
  const navigate = useNavigate();
  const { user } = useAuth();
  // مفتاح المحادثة: حساب المستخدم أو "guest". AuthContext يهيّئ user تزامنياً.
  const userKey = user?.userId || user?._id || 'guest';

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState(() => loadThread(userKey));
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);  // مشغول (يحجب إرسالاً جديداً)
  const [streaming, setStreaming] = useState(false); // بدأ وصول النص (نُخفي نقاط الكتابة)
  const scrollRef = useRef(null);
  const keyRef         = useRef(userKey);  // المفتاح الذي تنتمي إليه الرسائل الحالية
  const skipPersistRef = useRef(false);    // لتخطّي حفظ واحد عند تبديل المستخدم
  // ارتفاع الكيبورد والمساحة المرئية الفعلية (للتعامل الصحيح مع كيبورد الموبايل)
  const [kbInset, setKbInset]   = useState(0);
  const [vvHeight, setVvHeight] = useState(null);

  // التمرير لأسفل عند كل رسالة جديدة أو ظهور "يكتب..."
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  // عند تبديل المستخدم (دخول/خروج) نحمّل محادثة المفتاح الجديد
  useEffect(() => {
    if (keyRef.current !== userKey) {
      keyRef.current = userKey;
      skipPersistRef.current = true; // الحفظ التالي ناتج عن التحميل، لا نكرره
      setMessages(loadThread(userKey));
    }
  }, [userKey]);

  // حفظ المحادثة عند كل تغيير (مع تخطّي الحفظ الناتج عن تبديل المستخدم)
  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_PREFIX + keyRef.current, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch { /* تجاهل تجاوز الحصة */ }
  }, [messages]);

  // بدء محادثة جديدة (مسح المحفوظة)
  const clearChat = () => {
    try { localStorage.removeItem(STORAGE_PREFIX + keyRef.current); } catch { /* تجاهل */ }
    setMessages([WELCOME]);
  };

  // الانتقال لصفحة من زر داخل رد نبتة (نسكّر النافذة ليظهر المحتوى)
  const goTo = (to) => {
    setOpen(false);
    navigate(to);
  };

  // متابعة المساحة المرئية: عند فتح كيبورد الموبايل ينكمش visualViewport،
  // فنرفع الودجت فوق الكيبورد ونقصّر ارتفاعه حتى لا يختفي أي جزء منه.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setVvHeight(vv.height);
      setKbInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // إرسال الطلب مع إعادة محاولة تلقائية على الحمل/الكوتا (503/429)
  async function postWithRetry(payload, attempt = 0) {
    try {
      return await api.post('/chat', payload);
    } catch (err) {
      const status = err.response?.status;
      if ((status === 429 || status === 503) && attempt < 2) {
        // 429 (ضغط/كوتا) ينتظر أطول من 503 (حمل مؤقّت)
        await sleep(status === 429 ? 6000 : 2500);
        return postWithRetry(payload, attempt + 1);
      }
      throw err;
    }
  }

  const QUOTA_MSG = 'نبتة عليها ضغط هسة 🌱 جرّب تسألني بعد لحظات قليلة.';
  const FAIL_MSG  = 'تعذّر الوصول إليّ هسة، جرّب مرة ثانية بعد شوية 🌱';

  // خطة بديلة: الرد الكامل عبر النقطة العادية إن فشل البثّ (لغير الكوتا)
  const fallbackFull = async (next) => {
    try {
      const { data } = await postWithRetry({ messages: next });
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const status = err.response?.status;
      setMessages([...next, { role: 'assistant', content: status === 429 ? QUOTA_MSG : FAIL_MSG }]);
    }
  };

  // textArg اختياري: تمرّره أزرار الاقتراحات السريعة؛ غيره يؤخذ من حقل الإدخال
  const send = async (textArg) => {
    const text = (typeof textArg === 'string' ? textArg : input).trim();
    if (!text || loading) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setStreaming(false);

    let started = false;
    const onDelta = (partial) => {
      if (!started) { started = true; setStreaming(true); } // أول كلمة → نخفي نقاط الكتابة
      setMessages([...next, { role: 'assistant', content: partial }]);
    };

    try {
      const full = await streamChat({ messages: next }, onDelta);
      if (!started || !full) {
        // ما وصل أي نص عبر البثّ → الخطة البديلة
        await fallbackFull(next);
      }
    } catch (err) {
      if (err.status === 429) {
        setMessages([...next, { role: 'assistant', content: QUOTA_MSG }]);
      } else if (!started) {
        // فشل البثّ قبل أي نص لسبب غير الكوتا → نجرّب الرد الكامل
        await fallbackFull(next);
      } else {
        // انقطع البثّ بعد نص جزئي — نُبقي الجزء مع إشارة إلى الانقطاع
        setMessages((cur) => {
          const last = cur[cur.length - 1];
          if (last?.role === 'assistant') {
            return [...cur.slice(0, -1), { ...last, content: last.content + ' …' }];
          }
          return cur;
        });
      }
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // تدرّجات وألوان مشتقّة من ثيم الموقع
  const brandGrad = `linear-gradient(135deg, ${C.accent} 0%, ${C.accentMid} 100%)`;
  const headerText = '#f4fae8';

  // رفع الودجت فوق الكيبورد، وتقصير ارتفاع النافذة لتبقى كاملة داخل المساحة المرئية.
  // نترك مساحة للزر العائم (~58px) والهوامش (~38px).
  const containerBottom = `calc(${kbInset}px + 1.25rem)`;
  // ارتفاع النافذة محدود بالمساحة المرئية ناقص مكان الزر العائم والهوامش (~110px)،
  // بحد أقصى 512px على الشاشات الكبيرة — لا نفرض حداً أدنى يتجاوز المساحة المتاحة.
  const panelHeight = vvHeight
    ? `${Math.min(512, vvHeight - 110)}px`
    : 'min(32rem, calc(100dvh - 7rem))';

  return (
    <div dir="rtl" style={{ position: 'fixed', bottom: containerBottom, left: '1.25rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'bottom 0.2s ease' }}>
      {/* نافذة المحادثة */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
            style={{
              marginBottom: '0.85rem',
              width: '22.5rem',
              maxWidth: 'calc(100vw - 2.5rem)',
              height: panelHeight,
              maxHeight: panelHeight,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '22px',
              background: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(144,169,85,0.06)',
            }}
          >
            {/* الترويسة */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1rem', background: brandGrad,
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sprout size={20} color={headerText} strokeWidth={2.2} />
                </div>
                <div style={{ lineHeight: 1.25 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: headerText, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    نبتة <Sparkles size={13} color={headerText} style={{ opacity: 0.85 }} />
                  </p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(244,250,232,0.82)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7CFC9A', boxShadow: '0 0 6px #7CFC9A', display: 'inline-block' }} />
                    مساعدتك الذكية
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* محادثة جديدة (تظهر عند وجود سجلّ) */}
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    aria-label="محادثة جديدة"
                    title="محادثة جديدة"
                    style={{
                      background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                      borderRadius: '9px', padding: '5px', color: headerText, display: 'flex',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.26)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="إغلاق المحادثة"
                  style={{
                    background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                    borderRadius: '9px', padding: '5px', color: headerText, display: 'flex',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.26)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* الرسائل */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: 'auto', padding: '0.9rem',
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
              background: C.L ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)',
            }}>
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                const links = isUser ? [] : linksForReply(m.content, !!user);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-start' : 'flex-end', gap: '6px' }}>
                    <div style={{
                      maxWidth: '82%', whiteSpace: isUser ? 'pre-wrap' : 'normal', wordBreak: 'break-word',
                      padding: '0.55rem 0.8rem', fontSize: '0.86rem', lineHeight: 1.65,
                      borderRadius: '15px',
                      ...(isUser
                        ? { background: brandGrad, color: headerText, borderBottomRightRadius: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
                        : { background: C.innerBg, color: C.text, border: `1px solid ${C.rowBorder}`, borderBottomLeftRadius: '5px' }),
                    }}>
                      {isUser ? m.content : <MarkdownLite text={m.content} />}
                    </div>

                    {/* أزرار تنقّل للصفحات المذكورة في رد نبتة */}
                    {links.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', maxWidth: '90%' }}>
                        {links.map(({ to, label, Icon }) => (
                          <button
                            key={to}
                            onClick={() => goTo(to)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              background: C.tagBg, border: `1px solid ${C.accentMid}`, color: C.accentMid,
                              borderRadius: '999px', padding: '0.32rem 0.7rem', fontSize: '0.78rem',
                              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = C.accentMid; e.currentTarget.style.color = '#f4fae8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = C.tagBg; e.currentTarget.style.color = C.accentMid; }}
                          >
                            <Icon size={13} />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* اقتراحات سريعة — تظهر بأول فتح فقط (قبل أول رسالة من المستخدم) */}
              {messages.length === 1 && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'flex-end', marginTop: '0.2rem' }}
                >
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      style={{
                        background: C.tagBg, border: `1px solid ${C.tagBorder}`, color: C.tagText,
                        borderRadius: '999px', padding: '0.4rem 0.8rem', fontSize: '0.8rem',
                        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.accentMid; e.currentTarget.style.color = '#f4fae8'; e.currentTarget.style.borderColor = C.accentMid; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = C.tagBg; e.currentTarget.style.color = C.tagText; e.currentTarget.style.borderColor = C.tagBorder; }}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* حالة "يكتب..." — تظهر حتى وصول أول كلمة من البثّ */}
              {loading && !streaming && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '0.65rem 0.85rem', borderRadius: '15px', borderBottomLeftRadius: '5px',
                    background: C.innerBg, border: `1px solid ${C.rowBorder}`,
                  }}>
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.span key={i}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: d, ease: 'easeInOut' }}
                        style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.accentMid, display: 'inline-block' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* صندوق الإدخال */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: '8px',
              padding: '0.65rem', borderTop: `1px solid ${C.cardBorder}`,
              background: C.L ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.18)',
            }}>
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="اكتب رسالتك..."
                style={{
                  flex: 1, resize: 'none', maxHeight: '6rem',
                  padding: '0.6rem 0.8rem', lineHeight: 1.5,
                  // 16px إلزامي: أي أقل يسبّب تكبير iOS التلقائي عند التركيز ويخرّب أحجام الموقع
                  fontSize: '16px',
                  borderRadius: '13px', outline: 'none',
                  background: C.innerBg, color: C.text,
                  border: `1px solid ${C.cardBorder}`,
                  fontFamily: 'inherit',
                }}
              />
              <motion.button
                onClick={send}
                disabled={loading || !input.trim()}
                whileTap={{ scale: 0.9 }}
                aria-label="إرسال"
                style={{
                  flexShrink: 0, width: '40px', height: '40px', borderRadius: '12px',
                  border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  background: brandGrad, color: headerText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: loading || !input.trim() ? 0.45 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <Send size={17} style={{ transform: 'scaleX(-1)' }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* الزر العائم */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'إغلاق نبتة' : 'افتح المساعدة نبتة'}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.92 }}
        animate={open ? {} : { y: [0, -4, 0] }}
        transition={open ? {} : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          width: '58px', height: '58px', borderRadius: '50%',
          border: 'none', cursor: 'pointer',
          background: brandGrad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 6px ${C.L ? 'rgba(61,112,16,0.10)' : 'rgba(144,169,85,0.12)'}`,
        }}
      >
        {/* حلقة توهّج نابضة */}
        {!open && (
          <motion.span
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: `2px solid ${C.accentMid}`, pointerEvents: 'none',
            }}
          />
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
              <X size={24} color="#f4fae8" strokeWidth={2.4} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
              <Sprout size={26} color="#f4fae8" strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
