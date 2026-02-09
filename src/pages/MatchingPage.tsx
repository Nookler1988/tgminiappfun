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

type MatchingPageProps = {
  onBack?: () => void;
};

const MatchingPage = ({ onBack }: MatchingPageProps) => {
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
      <div className="card hero">
        <div className="card-title">Random‑cafe</div>
        <div className="muted">Еженедельные мэтчи 1на1. Подключитесь к поиску.</div>
        {onBack && <button className="back-button" onClick={onBack}>Назад</button>}
      </div>

      <div className="card">
        <div className="row">
          <div>
            <div className="card-title">Участвовать в Random‑cafe</div>
            <div className="muted">Вы будете получать предложения для встреч каждую неделю</div>
          </div>
          <button className={optIn ? 'ios-switch on' : 'ios-switch'} onClick={toggleOptIn} disabled={loading}>
            <span className="ios-knob" />
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Мои подборы</div>
        <div className="matching-list">
          {matches.map((m) => (
            <div key={m.id} className="matching-card">
              <div className="matching-header">
                <div className="partner-avatar">
                  {m.partner_name ? (
                    <span>{m.partner_name.charAt(0)}</span>
                  ) : (
                    <span>U</span>
                  )}
                </div>
                <div className="matching-info">
                  <div className="partner-name">{m.partner_name || 'Участник'}</div>
                  {m.partner_username && <div className="partner-username">@{m.partner_username}</div>}
                </div>
                <span className={`match-status ${m.status}`}>{m.status}</span>
              </div>
              {m.partner_bio && <div className="partner-bio">{m.partner_bio}</div>}
              {m.status === 'pending' && (
                <div className="matching-actions">
                  <button onClick={() => consent(m.id, true)} disabled={loading} className="accept-btn">
                    Согласен
                  </button>
                  <button onClick={() => consent(m.id, false)} disabled={loading} className="decline-btn">
                    Отказаться
                  </button>
                </div>
              )}
            </div>
          ))}
          {!matches.length && (
            <div className="no-matches">
              <div className="empty-state-icon">☕</div>
              <div className="muted">Пока нет предстоящих встреч</div>
              <div className="small-muted">Как только вы подтвердите участие, мы подберём вам партнёра</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MatchingPage;
