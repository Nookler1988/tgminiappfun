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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('circles')
      .select('id, name, description')
      .order('name');
    if (error) {
      setError(error.message);
      return;
    }
    setCircles(data || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const join = async (circleId: string) => {
    setLoading(true);
    setError(null);
    const userId = await getUserId();
    const { error } = await supabase.from('circle_members').insert({ circle_id: circleId, user_id: userId });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    void load();
  };

  return (
    <section className="page">
      <div className="card">
        <div className="card-title">Круги</div>
        {error && <div className="error">{error}</div>}
        <div className="list">
          {circles.map((c) => (
            <div key={c.id} className="list-item">
              <div className="row">
                <strong>{c.name}</strong>
                <button disabled={loading} onClick={() => join(c.id)}>
                  Вступить
                </button>
              </div>
              {c.description && <div className="muted">{c.description}</div>}
            </div>
          ))}
          {!circles.length && <div className="muted">Кругов пока нет.</div>}
        </div>
      </div>
    </section>
  );
};

export default CirclesPage;
