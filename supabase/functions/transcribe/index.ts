// supabase/functions/transcribe/index.ts
// Deno Edge Function — voice → text via Gemini audio. Takes base64 audio and
// returns a transcript. Key is a SECRET (Deno.env), never shipped to the app.
// Deploy:
//   supabase functions deploy transcribe
//   supabase secrets set GEMINI_API_KEY=...
// @ts-nocheck — Deno runtime types provided by the Supabase Edge runtime.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { audioBase64, mimeType } = await req.json();
    if (!audioBase64 || !GEMINI_API_KEY) return json({ transcript: '' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'فرّغ هذا التسجيل الصوتي إلى نص حرفي بلهجة المتحدث. أعد النص فقط.' },
              { inlineData: { mimeType: mimeType ?? 'audio/m4a', data: audioBase64 } },
            ],
          },
        ],
      }),
    });
    const data = await res.json();
    const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return json({ transcript });
  } catch (_e) {
    return json({ transcript: '' });
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...cors, 'Content-Type': 'application/json' } });
}
