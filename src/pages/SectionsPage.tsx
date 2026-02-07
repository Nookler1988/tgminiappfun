import type { SectionId } from '../App';

const SectionsPage = ({ onNavigate }: { onNavigate: (id: SectionId) => void }) => {
  const items: { id: SectionId; label: string; desc: string }[] = [
    { id: 'feed', label: 'Лента', desc: 'Короткие посты и быстрые запросы.' },
    { id: 'profiles', label: 'Профили', desc: 'Навыки, интересы, описание.' },
    { id: 'circles', label: 'Круги', desc: 'Сообщества по интересам.' },
    { id: 'matching', label: 'Подбор', desc: 'Еженедельные мэтчи 1на1.' },
    { id: 'content', label: 'Обучение', desc: 'Видео, аудио, статьи.' },
    { id: 'tests', label: 'Тесты', desc: 'Проверка знаний и прогресс.' },
    { id: 'admin', label: 'Админ', desc: 'Контент, теги, круги.' }
  ];

  return (
    <section className="page">
      <div className="card hero">
        <div className="card-title">Главные разделы</div>
        <div className="muted">Выберите направление и начинайте нетворк.</div>
      </div>
      <div className="grid">
        {items.map((item) => (
          <button key={item.id} className="grid-card" onClick={() => onNavigate(item.id)}>
            <div className="grid-title">{item.label}</div>
            <div className="grid-desc">{item.desc}</div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SectionsPage;
