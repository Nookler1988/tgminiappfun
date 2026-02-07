import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  city: string | null;
};

const ProfilesPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, first_name, last_name, username, bio, city')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        setError(error.message);
        return;
      }
      setProfiles(data || []);
    };
    void load();
  }, []);

  return (
    <section className="page">
      <div className="card">
        <div className="card-title">Профили</div>
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
