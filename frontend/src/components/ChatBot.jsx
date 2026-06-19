import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Send, X, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useColors } from '../context/ThemeContext';

// رسالة الترحيب الأولى من نبتة
const WELCOME = {
  role: 'assistant',
  content: 'مرحباً! آني نبتة 🌱 مساعدتك بمنصة GreenIQ. أكدر أساعدك بزراعة الأشجار، إضافتها على الخارطة، ومتابعة أثرك البيئي. شلون أكدر أساعدك اليوم؟',
};

// اقتراحات سريعة تظهر بأول فتح ليختار المستخدم بنقرة بدل الكتابة
const QUICK_REPLIES = [
  'شلون أزرع شجرة؟',
  'شلون أعرف أثر شجرتي؟',
  'وين أشوف جودة الهواء؟',
  'شلون أكسب الشارات؟',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ChatBot() {
  const C = useColors();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const scrollRef = useRef(null);
  // ارتفاع الكيبورد والمساحة المرئية الفعلية (للتعامل الصحيح مع كيبورد الموبايل)
  const [kbInset, setKbInset]   = useState(0);
  const [vvHeight, setVvHeight] = useState(null);

  // التمرير لأسفل عند كل رسالة جديدة أو ظهور "يكتب..."
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

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

  // textArg اختياري: تمرّره أزرار الاقتراحات السريعة؛ غيره يؤخذ من حقل الإدخال
  const send = async (textArg) => {
    const text = (typeof textArg === 'string' ? textArg : input).trim();
    if (!text || loading) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      // إرسال تاريخ المحادثة كاملاً (baseURL = VITE_API_URL، فالمسار النهائي /api/chat)
      const { data } = await postWithRetry({ messages: next });
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 429
          ? 'نبتة عليها ضغط هسة 🌱 جرّب تسألني بعد لحظات قليلة.'
          : 'تعذّر الوصول إليّ هسة، جرّب مرة ثانية بعد شوية 🌱';
      setMessages([...next, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
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

            {/* الرسائل */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: 'auto', padding: '0.9rem',
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
              background: C.L ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)',
            }}>
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '82%', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      padding: '0.55rem 0.8rem', fontSize: '0.86rem', lineHeight: 1.65,
                      borderRadius: '15px',
                      ...(isUser
                        ? { background: brandGrad, color: headerText, borderBottomRightRadius: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
                        : { background: C.innerBg, color: C.text, border: `1px solid ${C.rowBorder}`, borderBottomLeftRadius: '5px' }),
                    }}>
                      {m.content}
                    </div>
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

              {/* حالة "يكتب..." */}
              {loading && (
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
