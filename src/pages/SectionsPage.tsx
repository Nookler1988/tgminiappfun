import type { SectionId } from '../App';

const SectionsPage = ({ onNavigate }: { onNavigate: (id: SectionId) => void }) => {
  const items: { id: SectionId; label: string; desc: string }[] = [
    { id: 'feed', label: 'Лента', desc: 'Короткие посты до 120 символов.' },
    { id: 'profiles', label: 'Профили', desc: 'Навыки, интересы, описание.' },
    { id: 'circles', label: 'Круги', desc: 'Группы по интересам.' },
    { id: 'matching', label: 'Подбор', desc: 'Еженедельный матчинг.' },
    { id: 'content', label: 'Обучение', desc: 'Видео, аудио, статьи.' },
    { id: 'tests', label: 'Тесты', desc: 'Проверка знаний.' },
    { id: 'admin', label: 'Админ', desc: 'Контент и категории.' }
  ];

  return (
    <section className="page">
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
