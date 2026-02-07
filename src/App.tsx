import { useMemo, useState } from 'react';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import FeedPage from './pages/FeedPage';
import SectionsPage from './pages/SectionsPage';
import ProfilesPage from './pages/ProfilesPage';
import CirclesPage from './pages/CirclesPage';
import MatchingPage from './pages/MatchingPage';
import ContentPage from './pages/ContentPage';
import TestsPage from './pages/TestsPage';
import AdminPage from './pages/AdminPage';

export type SectionId =
  | 'sections'
  | 'feed'
  | 'profiles'
  | 'circles'
  | 'matching'
  | 'content'
  | 'tests'
  | 'admin';

const App = () => {
  const { loading, error } = useTelegramAuth();
  const [section, setSection] = useState<SectionId>('sections');

  const pages = useMemo(
    () => ({
      sections: <SectionsPage onNavigate={setSection} />,
      feed: <FeedPage />,
      profiles: <ProfilesPage />,
      circles: <CirclesPage />,
      matching: <MatchingPage />,
      content: <ContentPage />,
      tests: <TestsPage />,
      admin: <AdminPage />
    }),
    []
  );

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <div className="app-title">Networking Mini App</div>
          <div className="app-subtitle">Канал • Нетворкинг • Круги</div>
        </div>
        <nav className="app-nav">
          {([
            ['sections', 'Разделы'],
            ['feed', 'Лента'],
            ['profiles', 'Профили'],
            ['circles', 'Круги'],
            ['matching', 'Подбор'],
            ['content', 'Обучение'],
            ['tests', 'Тесты'],
            ['admin', 'Админ']
          ] as const).map(([id, label]) => (
            <button
              key={id}
              className={section === id ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setSection(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {loading ? (
        <div className="card">Загрузка...</div>
      ) : error ? (
        <div className="card error">{error}</div>
      ) : (
        <main className="app-main">{pages[section]}</main>
      )}
    </div>
  );
};

export default App;
