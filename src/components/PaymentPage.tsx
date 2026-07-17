import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  supabase,
  TELEGRAM_URL,
  CARD_NUMBER,
  CARD_OWNER,
  CARD_TYPE,
  MAX_FILE_SIZE,
  type Plan,
} from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  X,
  FileUp,
  Gift,
  Tag,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { toast } from 'sonner';

export default function PaymentPage({
  plan,
  onBack,
  onSuccess,
}: {
  plan: Plan;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoYoutuber, setPromoYoutuber] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('uz-UZ').format(price) + " so'm";

  const discountedPrice = promoDiscount > 0
    ? Math.round(plan.price * (1 - promoDiscount / 100))
    : plan.price;

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!f.type.startsWith('image/')) {
      setError('Faqat rasm fayllari yuklanishi mumkin');
      toast.error('Faqat rasm fayllari yuklanishi mumkin');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError('Rasm hajmi 5MB dan oshmasligi kerak');
      toast.error('Rasm hajmi 5MB dan oshmasligi kerak');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const copyCardNumber = () => {
    navigator.clipboard.writeText(CARD_NUMBER);
    setCopied(true);
    toast.success('Karta raqami nusxalandi');
    setTimeout(() => setCopied(false), 2000);
  };

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_yt_promo', {
        p_code: promoCode.trim().toUpperCase(),
      });
      if (error) throw error;
      if (data && data[0]?.valid) {
        setPromoDiscount(data[0].discount_percent);
        setPromoYoutuber(data[0].youtuber_name);
        setPromoApplied(true);
        toast.success(`Promo qabul qilindi! ${data[0].discount_percent}% chegirma (${data[0].youtuber_name})`);
      } else {
        toast.error(data?.[0]?.message || 'Promo kod noto\'g\'ri');
        setPromoDiscount(0);
        setPromoApplied(false);
      }
    } catch (err) {
      toast.error('Promo tekshirishda xatolik');
      setPromoDiscount(0);
      setPromoApplied(false);
    }
    setPromoLoading(false);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 20, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, { upsert: false });

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('receipts').insert({
        user_id: user.id,
        plan_id: plan.id,
        file_path: fileName,
        status: 'pending',
      });

      if (dbError) throw dbError;

      setSuccess(true);
      toast.success('Chek muvaffaqiyatli yuklandi!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Yuklashda xatolik yuz berdi';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 mb-5"
            >
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chek yuklandi!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Admin chekni 24 soat ichida tekshirib chiqadi.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
              <p className="text-amber-400 text-sm flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Obuna 24 soat ichida faollashtiriladi
              </p>
            </div>
            <Button onClick={onSuccess} size="lg" className="w-full">
              Panelga qaytish
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative max-w-2xl mx-auto px-4 py-8">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Narxlarga qaytish
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">To'lov ma'lumotlari</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          Tanlangan reja:{' '}
          <span className="text-accent font-medium">{plan.name}</span> —{' '}
          {promoApplied && (
            <span className="text-gray-500 line-through text-xs mr-1">{formatPrice(plan.price)}</span>
          )}
          <span className="text-accent font-medium">{formatPrice(discountedPrice)}</span>
        </p>
      </motion.div>

      {/* YT Promo Code Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-accent" />
            <span className="text-gray-900 dark:text-white text-sm font-medium">YouTuber promo kodi</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                if (promoApplied) {
                  setPromoApplied(false);
                  setPromoDiscount(0);
                }
              }}
              placeholder="Promo kodni kiriting..."
              disabled={promoApplied}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none disabled:opacity-50"
            />
            {promoApplied ? (
              <button
                onClick={() => {
                  setPromoApplied(false);
                  setPromoDiscount(0);
                  setPromoCode('');
                  setPromoYoutuber('');
                }}
                className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
              >
                Bekor
              </button>
            ) : (
              <button
                onClick={validatePromo}
                disabled={promoLoading || !promoCode.trim()}
                className="px-4 py-2 rounded-xl bg-accent/20 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/30 transition-all disabled:opacity-50"
              >
                {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
              </button>
            )}
          </div>
          {promoApplied && (
            <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {promoDiscount}% chegirma — YouTuber: {promoYoutuber}
            </p>
          )}
        </Card>
      </motion.div>

      {/* Card info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-medium text-sm">{CARD_TYPE} karta</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Karta egasi: {CARD_OWNER}</p>
            </div>
          </div>

          <div className="bg-black/5 dark:bg-black/30 rounded-xl p-4 border border-white/5 dark:border-white/5">
            <p className="text-gray-500 dark:text-gray-500 text-xs mb-1">Karta raqami</p>
            <div className="flex items-center justify-between">
              <code className="text-gray-900 dark:text-white text-lg font-mono tracking-wider">{CARD_NUMBER}</code>
              <button
                onClick={copyCardNumber}
                className="text-gray-400 hover:text-accent transition-colors p-1"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-500">To'lov summasi:</span>
            <div className="text-right">
              {promoApplied && (
                <span className="text-gray-500 line-through text-xs mr-2">{formatPrice(plan.price)}</span>
              )}
              <span className="text-accent font-medium">{formatPrice(discountedPrice)}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Telegram button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="lg" className="w-full mb-6 bg-[#229ED9] text-white border-transparent hover:bg-[#1b8dc4]">
            <Send className="w-4 h-4" />
            Telegram lichkaga o'tish
          </Button>
        </a>
      </motion.div>

      {/* Receipt upload - Drag & Drop */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-6">
          <h3 className="text-gray-900 dark:text-white font-medium text-sm mb-1">Chek rasmini yuklang</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
            To'lovdan so'ng chek rasmini yuklang. Maksimal hajm: 5MB.
          </p>

          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              className={`relative border-2 border-dashed rounded-2xl py-12 px-4 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-accent bg-accent/5 scale-[1.02]'
                  : 'border-white/20 dark:border-white/10 hover:border-accent/40'
              }`}
            >
              <label className="flex flex-col items-center justify-center gap-3 cursor-pointer">
                <motion.div
                  animate={dragOver ? { scale: 1.2, y: -5 } : { scale: 1, y: 0 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10"
                >
                  <FileUp className="w-7 h-7 text-accent" />
                </motion.div>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-medium">
                    Rasmni shu yerga tashlang
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    yoki bosib tanlang — JPG, PNG, WEBP — maks 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 dark:border-white/10">
                <img src={preview} alt="Chek" className="w-full max-h-64 object-contain bg-black/30" />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500/80 text-white rounded-lg p-1.5 hover:bg-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <ImageIcon className="w-3.5 h-3.5" />
                {file?.name} ({((file?.size ?? 0) / 1024 / 1024).toFixed(2)} MB)
              </div>
            </div>
          )}

          {/* Progress bar */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Yuklanmoqda...
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent-gradient rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            size="lg"
            className="w-full mt-4"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Chekni yuborish
              </>
            )}
          </Button>
        </Card>
      </motion.div>

      {/* Warning notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3"
      >
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-amber-400 text-sm">
          Admin chekni 24 soat ichida tekshirib chiqadi. Obuna tasdiqlangandan so'ng avtomatik faollashtiriladi.
        </p>
      </motion.div>
    </div>
  );
}
