import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('greeniq_theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('greeniq_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// ── Centralised theme-aware color tokens ─────────────────────────────────────
export function useColors() {
  const { theme } = useContext(ThemeContext);
  const L = theme === 'light';
  return {
    L,
    // Text hierarchy
    text:        L ? '#1a2e0a' : '#cfe1b9',
    textMuted:   L ? 'rgba(26,46,10,0.62)' : 'rgba(207,225,185,0.5)',
    textSubtle:  L ? 'rgba(26,46,10,0.45)' : 'rgba(207,225,185,0.35)',
    textFaint:   L ? 'rgba(26,46,10,0.35)' : 'rgba(207,225,185,0.28)',
    heading:     L ? '#1a2e0a' : '#e9f5db',
    headingGrad: L
      ? 'linear-gradient(135deg, #1a3d0a 0%, #3d7010 100%)'
      : 'linear-gradient(135deg, #87986a, #e9f5db)',
    accent:      L ? '#2d5a1b' : '#87986a',
    accentMid:   L ? '#3d7010' : '#90a955',
    // Surfaces
    cardBg:      L ? 'rgba(255,255,255,0.82)' : 'rgba(15,25,10,0.75)',
    cardBorder:  L ? 'rgba(113,131,85,0.28)' : 'rgba(144,169,85,0.22)',
    cardBgAlt:   L ? 'rgba(235,245,220,0.7)'  : 'rgba(30,46,20,0.4)',
    cardBorderAlt: L ? 'rgba(113,131,85,0.18)' : 'rgba(135,152,106,0.1)',
    innerBg:     L ? 'rgba(220,240,205,0.55)' : 'rgba(30,46,20,0.45)',
    modalBg:     L ? '#f0f7e8'               : '#111827',
    modalHeader: L
      ? 'linear-gradient(135deg,#d4edba 0%,#c3e2a0 50%,#b8d990 100%)'
      : 'linear-gradient(135deg,#0f1f0a 0%,#1a3010 50%,#243d16 100%)',
    modalBorder: L ? 'rgba(113,131,85,0.3)'  : 'rgba(75,85,99,0.4)',
    modalText:   L ? '#1a2e0a'               : '#f9fafb',
    modalMuted:  L ? 'rgba(26,46,10,0.55)'   : '#6b7280',
    // Row / info
    rowBg:       L ? 'rgba(220,240,205,0.55)' : 'rgba(30,46,20,0.4)',
    rowBorder:   L ? 'rgba(113,131,85,0.18)'  : 'rgba(135,152,106,0.1)',
    // Tags / badges
    tagBg:       L ? 'rgba(113,131,85,0.12)'  : 'rgba(144,169,85,0.08)',
    tagBorder:   L ? 'rgba(113,131,85,0.28)'  : 'rgba(144,169,85,0.18)',
    tagText:     L ? '#2d5a1b'                : '#90a955',
  };
}
