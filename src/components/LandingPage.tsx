import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield,
  Zap,
  Eye,
  Lock,
  Clock,
  Users,
  Send,
  ChevronDown,
  Menu,
  X,
  Star,
  Cpu,
  Target,
  Crosshair,
  Sparkles,
  Check,
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { Button } from './ui/Button';
import { TELEGRAM_URL } from '../lib/supabase';

const SECTIONS = [
  { id: 'home', label: 'Bosh Sahifa' },
  { id: 'features', label: 'Funksiyalar' },
  { id: 'pricing', label: 'Tariflar' },
  { id: 'about', label: "Ma'lumotlar" },
];

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], ['0%', '30%']);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 40));
    return () => unsub();
  }, [scrollY]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const features = [
    { icon: <Zap className="w-6 h-6" />, title: 'Tez ishlaydi', desc: "Yuqori FPS va minimal ping ta'sirida ishlaydi. Hech qanday lagg yo'q." },
    { icon: <Eye className="w-6 h-6" />, title: 'ESP & Aimbot', desc: "Dushmanlarni devor orqali ko'r, aniq nishon ol. Har o'yinda ustunlik." },
    { icon: <Lock className="w-6 h-6" />, title: 'Xavfsiz & Yashirin', desc: "Anti-cheat tizimlardan himoyalangan. Akkauntingiz xavfsiz." },
    { icon: <Clock className="w-6 h-6" />, title: '24/7 Yangilanadi', desc: "O'yin yangilanishi bilan bir vaqtda yangilanadi. Hech qachon ishdan chiqmaydi." },
    { icon: <Cpu className="w-6 h-6" />, title: 'HWID Himoya', desc: "Har bir litsenziya qurilmangizga bog'langan. Xavfsizlik kafolatlangan." },
    { icon: <Users className="w-6 h-6" />, title: 'Faol Jamiyat', desc: "Ko'p ming foydalanuvchi bilan birgalikda yaxshilanib boradigan dastur." },
  ];

  const stats = [
    { value: '5000+', label: 'Faol foydalanuvchi' },
    { value: '99.9%', label: 'Uptime kafolati' },
    { value: '24/7', label: 'Texnik yordam' },
    { value: '0', label: 'Ban holati' },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-white overflow-x-hidden">
      {/* ─── NAVBAR ──────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-400 ${
          scrolled
            ? 'bg-black/60 backdrop-blur-2xl border-b border-white/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-gradient flex items-center justify-center shadow-accent-glow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Muxa Client</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* HISOB btn */}
          <div className="flex items-center gap-3">
            <Button onClick={() => setAuthOpen(true)} size="md" className="hidden sm:flex shadow-accent-glow">
              HISOB
            </Button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur-2xl"
          >
            <div className="px-6 py-4 space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="block w-full text-left px-4 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-all"
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                className="w-full mt-3 py-3 rounded-xl bg-accent-gradient text-white font-medium text-sm"
              >
                HISOB
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* ─── Floating decorative particles ──────────── */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 200 + i * 100,
              height: 200 + i * 100,
              background: 'var(--accent-from)',
              filter: 'blur(80px)',
              opacity: 0.15,
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
            }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -30, 20, 0],
              scale: [1, 1.2, 0.9, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </motion.div>

      {/* ─── HERO SECTION ────────────────────────────── */}
      <section id="home" ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax BG */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 -top-[20%] bottom-[-20%] z-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center blur-lg scale-100"
            style={{ backgroundImage: "url('/landing_1.jpg')" }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-[#07070b]" />
          {/* Accent color tint */}
          <div className="absolute inset-0 bg-accent/5 mix-blend-screen" />
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs text-gray-300 mb-6"
          >
            <Star className="w-3.5 h-3.5 text-accent" />
            O'zbekiston #1 gaming helper
            <Star className="w-3.5 h-3.5 text-accent" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight leading-none mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-100 to-gray-400">
              Muxa
            </span>
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))' }}>
              Client
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="text-gray-300 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Eng kuchli va ishonchli yordamchi. O'yiningizni yangi darajaga olib chiqing.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button onClick={() => setAuthOpen(true)} size="lg" className="text-base px-8 shadow-accent-glow">
              <Crosshair className="w-5 h-5" />
              Hoziroq boshlash
            </Button>
            <Button
              onClick={() => scrollTo('about')}
              variant="secondary"
              size="lg"
              className="text-base px-8 border-white/20"
            >
              Ko'proq bilish
              <ChevronDown className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="flex flex-col items-center gap-1 text-gray-500"
          >
            <span className="text-xs">Pastga aylantiring</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ───────────────────────────────── */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-accent">{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT SECTION (Ma'lumotlar) ────────────── */}
      <section id="about" className="relative z-10 py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-4">
              <Target className="w-4 h-4" />
              Ma'lumotlar
            </div>
            <h2 className="text-4xl font-bold mb-4">Muxa Client haqida</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Muxa Client — bu professional o'yinchilar uchun maxsus ishlab chiqilgan,{' '}
              <span className="text-white font-medium">xavfsiz va samarali</span> gaming yordamchi dasturi.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Ishonchlilik kafolati',
                desc: "Dastur yillar davomida sinab ko'rilgan. Hech bir foydalanuvchimiz ban olmagan. Xavfsizlik — bizning asosiy ustuvorligimiz.",
                tag: 'Xavfsiz',
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Doimiy rivojlanish',
                desc: "Har hafta yangi funksiyalar qo'shiladi. Foydalanuvchilarning taklif va fikrlari asosida dastur yaxshilanib boradi.",
                tag: 'Yangilanadi',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.02 }}
                className="group relative bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden cursor-default"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                  style={{ boxShadow: 'inset 0 0 60px var(--accent-ring)' }} />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-gradient text-white mb-5 shadow-accent-glow">
                    {card.icon}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{card.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {card.tag}
                    </span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-4 shadow-lg shadow-accent/10">
              <Sparkles className="w-4 h-4" />
              Tariflar
            </div>
            <h2 className="text-4xl font-bold mb-4">Narxlar va Rejalar</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              O'zingizga mos rejani tanlang.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: '7 Kunlik', price: '50,000', duration: 7, popular: false },
              { name: '30 Kunlik', price: '150,000', duration: 30, popular: true },
              { name: '90 Kunlik', price: '350,000', duration: 90, popular: false },
              { name: '180 Kunlik', price: '600,000', duration: 180, popular: false },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, y: -6 }}
                className={`relative group bg-white/[0.06] backdrop-blur-xl border rounded-2xl p-6 overflow-hidden cursor-default transition-all ${
                  plan.popular
                    ? 'border-accent/40 shadow-lg shadow-accent/20'
                    : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent-gradient text-white text-[10px] font-semibold">
                    OMMABOP
                  </div>
                )}
                <div className="relative">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-xs mb-4">{plan.duration} kun davomida</p>
                  <p className="text-3xl font-bold text-white mb-6">
                    {plan.price}
                    <span className="text-sm text-gray-400 font-normal"> so'm</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    {["To'liq dastur kirish", 'HWID bog\'lash', 'Texnik yordam', 'Avto yangilanish'].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-accent shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => setAuthOpen(true)}
                    variant={plan.popular ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full"
                  >
                    {plan.popular ? 'Tanlash' : "Ko'rish"}
                  </Button>
                </div>
                {/* Hover glow */}
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                  style={{ background: 'var(--accent-from)', filter: 'blur(40px)' }}
                />
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-500 text-sm mt-8"
          >
            HWID yangilash — 50,000 so'm
          </motion.p>
        </div>
      </section>

      {/* ─── FEATURES SECTION ────────────────────────── */}
      <section id="features" className="relative z-10 py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-4">
              <Zap className="w-4 h-4" />
              Funksiyalar
            </div>
            <h2 className="text-4xl font-bold mb-4">Asosiy Funksiyalar</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Raqobatchilarga nisbatan ustunlik beradigan funksiyalar to'plami.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ scale: 1.03, y: -4 }}
                className="group relative bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden cursor-default"
              >
                {/* Corner glow */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                  style={{ background: 'var(--accent-from)', filter: 'blur(30px)' }}
                />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA SECTION ─────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-12 overflow-hidden"
          >
            {/* BG glow */}
            <div className="absolute inset-0 rounded-3xl opacity-20" style={{ background: 'radial-gradient(ellipse at center, var(--accent-from), transparent 70%)' }} />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-gradient mb-5 shadow-accent-glow">
                <Crosshair className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Tayyor bo'ldingizmi?</h2>
              <p className="text-gray-400 mb-8 text-lg">
                Ro'yxatdan o'ting va o'yiningizni yangi darajaga olib chiqing.
              </p>
              <Button onClick={() => setAuthOpen(true)} size="lg" className="text-base px-10 shadow-accent-glow">
                Kabinet — Hoziroq kirish
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SUPPORT SECTION ─────────────────────────── */}
      <section id="support" className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-sm mb-5">
              <Send className="w-4 h-4" />
              Texnik yordam
            </div>
            <h2 className="text-4xl font-bold mb-4">Muammo yuzaga keldimi?</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Bizning professional support jamoamiz 24/7 sizga yordam berishga tayyor.
              Telegram orqali murojaat qiling.
            </p>

            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                animate={{ boxShadow: ['0 0 20px rgba(34,158,217,0.3)', '0 0 40px rgba(34,158,217,0.6)', '0 0 20px rgba(34,158,217,0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#229ED9] text-white font-semibold text-base shadow-lg hover:bg-[#1b8dc4] transition-colors"
              >
                <Send className="w-5 h-5" />
                Telegram orqali bog'lanish
              </motion.button>
            </a>

            <p className="text-gray-600 text-sm mt-6">
              O'rtacha javob vaqti: 10 daqiqadan kam
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-gray-600 text-sm">
          Muxa Client © {new Date().getFullYear()} — Barcha huquqlar himoyalangan
        </p>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
