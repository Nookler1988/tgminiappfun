import { useMemo, useState } from "react";
import { useTelegramAuth } from "./hooks/useTelegramAuth";
import { useProfile } from "./hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FeedPage from "./pages/FeedPage";
import SectionsPage from "./pages/SectionsPage";
import ProfilesPage from "./pages/ProfilesPage";
import MembersPage from "./pages/MembersPage";
import CirclesPage from "./pages/CirclesPage";
import MatchingPage from "./pages/MatchingPage";
import ContentPage from "./pages/ContentPage";
import TestsPage from "./pages/TestsPage";
import AdminPage from "./pages/AdminPage";

export type SectionId =
  | "sections"
  | "feed"
  | "profiles"
  | "members"
  | "circles"
  | "matching"
  | "content"
  | "tests"
  | "admin";

const App = () => {
  const { loading } = useTelegramAuth();
  const { profile } = useProfile();
  const [section, setSection] = useState<SectionId>("sections");

  const pages = useMemo(
    () => ({
      sections: <SectionsPage onNavigate={setSection} />,
      feed: <FeedPage onBack={() => setSection("sections")} />,
      profiles: <ProfilesPage onBack={() => setSection("sections")} />,
      members: <MembersPage onBack={() => setSection("sections")} />,
      circles: <CirclesPage onBack={() => setSection("sections")} />,
      matching: <MatchingPage onBack={() => setSection("sections")} />,
      content: <ContentPage onBack={() => setSection("sections")} />,
      tests: <TestsPage onBack={() => setSection("sections")} />,
      admin: <AdminPage onBack={() => setSection("sections")} />,
    }),
    [],
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <div>
            <div className="app-title">Нескучный Нетворкинг</div>
            <div className="app-subtitle">Канал • Нетворкинг • Круги</div>
          </div>
          <button
            className="profile-chip"
            onClick={() => setSection("profiles")}
          >
            <Avatar size="lg">
              <AvatarImage
                src={profile?.photo_url || undefined}
                alt={profile?.first_name || "User"}
              />
              <AvatarFallback>{profile?.first_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="card">Загрузка...</div>
      ) : (
        <main className="app-main">{pages[section]}</main>
      )}

      <nav className="bottom-nav">
        {(
          [
            ["sections", "Домой", "M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"],
            ["feed", "Лента", "M4 5h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"],
            ["circles", "Круги", "M12 4a8 8 0 1 0 0.001 0z"],
            ["matching", "Random‑cafe", "M7 7h6v6H7zm6 6h6v6h-6z"],
            [
              "content",
              "Обучение",
              "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm4 4v8l6-4z",
            ],
          ] as const
        ).map(([id, label, path]) => (
          <button
            key={id}
            className={section === id ? "bottom-btn active" : "bottom-btn"}
            onClick={() => setSection(id)}
          >
            <svg className="bottom-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d={path} />
            </svg>
            <span className="bottom-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
