import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/auth';

const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined;

type Match = {
  id: string;
  status: string;
  score: number | null;
  partner_name: string | null;
  partner_username: string | null;
  partner_bio: string | null;
};

const MatchingPage = () => {
  const [optIn, setOptIn] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data: pref } = await supabase
      .from('match_preferences')
      .select('opt_in')
      .maybeSingle();
    setOptIn(!!pref?.opt_in);

    const { data, error } = await supabase
      .from('match_view')
      .select('id, status, score, partner_name, partner_username, partner_bio')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      setError(error.message);
      return;
    }
    setMatches(data || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleOptIn = async () => {
    setLoading(true);
    setError(null);
    const userId = await getUserId();
    const { error } = await supabase.from('match_preferences').upsert({ user_id: userId, opt_in: !optIn });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOptIn(!optIn);
  };

  const consent = async (matchId: string, value: boolean) => {
    if (!functionsUrl) {
      setError('Missing VITE_SUPABASE_FUNCTIONS_URL');
      return;
    }
    setLoading(true);
    setError(null);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const res = await fetch(`${functionsUrl}/match-consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ match_id: matchId, consent: value })
    });
    setLoading(false);
    if (!res.ok) {
      setError(`Ошибка согласия: ${res.status}`);
      return;
    }
    void load();
  };

  return (
    <section className="page">
      <div className="card">
        <div className="card-title">Подбор 1на1</div>
        <div className="row">
          <div>Участвовать в подборе</div>
          <button onClick={toggleOptIn} disabled={loading}>
            {optIn ? 'Отказаться' : 'Участвовать'}
          </button>
        </div>
        <div className="muted">Подбор по понедельникам в 10:00.</div>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Мои подборы</div>
        <div className="list">
          {matches.map((m) => (
            <div key={m.id} className="list-item">
              <div className="row">
                <strong>{m.partner_name || 'Участник'}</strong>
                <span className="pill">{m.status}</span>
              </div>
              {m.partner_username && <div className="muted">@{m.partner_username}</div>}
              {m.partner_bio && <div>{m.partner_bio}</div>}
              {m.status === 'pending' && (
                <div className="row">
                  <button onClick={() => consent(m.id, true)} disabled={loading}>
                    Согласен
                  </button>
                  <button onClick={() => consent(m.id, false)} disabled={loading}>
                    Отказаться
                  </button>
                </div>
              )}
            </div>
          ))}
          {!matches.length && <div className="muted">Пока нет подборов.</div>}
        </div>
      </div>
    </section>
  );
};

export default MatchingPage;
