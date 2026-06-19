import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

// رسالة الترحيب الأولى من نبتة
const WELCOME = {
  role: 'assistant',
  content: 'مرحباً! أنا نبتة 🌱 مساعدتك في GreenIQ. أقدر أساعدك بزراعة الأشجار، إضافتها على الخريطة، ومتابعة أثرك البيئي. شلون أقدر أساعدك اليوم؟',
};

export default function ChatBot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // التمرير لأسفل عند كل رسالة جديدة أو ظهور "يكتب..."
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      // إرسال تاريخ المحادثة كاملاً (baseURL = VITE_API_URL، فالمسار النهائي /api/chat)
      const { data } = await api.post('/chat', { messages: next });
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([
        ...next,
        { role: 'assistant', content: 'تعذّر الوصول إليّ الآن، جرّب مرة ثانية بعد قليل 🌱' },
      ]);
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

  return (
    <div dir="rtl" className="fixed bottom-5 left-5 z-[1000] flex flex-col items-start font-[inherit]">
      {/* نافذة المحادثة */}
      {open && (
        <div className="mb-3 flex h-[31rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-green-600/30 bg-white shadow-2xl">
          {/* الترويسة */}
          <div className="flex items-center justify-between bg-gradient-to-l from-green-600 to-green-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌱</span>
              <div>
                <p className="text-sm font-bold leading-tight">نبتة</p>
                <p className="text-[0.7rem] leading-tight text-green-50/90">مساعدتك في GreenIQ</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="إغلاق المحادثة"
              className="rounded-full p-1 text-white/90 transition hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          {/* الرسائل */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-green-50/40 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-green-600 text-white'
                      : 'rounded-bl-sm border border-green-100 bg-white text-gray-800'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* حالة "يكتب..." */}
            {loading && (
              <div className="flex justify-end">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-green-100 bg-white px-3 py-2.5 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-green-500" />
                </div>
              </div>
            )}
          </div>

          {/* صندوق الإدخال */}
          <div className="flex items-end gap-2 border-t border-green-100 bg-white p-2.5">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="اكتب رسالتك..."
              className="max-h-24 flex-1 resize-none rounded-xl border border-green-200 bg-green-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:bg-white"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="إرسال"
              className="shrink-0 rounded-xl bg-green-600 px-3 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* الزر العائم */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'إغلاق نبتة' : 'افتح المساعدة نبتة'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-2xl text-white shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95"
      >
        {open ? '✕' : '🌱'}
      </button>
    </div>
  );
}
