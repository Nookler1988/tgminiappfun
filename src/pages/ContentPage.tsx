import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ContentItem = {
  id: string;
  title: string;
  type: 'text' | 'video' | 'audio';
  body: string | null;
  url: string | null;
  created_at: string;
};

const ContentPage = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('content_items')
        .select('id, title, type, body, url, created_at')
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
      <div className="card">
        <div className="card-title">Обучающие материалы</div>
        {error && <div className="error">{error}</div>}
        <div className="list">
          {items.map((item) => (
            <div key={item.id} className="list-item">
              <div className="row">
                <strong>{item.title}</strong>
                <span className="pill">{item.type}</span>
              </div>
              {item.body && <div>{item.body}</div>}
              {item.url && (
                <a className="link" href={item.url} target="_blank" rel="noreferrer">
                  Открыть
                </a>
              )}
            </div>
          ))}
          {!items.length && <div className="muted">Материалов пока нет.</div>}
        </div>
      </div>
    </section>
  );
};

export default ContentPage;
