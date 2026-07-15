import { motion } from 'framer-motion';

const BASE = import.meta.env.BASE_URL;
import {
  Zap,
  Eye,
  Lock,
  Clock,
  Cpu,
  Star,
  Users,
  Youtube,
  Image as ImageIcon,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { Card } from './ui/Card';

const features = [
  { icon: <Zap className="w-6 h-6" />, title: 'FPS va PING', desc: "Ko'proq Fps va Past Ping Tasrida Ishlaydi." },
  { icon: <Eye className="w-6 h-6" />, title: 'ESP va HurjimAura', desc: 'Dushmanlarni devor orqali ko\'radi hamda Dushmanni Avtamatik Uradi.' },
  { icon: <Lock className="w-6 h-6" />, title: 'Antichitlarga Qarshi', desc: 'Anti-cheat tizimlarini Buzib Bypass Qladi Ban va Kicklar Yoq.' },
  { icon: <Clock className="w-6 h-6" />, title: '24/7 Qo\'llab-Quvatlash', desc: 'Agarda Muamolar Busa Telegramdan Yordam Beramiz : @MuxammaddinUz.' },
  { icon: <Cpu className="w-6 h-6" />, title: 'Hwid Himoya', desc: 'Har bir litsenziya qurilmangizga bog\'langan va Boshqa Qurlmalar Kira Olmaydi.' },
  { icon: <Users className="w-6 h-6" />, title: 'Dizayn', desc: 'Ko\'p Effektlar va Choryli Atmasfera Chroyli va Kerakli Funksiyalar.' },
];

const reviews = [
  {
    name: 'Sadik',
    text: 'eng yaxshi chit bu Muxa Client 180 Kunlik ishlataman, ban yo\'q. Funksiyalari juda zo\'r',
    stars: 5,
  },
  {
    name: 'thisBEKA',
    text: 'Muxa Client Juda Zor Manga Yoqti 90 Kunlik Olganman Yaxshi Ishlayabti Tavsiya Qlaman',
    stars: 5,
  },
  {
    name: 'Ilxomov',
    text: 'Zor Hamma Serverda Yaxshi Ishlayabti Muxa Client 10/10 clientga MuxaClient Legend',
    stars: 5,
  },
  {
    name: 'Izzatilo',
    text: 'Chit vabshe Zor Muxa Clietn Yaxshi Menusi Ham Chroyli',
    stars: 5,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function MenuPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Features */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger}
        className="mb-10"
      >
        <motion.div variants={fadeUp} className="text-center mb-20">
          <img src={`${BASE}logo.png`} alt="Muxa Client" className="w-32 h-32 mx-auto mb-4 object-contain drop-shadow-[0_0_20px_var(--accent-ring)]" />
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">MUXA CLIENT</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Cho'qilarni Zabt Etishdagi Asosiy Vostangiz. Biz Qo'limizdan Kelgancha Sizga G'alabaga Erishish Uchun Yordamdamiz.
          </p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-6"
          >
            <ChevronDown className="w-6 h-6 text-accent mx-auto opacity-60" />
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-accent drop-shadow-[0_0_8px_var(--accent-ring)]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Funksiyalar</h2>
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ scale: 1.05, y: -6 }}
              className="bg-black/20 border border-white/10 rounded-2xl p-6 cursor-default hover:shadow-xl hover:shadow-accent/15 transition-shadow"
            >
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4 shadow-lg shadow-accent/20">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Screenshots gallery */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger}
        className="mb-10"
      >
        <motion.div variants={fadeUp} className="flex items-start gap-2 mb-6">
          <ImageIcon className="w-5 h-5 text-accent mt-2 drop-shadow-[0_0_8px_var(--accent-ring)]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rasmlar</h2>
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div variants={fadeUp} whileHover={{ scale: 1.02 }} className="overflow-hidden group">
            <div className="rounded-2xl overflow-hidden bg-black/20 border border-white/10">
              <img
                src={`${BASE}landing_1.jpg`}
                alt="Muxa Client screenshot 1"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </motion.div>
          <motion.div variants={fadeUp} whileHover={{ scale: 1.02 }} className="overflow-hidden group">
            <div className="rounded-2xl overflow-hidden bg-black/20 border border-white/10">
              <img
                src={`${BASE}landing_1.jpg`}
                alt="Muxa Client screenshot 2"
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* YouTube Video */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger}
        className="mb-10"
      >
        <motion.div variants={fadeUp} className="flex items-start gap-2 mb-6">
          <Youtube className="w-5 h-5 text-red-400 mt-2" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Videolar</h2>
        </motion.div>
        <motion.div
          variants={fadeUp}
          whileHover={{ scale: 1.01 }}
          className="relative aspect-video rounded-2xl overflow-hidden bg-black/20 border border-white/10 shadow-lg shadow-accent/10 transition-all"
        >
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Muxa Client video obzor"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </motion.div>
      </motion.section>

      {/* Reviews */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger}
        className="mb-10"
      >
        <motion.div variants={fadeUp} className="flex items-start gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-accent mt-2 drop-shadow-[0_0_8px_var(--accent-ring)]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mijozlar Fikri</h2>
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <motion.div key={r.name} variants={fadeUp} whileHover={{ scale: 1.02, y: -4 }}>
              <Card className="p-5 h-full transition-shadow hover:shadow-lg hover:shadow-accent/10">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: r.stars }).map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed">
                  "{r.text}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xs font-bold">{r.name[0]}</span>
                  </div>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">{r.name}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

    </div>
  );
}
