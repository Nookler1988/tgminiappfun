import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  applyTelegramSafeArea,
  ensureTelegramScript,
  getInitData,
  getInitDataUnsafe,
  getTelegram,
} from "../lib/telegram";
import { getUserId } from "../lib/auth";

const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as
  | string
  | undefined;

export const useTelegramAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Сначала загружаем скрипт Telegram
      await ensureTelegramScript();

      const tg = getTelegram();
      tg?.ready();
      tg?.expand();

      // Применяем safe area от Telegram
      applyTelegramSafeArea();
      setLoading(true);
      setError(null);
      await ensureTelegramScript();
      const existing = await supabase.auth.getSession();
      if (existing.data.session) {
        const userId = await getUserId();
        const unsafe = getInitDataUnsafe();
        const tgUser = unsafe.user as
          | {
              first_name?: string;
              last_name?: string;
              username?: string;
              photo_url?: string;
            }
          | undefined;
        if (userId && tgUser) {
          await supabase
            .from("users")
            .update({
              first_name: tgUser.first_name || null,
              last_name: tgUser.last_name || null,
              username: tgUser.username || null,
              photo_url: tgUser.photo_url || null,
            })
            .eq("id", userId);
        }
        setLoading(false);
        return;
      }
      if (!functionsUrl) {
        setError("Missing VITE_SUPABASE_FUNCTIONS_URL");
        setLoading(false);
        return;
      }
      const initData = getInitData();
      if (!initData) {
        setError("Запуск вне Telegram. Включен режим предпросмотра.");
        setPreview(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${functionsUrl}/auth-telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
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
          refresh_token: json.refresh_token,
        });

        const userId = await getUserId();
        const unsafe = getInitDataUnsafe();
        const tgUser = unsafe.user as
          | {
              first_name?: string;
              last_name?: string;
              username?: string;
              photo_url?: string;
            }
          | undefined;
        if (userId && tgUser) {
          await supabase
            .from("users")
            .update({
              first_name: tgUser.first_name || null,
              last_name: tgUser.last_name || null,
              username: tgUser.username || null,
              photo_url: tgUser.photo_url || null,
            })
            .eq("id", userId);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  return { loading, error, preview };
};
