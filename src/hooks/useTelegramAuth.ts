import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getInitData, getTelegram } from '../lib/telegram';

const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined;

export const useTelegramAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tg = getTelegram();
    tg?.ready();
    tg?.expand();

    const init = async () => {
      setLoading(true);
      setError(null);
      const existing = await supabase.auth.getSession();
      if (existing.data.session) {
        setLoading(false);
        return;
      }
      if (!functionsUrl) {
        setError('Missing VITE_SUPABASE_FUNCTIONS_URL');
        setLoading(false);
        return;
      }
      const initData = getInitData();
      if (!initData) {
        setError('Telegram initData is empty. Open inside Telegram.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${functionsUrl}/auth-telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        });
        if (!res.ok) {
          throw new Error(`Auth failed: ${res.status}`);
        }
        const json = (await res.json()) as {
          access_token: string;
          refresh_token: string;
        };
        await supabase.auth.setSession({
          access_token: json.access_token,
          refresh_token: json.refresh_token
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  return { loading, error };
};
