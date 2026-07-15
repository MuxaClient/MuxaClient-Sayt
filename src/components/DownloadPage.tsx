import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, CheckCircle, AlertCircle, Shield, Cpu, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function DownloadPage() {
  const { user, profile } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = profile?.username || user?.email?.split('@')[0] || 'User';

  const handleDownload = async () => {
    if (!user || !profile) return;

    setDownloading(true);
    setError(null);

    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, end_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isActive = sub?.status === 'active' && new Date(sub.end_date) > new Date();
      if (!isActive) {
        setError('Obunangiz yo\'q yoki muddati tugagan. Avval obuna sotib oling.');
        setDownloading(false);
        return;
      }

      const fileName = `MuxaClient-${username}.jar`;
      const link = document.createElement('a');
      link.href = '/MuxaClient.jar';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Yuklab olishda xatolik yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <motion.h1
        variants={fadeUp}
        className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
      >
        Yuklab olish
      </motion.h1>
      <motion.p variants={fadeUp} className="text-gray-400 mb-8">
        Muxa Client modni yuklab oling va Minecraft 1.21.4 da ishlating
      </motion.p>

      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div variants={fadeUp}>
          <Card className="p-5 h-full">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-3">
              <Shield className="w-4 h-4" />
              HWID Himoya
            </div>
            <p className="text-gray-900 dark:text-white font-medium text-sm">
              Litsenziyangiz qurilmangizga bog'langan
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="p-5 h-full">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-3">
              <Cpu className="w-4 h-4" />
              62+ Modullar
            </div>
            <p className="text-gray-900 dark:text-white font-medium text-sm">
              Combat, Render, Movement va boshqalar
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="p-5 h-full">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-3">
              <Gamepad2 className="w-4 h-4" />
              Minecraft 1.21.4
            </div>
            <p className="text-gray-900 dark:text-white font-medium text-sm">
              Fabric mod loader bilan ishlaydi
            </p>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center p-3 rounded-2xl bg-accent/10">
              <img src="/logo.png" alt="Muxa Client" className="w-full h-full object-contain" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Muxa Client v1.0.0
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Fayl nomi: <code className="text-accent">MuxaClient-{username}.jar</code>
            </p>

            {profile?.hwid && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm">HWID bog'langan</span>
              </div>
            )}

            {!profile?.hwid && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm">Birinchi marta ishlatganingizda HWID avtomatik bog'lanadi</span>
              </div>
            )}

            {error && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                variant="primary"
                size="lg"
                className="px-8"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Yuklab olish
                  </>
                )}
              </Button>
            </div>

            <p className="text-gray-500 text-xs mt-4">
              O'rnatish uchun Fabric mod loader talab qilinadi
            </p>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
