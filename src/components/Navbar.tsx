import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import { cn } from '../lib/cn';

const BASE = import.meta.env.BASE_URL;

type View = 'dashboard' | 'pricing' | 'admin' | 'menu';

type NavItem = {
  key: View;
  label: string;
  icon: React.ReactNode;
  show: boolean;
};

export function Navbar({
  view,
  setView,
  navItems,
  email,
  onSignOut,
}: {
  view: View;
  setView: (v: View) => void;
  navItems: NavItem[];
  email: string;
  onSignOut: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        scrolled ? 'border-b border-white/10' : 'border-b border-transparent',
      )}
    >
      <div className={cn('max-w-5xl mx-auto px-4 h-16 flex items-center justify-between rounded-2xl my-1', scrolled ? 'bg-black/20' : 'bg-black/10')}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 w-[180px]">
          <div className="w-9 h-9 flex items-center justify-center p-1">
            <img src={`${BASE}logo.png`} alt="Muxa Client" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg hidden sm:block text-white">
            Muxa Client
          </span>
        </div>

        {/* Desktop nav - centered */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.filter((n) => n.show).map((n) => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                view === n.key
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white',
              )}
            >
              {view === n.key && (
                <div className="absolute inset-0 bg-white/10 rounded-lg shadow-lg shadow-accent/20" />
              )}
              <span className="relative z-10">{n.icon}</span>
              <span className="relative z-10">{n.label}</span>
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 w-[180px] justify-end">
          {/* Email */}
          <span className="text-gray-400 text-xs hidden lg:block truncate max-w-[150px]">
            {email}
          </span>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
            title="Chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden"
          >
            <div className="max-w-5xl mx-auto px-4 mb-1">
              <div className="bg-black/20 rounded-2xl px-4 py-3 space-y-1">
              {navItems.filter((n) => n.show).map((n) => (
                <button
                  key={n.key}
                  onClick={() => {
                    setView(n.key);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    view === n.key
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5',
                  )}
                >
                  {n.icon}
                  {n.label}
                </button>
              ))}
            </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
