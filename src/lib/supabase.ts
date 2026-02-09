import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isPublishable: !!supabaseAnonKey && supabaseAnonKey.startsWith('sb_publishable_')
};

if (!supabaseUrl || !supabaseAnonKey || supabaseConfig.isPublishable) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase config issue. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (must be anon, not publishable).'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
