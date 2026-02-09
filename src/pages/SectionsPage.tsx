import type { SectionId } from '../App';

const SectionsPage = ({ onNavigate }: { onNavigate: (id: SectionId) => void }) => {
  const items: { id: SectionId; label: string; desc: string }[] = [
    { id: 'feed', label: 'Лента', desc: 'Короткие посты и быстрые запросы.' },
    { id: 'members', label: 'Участники', desc: 'Публичные профили без редактирования.' },
    { id: 'circles', label: 'Круги', desc: 'Сообщества по интересам.' },
    { id: 'matching', label: 'Random‑cafe', desc: 'Еженедельные мэтчи 1на1.' },
    { id: 'content', label: 'Обучение', desc: 'Видео, аудио, статьи и тесты.' }
  ];

  return (
    <section className="page sections-hero">
      <div className="sections-header">
        <div className="card-title">Главные разделы</div>
        <div className="muted">Выберите направление и начинайте нетворк.</div>
      </div>
      <div className="sections-grid">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`sections-card accent-${(index % 5) + 1}`}
            onClick={() => onNavigate(item.id)}
          >
            <div className="sections-label">{item.label}</div>
            <div className="sections-desc sections-desc-top">{item.desc}</div>
            <div className="sections-index">0{index + 1}</div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SectionsPage;
