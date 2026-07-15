import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dbfezudevggokspdktye.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZmV6dWRldmdnb2tzcGRrdHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNzM0MjUsImV4cCI6MjA5OTY0OTQyNX0.WaQOish6oPT6958UjCfaXNcbVVeiCQ6-gq0RmhIc1gw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Plan = {
  id: string;
  code: string;
  name: string;
  duration_days: number;
  price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  username: string | null;
  hwid: string | null;
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  plan?: Plan;
};

export type Receipt = {
  id: string;
  user_id: string;
  plan_id: string;
  file_path: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  plan?: Plan;
  profile?: { email: string; hwid: string | null };
};

export type ClientAccess = {
  id: string;
  user_id: string;
  email: string | null;
  username: string | null;
  hwid: string | null;
  role: string;
  subscription_active: boolean;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
};

export async function syncClientAccessForUser(input: {
  userId: string;
  email?: string | null;
  username?: string | null;
  hwid?: string | null;
  role?: string;
  subscriptionActive?: boolean;
  subscriptionEndDate?: string | null;
}) {
  const { data: existing } = await supabase
    .from('client_access')
    .select('hwid')
    .eq('user_id', input.userId)
    .maybeSingle();

  return supabase.from('client_access').upsert({
    user_id: input.userId,
    email: input.email ?? null,
    username: input.username ?? null,
    hwid: input.hwid ?? existing?.hwid ?? null,
    role: input.role ?? 'User',
    subscription_active: input.subscriptionActive ?? false,
    subscription_end_date: input.subscriptionEndDate ?? null,
  }, { onConflict: 'user_id' });
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const TELEGRAM_URL = 'https://t.me/MuxammaddinUz';
export const CARD_NUMBER = '6262570784704167';
export const CARD_OWNER = 'U. Allambergenova';
export const CARD_TYPE = 'Humo';
