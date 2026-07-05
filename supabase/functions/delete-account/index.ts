// supabase/functions/delete-account/index.ts
// Deno Edge Function — permanently deletes the calling user's account.
//
// Auth: the caller's JWT is verified (verify_jwt = true). We read the user id
// from that JWT — a user can only ever delete themselves. Deletion uses the
// SERVICE ROLE key (a server-side SECRET, never shipped to the app) to call
// the Admin API. Every domain table references auth.users(id) ON DELETE
// CASCADE, so removing the auth user wipes all of their rows in one step.
//
// Deploy:
//   supabase functions deploy delete-account
//   # SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically.

// @ts-nocheck — Deno runtime types are provided by the Supabase Edge runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ ok: false, error: 'missing token' }, 401);

    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!url || !serviceKey) return json({ ok: false, error: 'server not configured' }, 500);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Resolve the caller's identity from their own JWT — never trust a body id.
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ ok: false, error: 'invalid token' }, 401);

    const userId = userData.user.id;

    // Cascades across every table that references auth.users(id).
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) return json({ ok: false, error: delErr.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
