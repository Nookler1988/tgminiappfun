import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ContentItem = {
  id: string;
  title: string;
  created_at: string;
};

type ContentPageProps = {
  onBack?: () => void;
};

const ContentPage = ({ onBack }: ContentPageProps) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('content_items')
        .select('id, title, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      setItems(data || []);
    };
    void load();
  }, []);

  return (
    <section className="page">
      <div className="card hero">
        <div className="card-title">Блог</div>
        <div className="muted">Подборка материалов без лишнего.</div>
        {onBack && <button className="back-button" onClick={onBack}>Назад</button>}
      </div>
      <div className="card">
        {error && <div className="error">{error}</div>}
        <div className="list">
          {items.map((item) => (
            <div key={item.id} className="list-item">
              <strong>{item.title}</strong>
              <div className="muted">{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
          ))}
          {!items.length && <div className="muted">Материалов пока нет.</div>}
        </div>
      </div>
    </section>
  );
};

export default ContentPage;
