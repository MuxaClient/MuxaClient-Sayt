import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, X } from 'lucide-react';
import { Button } from './ui/Button';

const BASE = import.meta.env.BASE_URL;
import { Input } from './ui/Input';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (tab === 'login') {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setError(error);
        toast.error(error);
      } else {
        toast.success('Xush kelibsiz!');
        onClose();
      }
    } else {
      const { error } = await signUp(email.trim(), password, username.trim());
      if (error) {
        setError(error);
        toast.error(error);
      } else {
        toast.success("Ro'yxatdan o'tish muvaffaqiyatli!");
        onClose();
      }
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#0d0d14]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {/* Logo */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 mb-3 p-2">
                  <img src={`${BASE}logo.png`} alt="Muxa Client" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-xl font-bold text-white">Muxa Client</h2>
                <p className="text-gray-400 text-xs mt-0.5">Kabinetga kirish</p>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl">
                {(['login', 'signup'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(null); }}
                    className="relative flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {tab === t && (
                      <motion.div
                        layoutId="modal-tab"
                        className="absolute inset-0 bg-accent-gradient rounded-lg"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                    <span className={`relative z-10 ${tab === t ? 'text-white' : 'text-gray-400'}`}>
                      {t === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                    </span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Foydalanuvchi nomi</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <Input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="@username"
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email manzil</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
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

                <Button type="submit" disabled={loading} size="lg" className="w-full mt-2">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : tab === 'login' ? (
                    'Tizimga kirish'
                  ) : (
                    "Ro'yxatdan o'tish"
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-5">
                {tab === 'login' ? "Akkauntingiz yo'qmi? " : 'Akkauntingiz bormi? '}
                <button
                  onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(null); }}
                  className="text-accent hover:opacity-80 font-medium"
                >
                  {tab === 'login' ? "Ro'yxatdan o'tish" : 'Kirish'}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
