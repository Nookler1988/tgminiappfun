import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Quiz = {
  id: string;
  title: string;
  description: string | null;
};

const TestsPage = () => {
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
      <div className="card">
        <div className="card-title">Тесты</div>
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
