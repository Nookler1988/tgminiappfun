import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/auth';

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
};

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      const userId = await getUserId();
      if (!userId) return;
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, username, photo_url')
        .eq('id', userId)
        .maybeSingle();
      setProfile((data as Profile) || null);
    };
    void load();
  }, []);

  return { profile };
};
