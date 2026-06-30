// supabase/functions/ocr/index.ts
// Deno Edge Function — OCR via Gemini vision. Takes a base64 image and returns
// raw text + best-effort structured lines (e.g. schedule rows). Key is a SECRET
// (Deno.env), never shipped to the app. Deploy:
//   supabase functions deploy ocr
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
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || !GEMINI_API_KEY) return json({ text: '', lines: [] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  'استخرج جدول/نص هذه الصورة كأسطر منظمة. أعد JSON فقط: {"text":"النص الكامل","lines":["سطر","سطر"]}',
              },
              { inlineData: { mimeType: mimeType ?? 'image/jpeg', data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(raw);
    return json({ text: parsed.text ?? '', lines: Array.isArray(parsed.lines) ? parsed.lines : [] });
  } catch (_e) {
    return json({ text: '', lines: [] });
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...cors, 'Content-Type': 'application/json' } });
}
