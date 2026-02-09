import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  city: string | null;
  photo_url?: string | null;
};

type Tag = { id: string; name: string };

type MembersPageProps = {
  onBack?: () => void;
};

const MembersPage = ({ onBack }: MembersPageProps) => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Tag[]>([]);
  const [interests, setInterests] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const { data, error } = await supabase
      .from("public_profiles")
      .select("id, first_name, last_name, username, bio, city, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      setError(error.message);
      return;
    }
    setMembers((data as Profile[]) || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const openProfile = async (profile: Profile) => {
    setSelected(profile);
    const [skillsRes, interestsRes] = await Promise.all([
      supabase
        .from("user_skills")
        .select("skills(id, name)")
        .eq("user_id", profile.id),
      supabase
        .from("user_interests")
        .select("interests(id, name)")
        .eq("user_id", profile.id),
    ]);

    setSkills(
      (skillsRes.data || [])
        .map((row: { skills: Tag[] }) => row.skills?.[0])
        .filter(Boolean) as Tag[],
    );
    setInterests(
      (interestsRes.data || [])
        .map((row: { interests: Tag[] }) => row.interests?.[0])
        .filter(Boolean) as Tag[],
    );
  };

  return (
    <section className="page">
      <div className="card hero">
        <div className="card-title">Участники</div>
        <div className="muted">
          Смотрите профили и находите людей по интересам.
        </div>
        {onBack && (
          <button className="back-button" onClick={onBack}>
            Назад
          </button>
        )}
      </div>

      <div className="members-layout">
        <div className="card">
          <div className="card-title">Все участники</div>
          {error && <div className="error">{error}</div>}
          <div className="list">
            {members.map((m) => (
              <button
                key={m.id}
                className="member-item"
                onClick={() => openProfile(m)}
              >
                <div className="member-avatar">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt="avatar" />
                  ) : (
                    <span>{m.first_name?.[0] || "U"}</span>
                  )}
                </div>
                <div className="member-info">
                  <strong>
                    {`${m.first_name || ""} ${m.last_name || ""}`.trim() ||
                      "Участник"}
                  </strong>
                  {m.username && <span className="muted">@{m.username}</span>}
                </div>
              </button>
            ))}
            {!members.length && (
              <div className="muted">Пока нет пользователей.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Профиль</div>
          {selected ? (
            <div className="profile-readonly">
              <div className="profile-header">
                <div className="member-avatar large">
                  {selected.photo_url ? (
                    <img src={selected.photo_url} alt="avatar" />
                  ) : (
                    <span>{selected.first_name?.[0] || "U"}</span>
                  )}
                </div>
                <div>
                  <strong>
                    {`${selected.first_name || ""} ${selected.last_name || ""}`.trim() ||
                      "Участник"}
                  </strong>
                  {selected.username && (
                    <div className="muted">@{selected.username}</div>
                  )}
                  {selected.city && (
                    <div className="muted">{selected.city}</div>
                  )}
                </div>
              </div>
              {selected.bio && <div className="member-bio">{selected.bio}</div>}

              <div className="tag-section">
                <div className="tag-title">Навыки</div>
                <div className="tag-list">
                  {skills.map((tag) => (
                    <span key={tag.id} className="tag active">
                      {tag.name}
                    </span>
                  ))}
                  {!skills.length && <div className="muted">Нет навыков.</div>}
                </div>
              </div>

              <div className="tag-section">
                <div className="tag-title">Интересы</div>
                <div className="tag-list">
                  {interests.map((tag) => (
                    <span key={tag.id} className="tag active">
                      {tag.name}
                    </span>
                  ))}
                  {!interests.length && (
                    <div className="muted">Нет интересов.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="muted">Выберите участника слева.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MembersPage;
