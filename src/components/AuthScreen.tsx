import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';

const BASE = import.meta.env.BASE_URL;

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode2, setMode2] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode2 === 'login') {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setError(error);
        toast.error(error);
      } else {
        toast.success('Xush kelibsiz!');
      }
    } else {
      const { error } = await signUp(email.trim(), password);
      if (error) {
        setError(error);
        toast.error(error);
      } else {
        toast.success("Ro'yxatdan o'tish muvaffaqiyatli!");
      }
    }
    setLoading(false);
  };

  const bgX = (mousePos.x - 0.5) * 20;
  const bgY = (mousePos.y - 0.5) * 20;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#07070b]">
      {/* Background image — 4K ultra HD */}
      <motion.div
        className="absolute inset-0 blur-[2px] scale-110"
        style={{
          backgroundImage: `url('${BASE}landing_1.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'auto',
        }}
        animate={{
          scale: 1.05,
          x: bgX,
          y: bgY,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30, mass: 0.5 }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#07070b]" />

      {/* Accent glow overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 50% 40%, var(--accent-from) 0%, transparent 70%)',
        }}
      />

      {/* Moving glow follow mouse */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'var(--accent-from)',
          filter: 'blur(120px)',
          opacity: 0.2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          x: (mousePos.x - 0.5) * 100,
          y: (mousePos.y - 0.5) * 100,
        }}
        transition={{ type: 'spring', stiffness: 30, damping: 20 }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            className="inline-flex items-center justify-center w-16 h-16 mb-4 p-2"
          >
            <img src={`${BASE}logo.png`} alt="Muxa Client" className="w-full h-full object-contain" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-white"
          >
            Muxa Client
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-sm mt-1"
          >
            Kirish yoki ro'yxatdan o'tish
          </motion.p>
        </div>

        {/* Auth form card */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut', layout: { duration: 0.25 } }}
          className="bg-[#141420]/90 border border-white/10 rounded-3xl shadow-2xl shadow-accent/10 overflow-hidden"
        >
          <motion.div layout transition={{ duration: 0.25 }} className="p-8">
            {/* Tab switcher */}
            <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl">
              {(['login', 'signup'] as const).map((m) => (
                <motion.button
                  key={m}
                  onClick={() => { setMode2(m); setError(null); }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {mode2 === m && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-0 bg-accent-gradient rounded-lg shadow-lg shadow-accent/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${mode2 === m ? 'text-white' : 'text-gray-400'}`}>
                    {m === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                  </span>
                </motion.button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Parol</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl bg-accent-gradient text-white font-semibold text-sm shadow-lg shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : mode2 === 'login' ? (
                  'Tizimga kirish'
                ) : (
                  "Ro'yxatdan o'tish"
                )}
              </motion.button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-5">
              {mode2 === 'login' ? "Akkauntingiz yo'qmi? " : 'Akkauntingiz bormi? '}
              <button
                onClick={() => { setMode2(mode2 === 'login' ? 'signup' : 'login'); setError(null); }}
                className="text-accent font-medium hover:opacity-80"
              >
                {mode2 === 'login' ? "Ro'yxatdan o'tish" : 'Kirish'}
              </button>
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center text-xs text-gray-600 mt-6"
        >
          <ChevronDown className="w-3 h-3 inline mr-1 animate-bounce" />
          Ro'yxatdan o'tib, xizmatdan foydalaning
        </motion.p>
      </motion.div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16"
              >
                <img src={`${BASE}logo.png`} alt="Muxa Client" className="w-full h-full object-contain" />
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 200 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                className="h-1 rounded-full bg-accent-gradient"
              />
              <p className="text-gray-300 text-sm">
                {mode2 === 'login' ? 'Tizimga kirilmoqda...' : "Ro'yxatdan o'tilmoqda..."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
