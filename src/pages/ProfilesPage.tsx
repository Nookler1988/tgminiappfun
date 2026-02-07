import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/auth';

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  city: string | null;
  timezone: string | null;
  created_at?: string;
};

type Tag = {
  id: string;
  name: string;
};

const ProfilesPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Tag[]>([]);
  const [interests, setInterests] = useState<Tag[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullName = useMemo(() => {
    if (!me) return '';
    return `${me.first_name || ''} ${me.last_name || ''}`.trim();
  }, [me]);

  const load = async () => {
    setError(null);
    const userId = await getUserId();

    const [profilesRes, meRes, skillsRes, interestsRes, userSkillsRes, userInterestsRes] =
      await Promise.all([
        supabase
          .from('public_profiles')
          .select('id, first_name, last_name, username, bio, city, created_at')
          .order('created_at', { ascending: false })
          .limit(50),
        userId
          ? supabase
              .from('users')
              .select('id, first_name, last_name, username, bio, city, timezone')
              .eq('id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('skills').select('id, name').order('name'),
        supabase.from('interests').select('id, name').order('name'),
        userId
          ? supabase.from('user_skills').select('skill_id').eq('user_id', userId)
          : Promise.resolve({ data: [], error: null }),
        userId
          ? supabase.from('user_interests').select('interest_id').eq('user_id', userId)
          : Promise.resolve({ data: [], error: null })
      ]);

    if (profilesRes.error) {
      setError(profilesRes.error.message);
      return;
    }

    setProfiles(profilesRes.data || []);
    if (meRes && 'data' in meRes) {
      setMe((meRes.data as Profile | null) || null);
    }
    setSkills(skillsRes.data || []);
    setInterests(interestsRes.data || []);
    setSelectedSkills((userSkillsRes.data || []).map((row: { skill_id: string }) => row.skill_id));
    setSelectedInterests(
      (userInterestsRes.data || []).map((row: { interest_id: string }) => row.interest_id)
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const saveProfile = async () => {
    if (!me) return;
    const userId = await getUserId();
    if (!userId) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        bio: me.bio || null,
        city: me.city || null,
        timezone: me.timezone || null
      })
      .eq('id', userId);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    await supabase.from('user_skills').delete().eq('user_id', userId);
    await supabase.from('user_interests').delete().eq('user_id', userId);

    if (selectedSkills.length) {
      await supabase.from('user_skills').insert(
        selectedSkills.map((skill_id) => ({
          user_id: userId,
          skill_id
        }))
      );
    }

    if (selectedInterests.length) {
      await supabase.from('user_interests').insert(
        selectedInterests.map((interest_id) => ({
          user_id: userId,
          interest_id
        }))
      );
    }

    setSaving(false);
    void load();
  };

  return (
    <section className="page">
      <div className="card hero">
        <div>
          <div className="card-title">Ваш профиль</div>
          <div className="muted">Заполните карточку — так проще находить мэтч.</div>
        </div>
        <div className="profile-grid">
          <div className="profile-field">
            <label>Имя</label>
            <input value={me?.first_name || ''} disabled placeholder="Имя" />
          </div>
          <div className="profile-field">
            <label>Фамилия</label>
            <input value={me?.last_name || ''} disabled placeholder="Фамилия" />
          </div>
          <div className="profile-field full">
            <label>О себе</label>
            <textarea
              value={me?.bio || ''}
              onChange={(e) => setMe((prev) => ({ ...(prev || {}), bio: e.target.value }))}
              placeholder="Чем занимаетесь, чем полезны?"
              rows={3}
            />
          </div>
          <div className="profile-field">
            <label>Город</label>
            <input
              value={me?.city || ''}
              onChange={(e) => setMe((prev) => ({ ...(prev || {}), city: e.target.value }))}
              placeholder="Город"
            />
          </div>
          <div className="profile-field">
            <label>Часовой пояс</label>
            <input
              value={me?.timezone || ''}
              onChange={(e) => setMe((prev) => ({ ...(prev || {}), timezone: e.target.value }))}
              placeholder="UTC+3"
            />
          </div>
        </div>

        <div className="tag-section">
          <div className="tag-title">Навыки</div>
          <div className="tag-list">
            {skills.map((tag) => (
              <button
                key={tag.id}
                className={selectedSkills.includes(tag.id) ? 'tag active' : 'tag'}
                onClick={() => toggleSkill(tag.id)}
              >
                {tag.name}
              </button>
            ))}
            {!skills.length && <div className="muted">Админ еще не добавил теги.</div>}
          </div>
        </div>

        <div className="tag-section">
          <div className="tag-title">Интересы</div>
          <div className="tag-list">
            {interests.map((tag) => (
              <button
                key={tag.id}
                className={selectedInterests.includes(tag.id) ? 'tag active' : 'tag'}
                onClick={() => toggleInterest(tag.id)}
              >
                {tag.name}
              </button>
            ))}
            {!interests.length && <div className="muted">Админ еще не добавил интересы.</div>}
          </div>
        </div>

        <div className="row">
          <div className="muted">Публичное имя: {fullName || '—'}</div>
          <button onClick={saveProfile} disabled={saving}>
            Сохранить
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Участники</div>
        {error && <div className="error">{error}</div>}
        <div className="list">
          {profiles.map((p) => (
            <div key={p.id} className="list-item">
              <div className="row">
                <strong>
                  {p.first_name || ''} {p.last_name || ''}
                </strong>
                {p.username && <span className="pill">@{p.username}</span>}
              </div>
              {p.city && <div className="muted">{p.city}</div>}
              {p.bio && <div>{p.bio}</div>}
            </div>
          ))}
          {!profiles.length && <div className="muted">Профилей пока нет.</div>}
        </div>
      </div>
    </section>
  );
};

export default ProfilesPage;
