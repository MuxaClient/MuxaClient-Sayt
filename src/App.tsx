import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import PricingPage from './components/PricingPage';
import PaymentPage from './components/PaymentPage';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { type Plan, TELEGRAM_URL } from './lib/supabase';
import { LayoutDashboard, CreditCard, Settings, Loader2, Menu, Ban, Send } from 'lucide-react';
import MenuPage from './components/MenuPage';

type View = 'dashboard' | 'pricing' | 'admin' | 'menu';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [view, setView] = useState<View>('menu');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#1a1a2e]">
        <div
          className="absolute inset-0 bg-cover bg-center blur-lg scale-100"
          style={{ backgroundImage: "url('/landing_1.jpg')", backgroundSize: 'cover', imageRendering: 'auto' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#1a1a2e]/60" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-16 h-16 flex items-center justify-center p-2">
            <img src="/logo.png" alt="Muxa Client" className="w-full h-full object-contain" />
          </div>
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <Toaster theme="dark" position="top-center" richColors />
      </>
    );
  }

  if (selectedPlan) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#1a1a2e]">
        <div
          className="fixed inset-0 bg-cover bg-center blur-lg scale-100"
          style={{ backgroundImage: "url('/landing_1.jpg')", backgroundSize: 'cover', imageRendering: 'auto' }}
        />
      <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#1a1a2e]/60" />
        <div className="relative z-10">
          <PaymentPage
            plan={selectedPlan}
            onBack={() => setSelectedPlan(null)}
            onSuccess={() => {
              setSelectedPlan(null);
              setView('dashboard');
            }}
          />
        </div>
        <Toaster theme="dark" position="top-center" richColors />
      </div>
    );
  }

  // Blocked user — full screen, cannot access anything
  if (profile?.is_blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#07070b]">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12">
            <Ban className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-red-400 mb-4">Muxa Client</h1>
            <h2 className="text-2xl font-bold text-white mb-6">
              Siz Ban Olgansiz
            </h2>
            <div className="border-t border-red-500/20 pt-6">
              <p className="text-gray-400 text-sm mb-4">
                Ochish Uchun Telegram:
              </p>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#229ED9] text-white font-semibold text-base shadow-lg hover:bg-[#1b8dc4] transition-colors"
              >
                <Send className="w-5 h-5" />
                @MuxammaddinUz
              </a>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-8 text-gray-500 text-sm hover:text-white transition-colors"
          >
            Chiqish
          </button>
        </div>
        <Toaster theme="dark" position="top-center" richColors />
      </div>
    );
  }

  const isAdmin = profile?.is_admin ?? false;

  const navItems: { key: View; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: 'menu', label: 'Menu', icon: <Menu className="w-4 h-4" />, show: true },
    { key: 'dashboard', label: 'Panel', icon: <LayoutDashboard className="w-4 h-4" />, show: true },
    { key: 'pricing', label: 'Narxlar', icon: <CreditCard className="w-4 h-4" />, show: true },
    { key: 'admin', label: 'Admin', icon: <Settings className="w-4 h-4" />, show: isAdmin },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#1a1a2e]">
      {/* 4K Ultra HD background */}
      <div
        className="fixed inset-0 bg-cover bg-center blur-lg scale-100"
        style={{ backgroundImage: "url('/landing_1.jpg')", backgroundSize: 'cover', imageRendering: 'auto' }}
      />
        <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[#1a1a2e]/80" />
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(ellipse 1000px 600px at 50% 25%, var(--accent-from) 0%, transparent 70%)' }}
      />
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(ellipse 700px 400px at 80% 80%, var(--accent-to) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        <Navbar
          view={view}
          setView={setView}
          navItems={navItems}
          email={profile?.email ?? ''}
          onSignOut={signOut}
        />

        <main className="relative min-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {view === 'menu' && <MenuPage />}
              {view === 'dashboard' && <Dashboard />}
              {view === 'pricing' && <PricingPage onSelectPlan={(plan) => setSelectedPlan(plan)} />}
              {view === 'admin' && isAdmin && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-white/5 mt-8">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center">
            <p className="text-gray-400 text-xs">
              Muxa Client — Obuna boshqaruv tizimi © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>

      <Toaster theme="dark" position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
