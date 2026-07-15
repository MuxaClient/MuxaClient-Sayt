import { useEffect, useState } from 'react';
import { supabase, syncClientAccessForUser, TELEGRAM_URL, type Subscription, type Receipt } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.BASE_URL;
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Cpu,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Tag,
  Gift,
  Ban,
  Download,
  Gamepad2,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((subRes) => {
        setSubscription(subRes.data as Subscription | null);
        setLoading(false);
      });
  }, [user]);

  const handlePromoSubmit = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code || !user) return;

    setPromoLoading(true);
    setPromoError(null);
    setPromoSuccess(false);

    try {
      // Find active promo code
      const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (promoError || !promo) {
        setPromoError('Promokod topilmadi');
        setPromoLoading(false);
        return;
      }

      // Check if expired
      if (new Date(promo.expires_at) < new Date()) {
        setPromoError('Promokod muddati tugagan');
        setPromoLoading(false);
        return;
      }

      // Check if inactive or max uses reached
      if (!promo.is_active || promo.used_count >= promo.max_uses) {
        setPromoError('Promokod tugagan');
        setPromoLoading(false);
        return;
      }

      // Check if user already used this code
      const { data: existingUsage } = await supabase
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code_id', promo.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingUsage) {
        setPromoError('Siz bu promokodni allaqachon ishlatgansiz');
        setPromoLoading(false);
        return;
      }

      // Get the plan
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', promo.plan_id)
        .single();

      if (!plan) {
        setPromoError('Tarif topilmadi');
        setPromoLoading(false);
        return;
      }

      // Create subscription
      const startDate = new Date();
      let endDate: Date;
      if (plan.duration_days === -1) {
        endDate = new Date('2099-12-31');
      } else {
        const { data: currentSub } = await supabase
          .from('subscriptions')
          .select('end_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('end_date', { ascending: false })
          .maybeSingle();

        const baseDate = currentSub && new Date(currentSub.end_date) > startDate
          ? new Date(currentSub.end_date)
          : startDate;
        endDate = new Date(baseDate.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
      }

      const { error: subError } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (subError) throw subError;

      // Record usage
      await supabase.from('promo_code_usage').insert({
        promo_code_id: promo.id,
        user_id: user.id,
      });

      // Increment used_count
      await supabase
        .from('promo_codes')
        .update({ used_count: promo.used_count + 1 })
        .eq('id', promo.id);

      setPromoSuccess(true);
      toast.success(`Promokod qabul qilindi! ${plan.name} obunangiz faollashtirildi!`);

      // Refresh subscription
      const { data: newSub } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubscription(newSub as Subscription | null);

      if (profile) {
        await syncClientAccessForUser({
          userId: user.id,
          email: profile.email,
          username: profile.username,
          hwid: profile.hwid,
          role: profile.is_admin ? 'Admin' : 'User',
          subscriptionActive: Boolean(newSub?.status === 'active' && new Date(newSub.end_date) > new Date()),
          subscriptionEndDate: newSub?.end_date ?? null,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      setPromoError(msg);
    } finally {
      setPromoLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!subscription || subscription.status !== 'active') return null;
    const end = new Date(subscription.end_date).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();
  const isActive = subscription?.status === 'active' && daysLeft !== 0;
  const userEmail = profile?.email || user?.email || 'user';

  const handleDownload = async () => {
    if (!user || !profile) return;
    setDownloading(true);
    setDownloadError(null);

    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, end_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isSubActive = sub?.status === 'active' && new Date(sub.end_date) > new Date();
      if (!isSubActive) {
        setDownloadError('Obunangiz yo\'q yoki muddati tugagan. Avval obuna sotib oling.');
        setDownloading(false);
        return;
      }

      const fileName = `MuxaClient-${userEmail}.jar`;
      const link = document.createElement('a');
      link.href = `${BASE}MuxaClient.jar`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setDownloadError('Yuklab olishda xatolik yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (profile?.is_blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#07070b]">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12">
            <Ban className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-red-400 mb-4">
              Muxa Client
            </h1>
            <h2 className="text-2xl font-bold text-white mb-6">
              Siz Blocklangansiz
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
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Yuklab olish - faqat obunasi borlarda, tepada */}
      {isActive && (
        <motion.div variants={fadeUp}>
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-accent drop-shadow-[0_0_8px_var(--accent-ring)]" />
              <h3 className="text-gray-900 dark:text-white font-medium">Muxa Client yuklab olish</h3>
            </div>

            <div className="bg-black/10 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 flex items-center justify-center p-2 rounded-xl bg-accent/10">
                  <img src={`${BASE}logo.png`} alt="Muxa Client" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-bold text-lg">Muxa Client v1.0.0</h4>
                  <p className="text-gray-400 text-sm">Minecraft 1.21.4 | Fabric Loader</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>HWID Himoya</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Gamepad2 className="w-3.5 h-3.5 text-accent" />
                  <span>62+ Modullar</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span>Anti-Cheat Bypass</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <p>Fayl: <code className="text-accent">MuxaClient-{userEmail}.jar</code></p>
                <p>O'rnatish: Mod faylini Minecraft mods papkasiga joylashtiring</p>
                <p>Qo'shimcha: Fabric Loader va Fabric API talab qilinadi</p>
              </div>

              {downloadError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-red-400 text-xs">{downloadError}</span>
                </div>
              )}

              <Button
                onClick={handleDownload}
                disabled={downloading}
                variant="primary"
                size="md"
                className="w-full"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Yuklab olish
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.h1
        variants={fadeUp}
        className="text-3xl font-bold text-gray-900 dark:text-white mb-6"
      >
        Mening panelim
      </motion.h1>

      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Subscription status */}
        <motion.div variants={fadeUp}>
          <Card className={`p-5 h-full ${isActive ? 'shadow-accent/10' : ''}`}>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-3">
              <Calendar className="w-4 h-4" />
              Obuna holati
            </div>
            {isActive ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent drop-shadow-[0_0_8px_var(--accent-ring)]" />
                <span className="text-gray-900 dark:text-white font-medium">Faol</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-gray-900 dark:text-white font-medium">
                  {subscription && subscription.status === 'active' ? 'Faol' : subscription ? 'Muddati tugagan' : "Obuna yo'q"}
                </span>
              </div>
            )}
            {subscription?.plan && subscription.status === 'active' && (
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{subscription.plan.name}</p>
            )}
          </Card>
        </motion.div>

        {/* Days left */}
        <motion.div variants={fadeUp}>
          <Card className="p-5 h-full">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-3">
              <Clock className="w-4 h-4" />
              Qolgan kunlar
            </div>
            <span className="text-gray-900 dark:text-white font-medium text-lg">
              {daysLeft !== null ? `${daysLeft} kun` : '—'}
            </span>          </Card>
        </motion.div>
        
        {/* End date */}
        <motion.div variants={fadeUp}>
          <Card className="p-5 h-full">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-3">
              <Calendar className="w-4 h-4" />
              Tugash sanasi
            </div>
            <span className="text-gray-900 dark:text-white font-medium text-sm">
              {subscription && subscription.status === 'active'
                ? new Date(subscription.end_date).toLocaleDateString('uz-UZ')
                : '—'}
            </span>
          </Card>
        </motion.div>
      </motion.div>

      {/* HWID */}
      <motion.div variants={fadeUp}>
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-accent drop-shadow-[0_0_8px_var(--accent-ring)]" />
            <h3 className="text-gray-900 dark:text-white font-medium">HWID</h3>
          </div>
          <div className="bg-black/10 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              {profile?.hwid ? (
                <code className="text-gray-900 dark:text-white font-mono text-sm break-all">{profile.hwid}</code>
              ) : (
                <p className="text-gray-400 text-sm">O'rnatilmagan</p>
              )}
              <Badge tone={profile?.hwid ? 'success' : 'warning'} className="shrink-0 ml-2">
                {profile?.hwid ? 'Ulangan' : 'Ulanmagan'}
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Promo Code */}
      <motion.div variants={fadeUp}>
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-accent drop-shadow-[0_0_8px_var(--accent-ring)]" />
            <h3 className="text-gray-900 dark:text-white font-medium">Promokod</h3>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoError(null); setPromoSuccess(false); }}
              placeholder="Promokodni kiriting..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-500"
            />
            <Button
              onClick={handlePromoSubmit}
              disabled={promoLoading || !promoCode.trim()}
              variant="primary"
              size="md"
              className="shrink-0"
            >
              {promoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Tasdiqlash'
              )}
            </Button>
          </div>
          {promoError && (
            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {promoError}
            </p>
          )}
          {promoSuccess && (
            <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Promokod muvaffaqiyatli qabul qilindi!
            </p>
          )}
          <p className="text-gray-500 text-xs mt-2">
            Promokodingiz bo'lsa, yuqoridagi maydonga kiriting va Tasdiqlash tugmasini bosing.
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
