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

Deno.serve(async () => {
  const now = new Date().toISOString();
  const { data: events, error } = await supabase
    .from('events')
    .select('id, match_id, starts_at, remind_at, status')
    .lte('remind_at', now)
    .eq('status', 'scheduled');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  for (const event of events || []) {
    const { data: match } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .eq('id', event.match_id)
      .maybeSingle();

    if (!match) continue;

    const { data: users } = await supabase
      .from('users')
      .select('tg_user_id')
      .in('id', [match.user_a, match.user_b]);

    for (const user of users || []) {
      await sendTelegramMessage(user.tg_user_id, 'Напоминание о вашем 1на1 созвоне.');
    }

    await supabase.from('events').update({ status: 'sent' }).eq('id', event.id);
  }

  return new Response(JSON.stringify({ sent: (events || []).length }), { status: 200 });
});
