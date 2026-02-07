import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const botToken = Deno.env.get('TG_BOT_TOKEN')!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const parseInitData = (initData: string) => {
  const params = new URLSearchParams(initData);
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });
  return data;
};

const buildCheckString = (data: Record<string, string>) => {
  return Object.keys(data)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n');
};

const sha256 = async (input: string) => {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const hmacSha256 = async (key: ArrayBuffer, data: string) => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const verifyInitData = async (initData: string) => {
  const data = parseInitData(initData);
  const checkString = buildCheckString(data);
  const secretKey = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(botToken));
  const hash = await hmacSha256(secretKey, checkString);
  return hash === data.hash;
};

Deno.serve(async (req) => {
  try {
    const { initData } = await req.json();
    if (!initData) {
      return new Response(JSON.stringify({ error: 'Missing initData' }), { status: 400 });
    }
    const valid = await verifyInitData(initData);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid initData' }), { status: 401 });
    }
    const data = parseInitData(initData);
    const userRaw = data.user ? JSON.parse(data.user) : null;
    if (!userRaw?.id) {
      return new Response(JSON.stringify({ error: 'Missing Telegram user' }), { status: 400 });
    }

    const tgUserId = Number(userRaw.id);
    const email = `tg_${tgUserId}@telegram.local`;

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('tg_user_id', tgUserId)
      .maybeSingle();

    if (existingError) {
      return new Response(JSON.stringify({ error: existingError.message }), { status: 500 });
    }

    let authUserId = existing?.id as string | undefined;

    if (!authUserId) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true
      });
      if (createError || !created.user) {
        return new Response(JSON.stringify({ error: createError?.message || 'Create user failed' }), { status: 500 });
      }
      authUserId = created.user.id;

      const { error: upsertError } = await supabase.from('users').insert({
        id: authUserId,
        tg_user_id: tgUserId,
        first_name: userRaw.first_name || null,
        last_name: userRaw.last_name || null,
        username: userRaw.username || null,
        photo_url: userRaw.photo_url || null
      });
      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
      }
    }

    if (authUserId) {
      const { error: upsertError } = await supabase.from('users').upsert(
        {
          id: authUserId,
          tg_user_id: tgUserId,
          first_name: userRaw.first_name || null,
          last_name: userRaw.last_name || null,
          username: userRaw.username || null,
          photo_url: userRaw.photo_url || null
        },
        { onConflict: 'id' }
      );
      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
      }
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email
    });
    if (linkError || !linkData) {
      return new Response(JSON.stringify({ error: linkError?.message || 'Generate link failed' }), { status: 500 });
    }

    const actionLink = linkData.action_link || '';
    const url = new URL(actionLink);
    const hashParams = new URLSearchParams(url.hash.replace('#', ''));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');

    if (!access_token || !refresh_token) {
      return new Response(JSON.stringify({
        error: 'Tokens not found in magic link. Configure auth flow.'
      }), { status: 500 });
    }

    return new Response(
      JSON.stringify({
        access_token,
        refresh_token,
        user: { id: authUserId }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
