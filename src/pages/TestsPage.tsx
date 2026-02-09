import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Quiz = {
  id: string;
  title: string;
  description: string | null;
};

type TestsPageProps = {
  onBack?: () => void;
};

const TestsPage = ({ onBack }: TestsPageProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        return;
      }
      setQuizzes(data || []);
    };
    void load();
  }, []);

  return (
    <section className="page">
      <div className="card hero">
        <div className="card-title">Тесты</div>
        <div className="muted">Проверяйте знания и отслеживайте прогресс.</div>
        {onBack && <button className="back-button" onClick={onBack}>Назад</button>}
      </div>
      <div className="card">
        {error && <div className="error">{error}</div>}
        <div className="list">
          {quizzes.map((q) => (
            <div key={q.id} className="list-item">
              <strong>{q.title}</strong>
              {q.description && <div className="muted">{q.description}</div>}
            </div>
          ))}
          {!quizzes.length && <div className="muted">Тестов пока нет.</div>}
        </div>
      </div>
    </section>
  );
};

export default TestsPage;
