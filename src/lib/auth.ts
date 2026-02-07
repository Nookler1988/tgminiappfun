import { supabase } from './supabase';

export const getUserId = async (): Promise<string | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id || null;
};
