import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const TEST_EMAIL = import.meta.env.VITE_TEST_USER_EMAIL as string | undefined;
const TEST_PASSWORD = import.meta.env.VITE_TEST_USER_PASSWORD as
  | string
  | undefined;

export const useTestAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!TEST_EMAIL || !TEST_PASSWORD) {
        setLoading(false);
        return;
      }

      try {
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session) {
          setLoading(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        if (signInError) {
          // Если вход не удался, пробуем зарегистрировать
          const { error: signUpError } = await supabase.auth.signUp({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
          });

          if (signUpError) {
            setError(signUpError.message);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Auth failed");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  return { loading, error };
};
