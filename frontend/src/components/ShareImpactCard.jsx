import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Download, Share2, Loader2, CheckCircle2 } from 'lucide-react';
import { useColors } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';

/* ── Card render constants ───────────────────────────────────
   Square 1080×1080 — works for Instagram feed, X/Twitter, etc.   */
const SIZE = 1080;
const M = 60;            // outer frame margin
const PALM = '#90a955';
const CREAM = '#e9f5db';

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(ctx, { name, handle, trees, co2, o2, labels }) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.textBaseline = 'middle';

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, '#0f1f0a');
  bg.addColorStop(0.55, '#1a3010');
  bg.addColorStop(1, '#243d16');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Soft radial glows
  const glow = (cx, cy, rad, alpha) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(135,152,106,${alpha})`);
    g.addColorStop(1, 'rgba(135,152,106,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, SIZE);
  };
  glow(900, 120, 360, 0.18);
  glow(160, 980, 320, 0.12);

  // ── Frame border ──
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(144,169,85,0.4)';
  roundRect(ctx, M, M, SIZE - 2 * M, SIZE - 2 * M, 44);
  ctx.stroke();

  ctx.textAlign = 'center';
  const cx = SIZE / 2;

  // ── Wordmark ──
  ctx.direction = 'ltr';
  ctx.fillStyle = CREAM;
  ctx.font = '800 76px Cairo, sans-serif';
  ctx.fillText('🌱 GreenIQ', cx, 168);

  // ── Subtitle ──
  ctx.direction = 'rtl';
  ctx.fillStyle = PALM;
  ctx.font = '600 38px Cairo, sans-serif';
  ctx.fillText(labels.subtitle, cx, 242);

  // ── Avatar circle (initial) ──
  const av = 384, avR = 76;
  const ag = ctx.createLinearGradient(cx - avR, av - avR, cx + avR, av + avR);
  ag.addColorStop(0, 'rgba(74,94,51,0.9)');
  ag.addColorStop(1, 'rgba(113,131,85,0.7)');
  ctx.beginPath();
  ctx.arc(cx, av, avR, 0, Math.PI * 2);
  ctx.fillStyle = ag;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(135,152,106,0.5)';
  ctx.stroke();
  ctx.direction = 'ltr';
  ctx.fillStyle = CREAM;
  ctx.font = '800 78px Cairo, sans-serif';
  ctx.fillText((name || '?').trim().charAt(0).toUpperCase(), cx, av + 6);

  // ── Name + handle ──
  ctx.direction = 'rtl';
  ctx.fillStyle = CREAM;
  ctx.font = '700 52px Cairo, sans-serif';
  ctx.fillText(name || '', cx, 524);
  if (handle) {
    ctx.direction = 'ltr';
    ctx.fillStyle = 'rgba(207,225,185,0.55)';
    ctx.font = '500 34px Cairo, sans-serif';
    ctx.fillText('@' + handle, cx, 574);
  }

  // ── Hero: trees count ──
  ctx.direction = 'ltr';
  ctx.fillStyle = PALM;
  ctx.font = '800 160px Cairo, sans-serif';
  ctx.fillText(Number(trees || 0).toLocaleString('en-US'), cx, 700);

  ctx.direction = 'rtl';
  ctx.fillStyle = CREAM;
  ctx.font = '700 44px Cairo, sans-serif';
  ctx.fillText(labels.treesLabel, cx, 792);

  // ── Stat boxes (CO₂ / O₂) ──
  const boxY = 852, boxH = 150, gap = 30;
  const contentW = SIZE - 2 * M - 24;
  const boxW = (contentW - gap) / 2;
  const leftX = (SIZE - contentW) / 2;
  const rightX = leftX + boxW + gap;

  const drawStat = (x, value, label, color, fill, border) => {
    ctx.fillStyle = fill;
    roundRect(ctx, x, boxY, boxW, boxH, 26);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = border;
    roundRect(ctx, x, boxY, boxW, boxH, 26);
    ctx.stroke();
    const mx = x + boxW / 2;
    ctx.direction = 'ltr';
    ctx.fillStyle = color;
    ctx.font = '800 64px Cairo, sans-serif';
    ctx.fillText(Number(value || 0).toLocaleString('en-US'), mx, boxY + 56);
    ctx.direction = 'rtl';
    ctx.fillStyle = 'rgba(233,245,219,0.7)';
    ctx.font = '600 28px Cairo, sans-serif';
    ctx.fillText(label, mx, boxY + 110);
  };

  drawStat(leftX, co2, labels.co2, '#4ade80', 'rgba(20,83,45,0.45)', 'rgba(74,222,128,0.3)');
  drawStat(rightX, o2, labels.o2, '#93c5fd', 'rgba(30,58,95,0.45)', 'rgba(147,197,253,0.3)');

  // ── CTA footer ──
  ctx.direction = 'rtl';
  ctx.fillStyle = 'rgba(207,225,185,0.55)';
  ctx.font = '600 30px Cairo, sans-serif';
  ctx.fillText(labels.cta, cx, 1012);
}

export default function ShareImpactCard({ user, totalCO2, totalO2, onClose }) {
  const C = useColors();
  const { t, b, lang } = useLang();
  const canvasRef = useRef(null);
  const [blob, setBlob] = useState(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const trees = user?.treesCount ?? 0;
  const co2 = Number(totalCO2 ?? 0);
  const o2 = Number(totalO2 ?? 0);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ensure the Cairo weights we draw with are loaded before painting.
    try {
      await Promise.all([
        document.fonts.load('500 34px Cairo'),
        document.fonts.load('600 38px Cairo'),
        document.fonts.load('700 52px Cairo'),
        document.fonts.load('800 160px Cairo'),
      ]);
      await document.fonts.ready;
    } catch { /* fall back to system font */ }

    const ctx = canvas.getContext('2d');
    drawCard(ctx, {
      name: user?.displayName,
      handle: user?.userId,
      trees, co2, o2,
      labels: {
        subtitle:   t('بصمتي البيئية في العراق'),
        treesLabel: t('شجرة مزروعة'),
        co2:        t('كجم CO₂ ممتص'),
        o2:         t('كجم O₂ منتج'),
        cta:        t('كن جزءاً من التغيير — إزرع شجرتك'),
      },
    });

    canvas.toBlob((bl) => { setBlob(bl); setReady(true); }, 'image/png');
  }, [user, trees, co2, o2, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { render(); }, [render]);

  const fileName = `greeniq-${user?.userId || 'impact'}.png`;
  const caption = b.shareCaption(trees, co2.toFixed(1));

  const handleDownload = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption, title: 'GreenIQ' });
        return;
      } catch { /* user cancelled or share failed — fall through to download */ }
    }
    // Fallback: copy caption + download the image
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable */ }
    handleDownload();
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(8,14,5,0.78)',
        backdropFilter: 'blur(12px)', zIndex: 2500, padding: '1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card"
        style={{ borderRadius: '24px', padding: '1.5rem', width: '100%', maxWidth: '440px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={16} color={PALM} /> {t('بطاقة الأثر البيئي')}
          </h2>
          <button onClick={onClose} style={{
            background: 'rgba(74,94,51,0.38)', border: '1px solid rgba(135,152,106,0.22)',
            borderRadius: '8px', cursor: 'pointer', padding: '5px', color: C.textMuted, display: 'flex',
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Preview */}
        <div style={{
          position: 'relative', borderRadius: '16px', overflow: 'hidden',
          marginBottom: '1.1rem', aspectRatio: '1 / 1',
          background: 'rgba(15,31,10,0.6)', border: '1px solid rgba(135,152,106,0.18)',
        }}>
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {!ready && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '12px', color: C.textMuted,
            }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={26} color={PALM} />
              </motion.div>
              <span style={{ fontSize: '0.85rem' }}>{t('جارٍ تجهيز البطاقة...')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <motion.button
            onClick={handleShare} disabled={!ready}
            whileHover={ready ? { y: -1 } : {}} whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{
              flex: 1, padding: '0.82rem', fontSize: '0.92rem', fontWeight: '700',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', opacity: ready ? 1 : 0.6,
            }}
          >
            {copied ? <><CheckCircle2 size={16} /> {t('تم نسخ نص المشاركة')}</> : <><Share2 size={16} /> {t('مشاركة')}</>}
          </motion.button>
          <motion.button
            onClick={handleDownload} disabled={!ready}
            whileHover={ready ? { y: -1 } : {}} whileTap={{ scale: 0.97 }}
            title={t('تنزيل الصورة')}
            style={{
              padding: '0.82rem 1.1rem', borderRadius: '12px', cursor: ready ? 'pointer' : 'default',
              background: 'rgba(74,94,51,0.38)', border: '1px solid rgba(135,152,106,0.28)',
              color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '7px', fontSize: '0.9rem', fontWeight: '600', opacity: ready ? 1 : 0.6,
            }}
          >
            <Download size={16} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
