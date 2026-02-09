import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/auth';

type AdminPageProps = {
  onBack?: () => void;
};

const AdminPage = ({ onBack }: AdminPageProps) => {
  const [circleName, setCircleName] = useState('');
  const [circleDesc, setCircleDesc] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentType, setContentType] = useState<'text' | 'video' | 'audio'>('text');
  const [contentBody, setContentBody] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [tagName, setTagName] = useState('');
  const [tagType, setTagType] = useState<'skill' | 'interest'>('skill');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      const userId = await getUserId();
      if (!userId) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    void check();
  }, []);

  const createCircle = async () => {
    setLoading(true);
    setError(null);
    const userId = await getUserId();
    const { error } = await supabase.from('circles').insert({
      name: circleName,
      description: circleDesc,
      created_by: userId
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCircleName('');
    setCircleDesc('');
  };

  const createContent = async () => {
    setLoading(true);
    setError(null);
    const userId = await getUserId();
    const { error } = await supabase.from('content_items').insert({
      title: contentTitle,
      type: contentType,
      body: contentBody || null,
      url: contentUrl || null,
      created_by: userId
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setContentTitle('');
    setContentBody('');
    setContentUrl('');
  };

  const createTag = async () => {
    setLoading(true);
    setError(null);
    const table = tagType === 'skill' ? 'skills' : 'interests';
    const { error } = await supabase.from(table).insert({ name: tagName });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTagName('');
  };

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="card hero">
          <div className="card-title">Админ‑раздел</div>
          <div className="muted">Доступ только для администратора.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="card hero">
        <div className="card-title">Админка</div>
        <div className="muted">Управляйте кругами, тегами и контентом.</div>
        {onBack && <button className="back-button" onClick={onBack}>Назад</button>}
        {error && <div className="error">{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Новый круг</div>
        <input
          value={circleName}
          onChange={(e) => setCircleName(e.target.value)}
          placeholder="Название"
        />
        <textarea
          value={circleDesc}
          onChange={(e) => setCircleDesc(e.target.value)}
          placeholder="Описание"
          rows={3}
        />
        <button onClick={createCircle} disabled={loading || !circleName.trim()}>
          Создать круг
        </button>
      </div>

      <div className="card">
        <div className="card-title">Тег навыка/интереса</div>
        <input value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="Название" />
        <div className="row">
          <select value={tagType} onChange={(e) => setTagType(e.target.value as 'skill' | 'interest')}>
            <option value="skill">Навык</option>
            <option value="interest">Интерес</option>
          </select>
          <button onClick={createTag} disabled={loading || !tagName.trim()}>
            Добавить
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Новый материал</div>
        <input
          value={contentTitle}
          onChange={(e) => setContentTitle(e.target.value)}
          placeholder="Заголовок"
        />
        <select value={contentType} onChange={(e) => setContentType(e.target.value as 'text' | 'video' | 'audio')}>
          <option value="text">Текст</option>
          <option value="video">Видео</option>
          <option value="audio">Аудио</option>
        </select>
        <textarea
          value={contentBody}
          onChange={(e) => setContentBody(e.target.value)}
          placeholder="Текст материала"
          rows={4}
        />
        <input
          value={contentUrl}
          onChange={(e) => setContentUrl(e.target.value)}
          placeholder="Ссылка (опционально)"
        />
        <button onClick={createContent} disabled={loading || !contentTitle.trim()}>
          Опубликовать
        </button>
      </div>
    </section>
  );
};

export default AdminPage;
