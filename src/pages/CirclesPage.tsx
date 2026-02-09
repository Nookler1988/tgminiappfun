import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/auth';

type Circle = {
  id: string;
  name: string;
};

type User = {
  photo_url: string | null;
  first_name: string | null;
};

type Member = {
  circle_id: string;
  users: User | null;
};

const hashSeed = (input: string) =>
  input.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const gradientFromSeed = (seed: number) => {
  const hue = seed % 360;
  const hue2 = (hue + 35) % 360;
  // Уменьшаем насыщенность и яркость для более приглушенного вида
  return `radial-gradient(circle at 30% 30%, #f0f0f0, hsl(${hue} 50% 90%) 55%, hsl(${hue2} 40% 80%) 100%)`;
};

type CirclesPageProps = {
  onBack?: () => void;
};

const CirclesPage = ({ onBack }: CirclesPageProps) => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const userId = await getUserId();
    const [circlesRes, membersRes, myRes] = await Promise.all([
      supabase.from('circles').select('id, name').order('name'),
      supabase.from('circle_members').select('circle_id, users(photo_url, first_name)'),
      userId
        ? supabase.from('circle_members').select('circle_id').eq('user_id', userId)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (circlesRes.error) {
      setError(circlesRes.error.message);
      return;
    }

    setCircles(circlesRes.data || []);
    setMemberOf(new Set((myRes.data || []).map((m: { circle_id: string }) => m.circle_id)));

    const grouped: Record<string, Member[]> = {};
    (membersRes.data || []).forEach((m: any) => {
      if (!grouped[m.circle_id]) grouped[m.circle_id] = [];
      // Преобразуем типизацию для совместимости
      const member: Member = {
        circle_id: m.circle_id,
        users: Array.isArray(m.users) ? m.users[0] || null : m.users
      };
      grouped[m.circle_id].push(member);
    });
    setMembers(grouped);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (circleId: string, joined: boolean) => {
    const userId = await getUserId();
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { error } = joined
      ? await supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circleId)
          .eq('user_id', userId)
      : await supabase.from('circle_members').insert({ circle_id: circleId, user_id: userId });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    void load();
  };

  const positions = useMemo(() => {
    const placed: { left: number; top: number; size: number }[] = [];
    return circles.map((c, idx) => {
      const count = (members[c.id] || []).length;
      let size = clamp(88 + count * 6, 88, 150); // Уменьшили максимальный размер и коэффициент роста
      const seed = hashSeed(c.id + idx);
      
      // Ограничиваем максимальные значения, чтобы планеты не выходили за границы
      // Используем фиксированные значения, так как мы не можем получить window.innerWidth на этапе рендеринга
      const maxLeft = Math.max(80, 100 - (size / 4)); // приблизительное ограничение
      const maxTop = Math.max(75, 100 - (size / 4)); // приблизительное ограничение
      
      let left = 4 + (seed * 41) % maxLeft;
      let top = 6 + (seed * 23) % maxTop;

      for (let i = 0; i < 200; i += 1) {
        const candidateLeft = 3 + ((seed + i * 13) * 41) % maxLeft;
        const candidateTop = 4 + ((seed + i * 9) * 23) % maxTop;
        
        // Проверяем, не выходит ли элемент за границы
        if (candidateLeft + (size / 4) > 100 || 
            candidateTop + (size / 4) > 100) {
          continue; // пропускаем эту позицию
        }
        
        const ok = placed.every((p) => {
          const dx = candidateLeft - p.left;
          const dy = candidateTop - p.top;
          const minDist = (size + p.size) / 7.5;
          return Math.hypot(dx, dy) > minDist;
        });
        if (ok) {
          left = candidateLeft;
          top = candidateTop;
          break;
        }
        size = Math.max(80, size - 0.5);
      }

      placed.push({ left, top, size });
      const speed = 40 + (seed % 6) * 6; // Увеличили минимальную длительность анимации
      const drift = 8 + (seed % 5) * 2; // Увеличили минимальную амплитуду движения
      return { id: c.id, left, top, size, speed, drift, gradient: gradientFromSeed(seed) };
    });
  }, [circles, members]);

  return (
    <section className="page">
      <div className="card hero">
        <div className="card-title">Круги</div>
        <div className="muted">Планеты по интересам. Нажмите на планету, чтобы вступить.</div>
        {onBack && <button className="back-button" onClick={onBack}>Назад</button>}
      </div>

      <div className="circles-space">
        {circles.map((c, idx) => {
          const pos = positions[idx];
          const joined = memberOf.has(c.id);
          const list = (members[c.id] || []).slice(0, 8);
          return (
            <button
              key={c.id}
              className={joined ? 'planet joined' : 'planet'}
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                width: `${pos.size}px`,
                height: `${pos.size}px`,
                animationDuration: `${pos.drift}s`
              }}
              onClick={() => toggle(c.id, joined)}
              disabled={loading}
            >
              <div className="planet-core" style={{ background: pos.gradient }}>
                <div className="planet-name">{c.name}</div>
              </div>
              <div
                className="planet-orbit"
                style={{
                  animationDuration: `${pos.speed}s`,
                  ['--orbit-radius' as string]: `${pos.size / 2 - 12}px`
                }}
              >
                {list.map((m, i) => (
                  <div
                    key={`${c.id}-${i}`}
                    className="orbit-avatar"
                    style={{ transform: `rotate(${(360 / Math.max(list.length, 1)) * i}deg)` }}
                  >
                    <div className="orbit-avatar-inner">
                      {m.users?.photo_url ? (
                        <img src={m.users.photo_url} alt="avatar" />
                      ) : (
                        <span>{m.users?.first_name?.[0] || 'U'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default CirclesPage;
