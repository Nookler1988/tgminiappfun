import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/auth';

type Post = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
};

const MAX_LEN = 120;

const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async () => {
    const { data, error: loadError } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setPosts(data || []);
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const submit = async () => {
    if (!content.trim()) return;
    if (content.length > MAX_LEN) {
      setError(`Максимум ${MAX_LEN} символов.`);
      return;
    }
    setLoading(true);
    setError(null);
    const userId = await getUserId();
    const { error: insertError } = await supabase.from('posts').insert({ content, user_id: userId });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setContent('');
    void loadPosts();
  };

  return (
    <section className="page">
      <div className="card">
        <div className="card-title">Новый пост</div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_LEN}
          placeholder="Коротко о себе или запросе"
          rows={3}
        />
        <div className="row">
          <span className="muted">{content.length}/{MAX_LEN}</span>
          <button onClick={submit} disabled={loading}>
            Опубликовать
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Лента</div>
        <div className="list">
          {posts.map((post) => (
            <div key={post.id} className="list-item">
              <div className="post-content">{post.content}</div>
              <div className="muted">{new Date(post.created_at).toLocaleString()}</div>
            </div>
          ))}
          {!posts.length && <div className="muted">Пока нет постов.</div>}
        </div>
      </div>
    </section>
  );
};

export default FeedPage;
