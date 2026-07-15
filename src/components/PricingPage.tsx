import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, type Plan } from '../lib/supabase';
import { Check, Calendar, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

type PlanWithDesc = Plan & { desc: string };

export default function PricingPage({ onSelectPlan }: { onSelectPlan: (plan: Plan) => void }) {
  const [plans, setPlans] = useState<PlanWithDesc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          setPlans(data.map((p) => ({
            ...p,
            desc: p.code === 'hwid-reset'
              ? 'Qurilma O\'zgartirish'
              : p.duration_days === -1
              ? 'Cheksiz obuna'
              : p.duration_days + ' kunlik obuna',
          })));
        }
        setLoading(false);
      });
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('uz-UZ').format(price) + " so'm";

  const isHwid = (p: PlanWithDesc) => p.code === 'hwid-reset';

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="relative max-w-7xl mx-auto px-6 py-12"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-4 shadow-lg shadow-accent/10">
          <Sparkles className="w-4 h-4" />
          Tarif rejalari
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Muxa Client narxlari</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          O'zingizga mos rejani tanlang va obuna bo'ling.
        </p>
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const hwid = isHwid(plan);
          return (
            <motion.div key={plan.id} variants={fadeUp} className="flex">
              <Card
                className={`relative p-6 w-full flex flex-col transition-all hover:scale-[1.03] hover:shadow-accent/20 ${
                  hwid ? 'border-dashed border-white/20' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-accent-gradient text-white shadow-lg shadow-accent/30">
                    {hwid ? <RefreshCw className="w-6 h-6" /> : plan.duration_days === -1 ? <Sparkles className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">{plan.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{plan.desc}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-2xl font-bold whitespace-nowrap text-gray-900 dark:text-white">
                    {formatPrice(plan.price)}
                  </span>
                </div>

                <ul className="space-y-2.5 mb-5 flex-1">
                  {[
                    hwid ? 'HWID kodini qayta tiklash' : "To'liq dastur kirish",
                    hwid ? 'Qurilmani o\'zgartirish' : plan.duration_days === -1 ? 'Cheksiz muddat' : `${plan.duration_days} kun davomida`,
                    hwid ? 'Tez va xavfsiz' : 'HWID bog\'lash',
                    hwid ? 'Support orqali' : 'Texnik yordam',
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => onSelectPlan(plan)}
                  variant="primary"
                  size="md"
                  className="w-full whitespace-nowrap"
                >
                  {hwid ? "Sotib olish" : 'Obuna bo\'lish'}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
