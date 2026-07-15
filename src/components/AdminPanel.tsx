import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, type Plan, type Receipt, type Profile, type Subscription } from '../lib/supabase';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  CreditCard,
  Settings,
  Search,
  Save,
  Ban,
  Trash2,
  Clock,
  Cpu,
  Tag,
  Gift,
  Plus,
  ShoppingCart,
  Eraser,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { toast } from 'sonner';

type Tab = 'pending' | 'users' | 'plans' | 'promo';

type UserWithSub = Profile & {
  active_subscription?: Subscription | null;
};

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('pending');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'pending', label: "To'lovlar", icon: <CreditCard className="w-4 h-4" /> },
    { key: 'users', label: 'Foydalanuvchilar', icon: <Users className="w-4 h-4" /> },
    { key: 'plans', label: 'Tariflar', icon: <Settings className="w-4 h-4" /> },
    { key: 'promo', label: 'Promokodlar', icon: <Tag className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-900 dark:text-white mb-6"
      >
        Admin paneli
      </motion.h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-white/10 border border-white/10 rounded-2xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {tab === t.key && (
              <motion.div
                layoutId="admin-tab"
                className="absolute inset-0 bg-accent-gradient rounded-xl shadow-lg"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span
              className={`relative z-10 flex items-center gap-2 ${
                tab === t.key ? 'text-white' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'pending' && <PendingPayments />}
          {tab === 'users' && <UsersList />}
          {tab === 'plans' && <PlansEditor />}
          {tab === 'promo' && <PromoCodes />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// PENDING PAYMENTS
// ============================================================
function PendingPayments() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Receipt | null>(null);

  const load = async () => {
    const { data: receiptData } = await supabase
      .from('receipts')
      .select('*, plan:plans(*)')
      .order('created_at', { ascending: false });

    if (!receiptData) { setLoading(false); return; }

    const userIds = [...new Set(receiptData.map((r) => r.user_id as string))];
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, email, hwid')
      .in('id', userIds);

    const profileMap = new Map((profileData ?? []).map((p) => [p.id, p]));
    const merged = receiptData.map((r) => ({
      ...r,
      profile: profileMap.get(r.user_id) ?? null,
    }));

    setReceipts(merged as Receipt[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (receipt: Receipt) => {
    setProcessing(receipt.id);
    const plan = receipt.plan;
    if (!plan) return;

    // HWID Reset - faqat HWID ni tozalash
    if (plan.code === 'hwid-reset') {
      // Profile HWID ni tozalash
      await supabase
        .from('profiles')
        .update({ hwid: null })
        .eq('id', receipt.user_id);

      // Client access HWID ni tozalash
      await supabase
        .from('client_access')
        .update({ hwid: null })
        .eq('user_id', receipt.user_id);

      await supabase
        .from('receipts')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', receipt.id);

      toast.success('HWID tozalandi. Foydalanuvchi yangi qurilmada kirishi mumkin.');
      load();
      setProcessing(null);
      return;
    }

    const startDate = new Date();
    let endDate: Date;

    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('end_date')
      .eq('user_id', receipt.user_id)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .maybeSingle();

    const baseDate = currentSub && new Date(currentSub.end_date) > startDate
      ? new Date(currentSub.end_date)
      : startDate;
    endDate = new Date(baseDate.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: receipt.user_id,
      plan_id: plan.id,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (subError) {
      toast.error('Xatolik: ' + subError.message);
      setProcessing(null);
      return;
    }

    await supabase
      .from('client_access')
      .update({ subscription_active: true, subscription_end_date: endDate.toISOString() })
      .eq('user_id', receipt.user_id);

    await supabase
      .from('receipts')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', receipt.id);

    toast.success('Chek tasdiqlandi');
    load();
    setProcessing(null);
  };

  const reject = async (receipt: Receipt) => {
    setProcessing(receipt.id);
    await supabase
      .from('receipts')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', receipt.id);
    toast.success('Chek rad etildi');
    load();
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const pending = receipts.filter((r) => r.status === 'pending');
  const approved = receipts.filter((r) => r.status === 'approved');
  const rejected = receipts.filter((r) => r.status === 'rejected');

  if (receipts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle className="w-12 h-12 text-accent mx-auto mb-3" />
        <p className="text-gray-900 dark:text-white font-medium">Cheklar yo'q</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Hozircha chek yuklanmagan</p>
      </Card>
    );
  }

  const renderRow = (r: Receipt) => (
    <motion.div
      key={r.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row gap-4 items-start bg-black/5 dark:bg-black/20 border border-white/5 dark:border-white/5 rounded-2xl p-4 hover:bg-black/10 dark:hover:bg-black/30 transition-all"
    >
      <button
        onClick={() => setViewing(r)}
        className="sm:w-20 sm:h-20 w-full h-32 rounded-xl overflow-hidden border border-white/10 dark:border-white/10 shrink-0 hover:opacity-80 transition-opacity"
      >
        <img
          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/receipts/${r.file_path}`}
          alt="Chek"
          className="w-full h-full object-contain"
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-gray-900 dark:text-white font-medium text-sm">{r.plan?.name}</span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {new Intl.NumberFormat('uz-UZ').format(r.plan?.price ?? 0)} so'm
          </span>
          <Badge tone={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
            {r.status === 'approved' ? 'Tasdiqlangan' : r.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-xs truncate">
          {r.profile?.email ?? "Noma'lum foydalanuvchi"}
        </p>
        {r.profile?.hwid && (
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5 flex items-center gap-1">
            <Cpu className="w-3 h-3" /> HWID: {r.profile.hwid}
          </p>
        )}
        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(r.created_at).toLocaleString('uz-UZ')}
        </p>
      </div>

      {r.status === 'pending' && (
        <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
          <Button onClick={() => approve(r)} disabled={processing === r.id} size="sm" variant="success" className="flex-1">
            {processing === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Tasdiqlash
          </Button>
          <Button onClick={() => reject(r)} disabled={processing === r.id} size="sm" variant="danger" className="flex-1">
            <XCircle className="w-4 h-4" />
            Rad etish
          </Button>
        </div>
      )}
    </motion.div>
  );

  return (
    <>
      {/* Tastiqlanmagan — always on top */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-4 flex items-center gap-2">
            <Badge tone="warning">{pending.length}</Badge>
            Tasdiqlanmagan
          </h3>
          <div className="space-y-3">{pending.map(renderRow)}</div>
        </div>
      )}

      {/* Cheklar tarixi — only in admin panel, at bottom */}
      {(approved.length > 0 || rejected.length > 0) && (
        <div>
          <div className="flex items-center justify-between border-t border-white/5 pt-6 mb-3">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Cheklar tarixi
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                // Yangi ma'lumotlarni bazadan olish (stale closure muammosini oldini olish)
                const { data: allReceipts } = await supabase
                  .from('receipts')
                  .select('id')
                  .neq('status', 'pending');

                if (!allReceipts || allReceipts.length === 0) {
                  toast.error('Tozalash uchun chek yo\'q');
                  return;
                }

                const ids = allReceipts.map((r) => r.id);
                const { error } = await supabase
                  .from('receipts')
                  .delete()
                  .in('id', ids);

                if (error) {
                  toast.error('Xatolik: ' + error.message + '. Iltimos, Supabase SQL migratsiyani qo\'llang!');
                } else {
                  toast.success('Cheklar tarixi tozalandi');
                  load();
                }
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Eraser className="w-3.5 h-3.5" />
              Tozalash
            </Button>
          </div>
          <div className="space-y-2 opacity-60">
            {[...approved, ...rejected].map(renderRow)}
          </div>
        </div>
      )}

      {/* Image viewer modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} className="max-w-2xl">
        <div className="p-2">
          <img
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/receipts/${viewing?.file_path}`}
            alt="Chek"
            className="w-full max-h-[80vh] object-contain rounded-2xl"
          />
        </div>
      </Modal>
    </>
  );
}

// ============================================================
// USERS LIST
// ============================================================
function UsersList() {
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [extending, setExtending] = useState<string | null>(null);
  const [openSubUser, setOpenSubUser] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  const load = () => {
    supabase.from('plans').select('*').order('sort_order').then(({ data }) => setPlans(data ?? []));
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const profiles = data ?? [];
        const subs = await supabase
          .from('subscriptions')
          .select('*, plan:plans(*)')
          .in('user_id', profiles.map((p) => p.id))
          .eq('status', 'active')
          .order('end_date', { ascending: false });
        const subMap = new Map<string, Subscription>();
        (subs.data ?? []).forEach((s) => {
          if (!subMap.has(s.user_id)) subMap.set(s.user_id, s);
        });
        setUsers(profiles.map((p) => ({ ...p, active_subscription: subMap.get(p.id) ?? null })));
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const resetHwid = async (user: UserWithSub) => {
    await supabase.from('profiles').update({ hwid: null }).eq('id', user.id);
    await supabase.from('client_access').update({ hwid: null }).eq('user_id', user.id);
    toast.success('HWID o\'chirildi');
    load();
  };

  const toggleBlock = async (user: UserWithSub) => {
    await supabase.from('profiles').update({ is_blocked: !user.is_blocked }).eq('id', user.id);
    toast.success(user.is_blocked ? 'Blokdan chiqarildi' : 'Bloklandi');
    load();
  };

  const deleteUser = async (user: UserWithSub) => {
    await supabase.from('profiles').delete().eq('id', user.id);
    toast.success('Akkount o\'chirildi');
    load();
  };

  const removeSub = async (user: UserWithSub) => {
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!activeSubs || activeSubs.length === 0) {
      toast.error('Faol obuna mavjud emas');
      return;
    }

    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    await supabase
      .from('client_access')
      .update({ subscription_active: false })
      .eq('user_id', user.id);

    toast.success('Obuna olib tashlandi');
    load();
  };

  const extendSub = async (user: UserWithSub, plan: Plan) => {
    setExtending(user.id);
    const startDate = new Date();
    let endDate: Date;
    const base = user.active_subscription && new Date(user.active_subscription.end_date) > startDate
      ? new Date(user.active_subscription.end_date)
      : startDate;
    endDate = new Date(base.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan_id: plan.id,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
    await supabase
      .from('client_access')
      .update({ subscription_active: true, subscription_end_date: endDate.toISOString() })
      .eq('user_id', user.id);
    setExtending(null);
    toast.success('Obuna uzaytirildi');
    load();
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) || u.hwid?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Email yoki HWID bo'yicha qidirish"
          className="pl-10"
        />
      </div>

      {/* Users */}
      <div className="space-y-3">
        {filtered.map((u, i) => {
          const sub = u.active_subscription;
          const daysLeft = sub
            ? Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null;

          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="p-4 hover:bg-white/10 dark:hover:bg-white/5 transition-all">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-gray-900 dark:text-white font-medium text-sm truncate">{u.email}</span>
                      {u.is_admin && <Badge tone="info">Admin</Badge>}
                      {u.is_blocked && <Badge tone="error">Bloklangan</Badge>}
                    </div>

                    {/* HWID display */}
                    <div className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      HWID: {u.hwid || 'kiritilmagan'}
                    </div>

                    {/* Subscription info */}
                    <div className="mt-2 flex items-center gap-3 text-xs flex-wrap">
                      {sub ? (
                        <>
                          <span className="text-gray-600 dark:text-gray-300">{sub.plan?.name}</span>
                          <Badge tone={(daysLeft ?? 0) > 0 ? 'success' : 'error'}>
                            {(daysLeft ?? 0) > 0 ? `${daysLeft} kun qoldi` : 'Tugagan'}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-500">Obuna yo'q</span>
                      )}
                    </div>
                  </div>

                  {/* Actions — icon only, uniform */}
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {/* HWID reset */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => resetHwid(u)}
                      title="HWID o'chirish"
                      className="w-9 h-9 p-0 min-w-0"
                    >
                      <Cpu className="w-4 h-4" />
                    </Button>

                    {/* Obuna inline expand */}
                    <Button
                      size="sm"
                      variant={openSubUser === u.id ? 'primary' : 'secondary'}
                      onClick={() => setOpenSubUser(openSubUser === u.id ? null : u.id)}
                      title="Obuna uzaytirish"
                      className="w-9 h-9 p-0 min-w-0"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>

                    {/* Obunani olib tashlash */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSub(u)}
                      title="Obunani olib tashlash"
                      className="w-9 h-9 p-0 min-w-0 text-rose-400 hover:bg-rose-500/10"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>

                    {/* Block/Unblock */}
                    <Button
                      size="sm"
                      variant={u.is_blocked ? 'danger' : 'secondary'}
                      onClick={() => toggleBlock(u)}
                      title={u.is_blocked ? "Blokdan chiqarish" : "Bloklash"}
                      className={`w-9 h-9 p-0 min-w-0 ${u.is_blocked ? 'bg-red-500/20 border-red-500/30' : ''}`}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteUser(u)}
                      title="Akkountni o'chirish"
                      className="w-9 h-9 p-0 min-w-0 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Obuna inline plan list — opens inside the card */}
                {openSubUser === u.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-white/5 mt-4 pt-4"
                  >
                    <p className="text-gray-400 text-xs mb-3">Obuna turini tanlang:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {plans.map((p) => (
                        <Button
                          key={p.id}
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            extendSub(u, p);
                            setOpenSubUser(null);
                          }}
                          disabled={extending === u.id}
                          className="w-full"
                        >
                          {extending === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            p.name
                          )}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Foydalanuvchilar topilmadi</p>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// PLANS EDITOR (with HWID update)
// ============================================================
function PlansEditor() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, { name: string; price: string; duration_days: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = () => {
    supabase.from('plans').select('*').order('sort_order').then(({ data }) => {
      setPlans(data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const savePlan = async (plan: Plan) => {
    setSaving(plan.id);
    const edits = editing[plan.id];
    if (!edits) return;
    await supabase.from('plans').update({
      name: edits.name,
      price: parseInt(edits.price) || 0,
      duration_days: parseInt(edits.duration_days) || 0,
    }).eq('id', plan.id);
    setEditing((prev) => { const next = { ...prev }; delete next[plan.id]; return next; });
    setSaving(null);
    toast.success('Tarif saqlandi');
    load();
  };

  const toggleActive = async (plan: Plan) => {
    await supabase.from('plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    toast.success(plan.is_active ? 'Tarif o\'chirildi' : 'Tarif faollashtirildi');
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan, i) => {
        const edits = editing[plan.id];
        const isEditing = !!edits;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 hover:bg-white/10 dark:hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Nomi</label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={edits.name}
                        onChange={(e) => setEditing((p) => ({ ...p, [plan.id]: { ...p[plan.id], name: e.target.value } }))}
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white text-sm py-2">{plan.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Narxi (so'm)</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={edits.price}
                        onChange={(e) => setEditing((p) => ({ ...p, [plan.id]: { ...p[plan.id], price: e.target.value } }))}
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white text-sm py-2">
                        {new Intl.NumberFormat('uz-UZ').format(plan.price)} so'm
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Kunlar (-1 = cheksiz)</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={edits.duration_days}
                        onChange={(e) => setEditing((p) => ({ ...p, [plan.id]: { ...p[plan.id], duration_days: e.target.value } }))}
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white text-sm py-2">
                        {plan.duration_days} kun
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={() => savePlan(plan)} disabled={saving === plan.id}>
                        {saving === plan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Saqlash
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing((p) => { const n = { ...p }; delete n[plan.id]; return n; })}
                      >
                        Bekor
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditing((p) => ({
                          ...p,
                          [plan.id]: {
                            name: plan.name,
                            price: String(plan.price),
                            duration_days: String(plan.duration_days),
                          },
                        }))}
                      >
                        Tahrirlash
                      </Button>
                      <Button
                        size="sm"
                        variant={plan.is_active ? 'success' : 'ghost'}
                        onClick={() => toggleActive(plan)}
                      >
                        {plan.is_active ? 'Faol' : 'Faol emas'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// PROMO CODES
// ============================================================
type PromoCodeRecord = {
  id: string;
  code: string;
  plan_id: string;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  plan?: Plan;
};

function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const [promoRes, plansRes] = await Promise.all([
      supabase.from('promo_codes').select('*, plan:plans(*)').order('created_at', { ascending: false }),
      supabase.from('plans').select('*').order('sort_order'),
    ]);
    setPromoCodes(promoRes.data ?? []);
    setPlans(plansRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createPromo = async () => {
    if (!newCode.trim() || !newPlanId) return;
    setCreating(true);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('promo_codes').insert({
      code: newCode.trim().toUpperCase(),
      plan_id: newPlanId,
      max_uses: newMaxUses,
      expires_at: expiresAt,
      is_active: true,
    });

    if (error) {
      toast.error('Xatolik: ' + error.message);
    } else {
      toast.success(`Promokod ${newCode.trim().toUpperCase()} yaratildi!`);
      setNewCode('');
      setNewPlanId('');
      setNewMaxUses(1);
      load();
    }
    setCreating(false);
  };

  const toggleActive = async (promo: PromoCodeRecord) => {
    await supabase.from('promo_codes').update({ is_active: !promo.is_active }).eq('id', promo.id);
    toast.success(promo.is_active ? 'Promokod o\'chirildi' : 'Promokod faollashtirildi');
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Create promo code */}
      <Card className="p-6 mb-6">
        <h3 className="text-gray-900 dark:text-white font-medium mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-accent" />
          Yangi promokod yaratish
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Promokod</label>
            <Input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="MASALAN: PROMO2024"
              className="bg-white/5 border-white/10 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Tarif</label>
            <select
              value={newPlanId}
              onChange={(e) => setNewPlanId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm outline-none"
            >
              <option value="">Tanlang...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">Max foydalanish</label>
            <Input
              type="number"
              min={1}
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 1)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={createPromo}
              disabled={creating || !newCode.trim() || !newPlanId}
              className="w-full"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Yaratish
            </Button>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          Promokod yaratilgandan so'ng <strong>24 soat</strong> davomida ishlaydi. Har bir foydalanuvchi faqat 1 marta ishlata oladi.
        </p>
      </Card>

      {/* Existing promo codes */}
      {promoCodes.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-12 h-12 text-accent mx-auto mb-3" />
          <p className="text-gray-900 dark:text-white font-medium">Promokodlar yo'q</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Hali hech qanday promokod yaratilmagan</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {promoCodes.map((promo, i) => {
            const expired = new Date(promo.expires_at) < new Date();
            const isFull = promo.used_count >= promo.max_uses;

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="text-accent font-bold text-sm tracking-wider">{promo.code}</code>
                        <Badge tone={expired || isFull || !promo.is_active ? 'error' : 'success'}>
                          {!promo.is_active ? 'O\'chirilgan' : expired ? 'Muddati tugagan' : isFull ? 'To\'lgan' : 'Faol'}
                        </Badge>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Tarif: {promo.plan?.name} |
                        Ishlatilgan: {promo.used_count}/{promo.max_uses} |
                        Tugash: {new Date(promo.expires_at).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={promo.is_active ? 'ghost' : 'success'}
                      onClick={() => toggleActive(promo)}
                      className="min-w-[80px] shrink-0"
                    >
                      {promo.is_active ? 'O\'chirish' : 'Faol'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
