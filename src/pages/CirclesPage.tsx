import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/auth';

type Circle = {
  id: string;
  name: string;
  description: string | null;
};

const CirclesPage = () => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const userId = await getUserId();
    const [circlesRes, membersRes] = await Promise.all([
      supabase.from('circles').select('id, name, description').order('name'),
      userId
        ? supabase.from('circle_members').select('circle_id').eq('user_id', userId)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (circlesRes.error) {
      setError(circlesRes.error.message);
      return;
    }

    setCircles(circlesRes.data || []);
    setMemberOf(new Set((membersRes.data || []).map((m: { circle_id: string }) => m.circle_id)));
  };

  useEffect(() => {
    void load();
  }, []);

  const join = async (circleId: string) => {
    const userId = await getUserId();
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('circle_members').insert({ circle_id: circleId, user_id: userId });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    void load();
  };

  const leave = async (circleId: string) => {
    const userId = await getUserId();
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', userId);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    void load();
  };

  return (
    <section className="page">
      <div className="card hero">
        <div className="card-title">Круги по интересам</div>
        <div className="muted">Выбирайте сообщества, чтобы участвовать в совместных активностях.</div>
      </div>
      <div className="card">
        <div className="card-title">Список кругов</div>
        {error && <div className="error">{error}</div>}
        <div className="list">
          {circles.map((c) => {
            const isMember = memberOf.has(c.id);
            return (
              <div key={c.id} className="list-item">
                <div className="row">
                  <strong>{c.name}</strong>
                  {isMember ? (
                    <button disabled={loading} onClick={() => leave(c.id)} className="ghost">
                      Выйти
                    </button>
                  ) : (
                    <button disabled={loading} onClick={() => join(c.id)}>
                      Вступить
                    </button>
                  )}
                </div>
                {c.description && <div className="muted">{c.description}</div>}
              </div>
            );
          })}
          {!circles.length && <div className="muted">Кругов пока нет.</div>}
        </div>
      </div>
    </section>
  );
};

export default CirclesPage;
