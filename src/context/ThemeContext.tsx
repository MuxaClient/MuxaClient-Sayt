import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function generateAccent(hex: string) {
  const c = hexToRgb(hex);
  const lighter = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.35));
  const to = `rgb(${lighter(c.r)}, ${lighter(c.g)}, ${lighter(c.b)})`;
  return {
    from: hex,
    to,
    solid: hex,
    text: hex,
    ring: `rgba(${c.r}, ${c.g}, ${c.b}, 0.3)`,
  };
}

type ThemeContextType = {
  accent: string;
  setAccent: (a: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const accent = '#06b6d4';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    const v = generateAccent(accent);
    root.style.setProperty('--accent-from', v.from);
    root.style.setProperty('--accent-to', v.to);
    root.style.setProperty('--accent-solid', v.solid);
    root.style.setProperty('--accent-text', v.text);
    root.style.setProperty('--accent-ring', v.ring);
  }, []);

  return (
    <ThemeContext.Provider value={{ accent, setAccent: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within AuthProvider');
  return ctx;
}
