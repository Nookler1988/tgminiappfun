import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

type PairScore = { a: string; b: string; score: number };

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 && b.size === 0) return 0;
  let intersect = 0;
  for (const v of a) if (b.has(v)) intersect += 1;
  const union = a.size + b.size - intersect;
  return union === 0 ? 0 : intersect / union;
};

Deno.serve(async () => {
  const { data: prefs, error: prefsError } = await supabase
    .from('match_preferences')
    .select('user_id')
    .eq('opt_in', true);

  if (prefsError) {
    return new Response(JSON.stringify({ error: prefsError.message }), { status: 500 });
  }

  const userIds = (prefs || []).map((p) => p.user_id).filter(Boolean);
  if (userIds.length < 2) {
    return new Response(JSON.stringify({ message: 'Not enough users' }), { status: 200 });
  }

  const { data: skills } = await supabase
    .from('user_skills')
    .select('user_id, skill_id')
    .in('user_id', userIds);

  const { data: interests } = await supabase
    .from('user_interests')
    .select('user_id, interest_id')
    .in('user_id', userIds);

  const skillMap = new Map<string, Set<string>>();
  const interestMap = new Map<string, Set<string>>();

  for (const id of userIds) {
    skillMap.set(id, new Set());
    interestMap.set(id, new Set());
  }

  (skills || []).forEach((row) => {
    const set = skillMap.get(row.user_id) || new Set();
    set.add(row.skill_id);
    skillMap.set(row.user_id, set);
  });

  (interests || []).forEach((row) => {
    const set = interestMap.get(row.user_id) || new Set();
    set.add(row.interest_id);
    interestMap.set(row.user_id, set);
  });

  const { data: recentMatches } = await supabase
    .from('matches')
    .select('user_a, user_b, created_at')
    .gte('created_at', new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString());

  const recentSet = new Set<string>();
  (recentMatches || []).forEach((m) => {
    const key = [m.user_a, m.user_b].sort().join(':');
    recentSet.add(key);
  });

  const pairs: PairScore[] = [];
  for (let i = 0; i < userIds.length; i += 1) {
    for (let j = i + 1; j < userIds.length; j += 1) {
      const a = userIds[i];
      const b = userIds[j];
      const skillsA = skillMap.get(a) || new Set();
      const skillsB = skillMap.get(b) || new Set();
      const interestsA = interestMap.get(a) || new Set();
      const interestsB = interestMap.get(b) || new Set();
      const scoreSkills = jaccard(skillsA, skillsB);
      const scoreInterests = jaccard(interestsA, interestsB);
      const diffBonus = Math.abs(skillsA.size - skillsB.size) * 0.02;
      let score = scoreSkills * 0.6 + scoreInterests * 0.4 + diffBonus;
      const key = [a, b].sort().join(':');
      if (recentSet.has(key)) score -= 0.5;
      pairs.push({ a, b, score });
    }
  }

  pairs.sort((x, y) => y.score - x.score);

  const used = new Set<string>();
  const chosen: PairScore[] = [];
  for (const p of pairs) {
    if (used.has(p.a) || used.has(p.b)) continue;
    used.add(p.a);
    used.add(p.b);
    chosen.push(p);
  }

  if (!chosen.length) {
    return new Response(JSON.stringify({ message: 'No pairs formed' }), { status: 200 });
  }

  const inserts = chosen.map((p) => ({
    user_a: p.a,
    user_b: p.b,
    score: p.score,
    status: 'pending'
  }));

  const { error: insertError } = await supabase.from('matches').insert(inserts);
  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ matched: chosen.length }), { status: 200 });
});
