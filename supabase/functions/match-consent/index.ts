import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const botToken = Deno.env.get('TG_BOT_TOKEN')!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const sendTelegramMessage = async (chatId: number, text: string) => {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
};

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    const { match_id, consent } = await req.json();
    if (!match_id || typeof consent !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    const userId = authData.user.id;
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, user_a, user_b, status')
      .eq('id', match_id)
      .maybeSingle();

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404 });
    }

    if (![match.user_a, match.user_b].includes(userId)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    await supabase.from('match_consents').upsert({
      match_id,
      user_id: userId,
      consent,
      consented_at: new Date().toISOString()
    });

    if (!consent) {
      await supabase.from('matches').update({ status: 'declined' }).eq('id', match_id);
      return new Response(JSON.stringify({ status: 'declined' }), { status: 200 });
    }

    const { data: consents } = await supabase
      .from('match_consents')
      .select('user_id, consent')
      .eq('match_id', match_id);

    const allConsented = (consents || []).length >= 2 && (consents || []).every((c) => c.consent);
    if (!allConsented) {
      return new Response(JSON.stringify({ status: 'pending' }), { status: 200 });
    }

    await supabase.from('matches').update({ status: 'consented' }).eq('id', match_id);

    const { data: users } = await supabase
      .from('users')
      .select('id, tg_user_id, first_name, last_name, username, bio')
      .in('id', [match.user_a, match.user_b]);

    const userA = (users || []).find((u) => u.id === match.user_a);
    const userB = (users || []).find((u) => u.id === match.user_b);

    if (userA && userB) {
      const profileA = `${userA.first_name || ''} ${userA.last_name || ''}`.trim();
      const profileB = `${userB.first_name || ''} ${userB.last_name || ''}`.trim();
      const linkA = userA.username ? `https://t.me/${userA.username}` : 'Контакт без username';
      const linkB = userB.username ? `https://t.me/${userB.username}` : 'Контакт без username';

      await sendTelegramMessage(
        userA.tg_user_id,
        `Ваш контакт для нетворкинга: ${profileB}\n${userB.bio || ''}\n${linkB}`
      );
      await sendTelegramMessage(
        userB.tg_user_id,
        `Ваш контакт для нетворкинга: ${profileA}\n${userA.bio || ''}\n${linkA}`
      );
    }

    return new Response(JSON.stringify({ status: 'consented' }), { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
