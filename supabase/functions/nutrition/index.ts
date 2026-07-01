// supabase/functions/nutrition/index.ts
// Deno Edge Function — AI meal estimation (Gemini vision). Holds the Gemini key
// as a SECRET. The app calls supabase.functions.invoke('nutrition', { body }).
//
// Deploy:
//   supabase functions deploy nutrition
//   supabase secrets set GEMINI_API_KEY=your_key   # server-side only
//
// Returns: { name, calories, protein, carbs, fat }. Estimation only — the app
// labels these ai_estimated and shows a non-prescriptive disclaimer.

// @ts-nocheck — Deno runtime types are provided by the Supabase Edge runtime.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPT = `أنت خبير تغذية. قدّر محتوى الوجبة في الصورة/الوصف.
أعد JSON فقط بالشكل:
{"name":"اسم الوجبة بلغة المستخدم","calories":0,"protein":0,"carbs":0,"fat":0}
القيم أرقام تقريبية بالجرام (البروتين/الكارب/الدهون) والسعرات كيلو-كالوري. لا تكتب شيئاً خارج JSON.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { base64, mimeType, text } = await req.json();
    if (!GEMINI_API_KEY || (!base64 && !text)) return json(null);

    const parts: unknown[] = [{ text: PROMPT }];
    if (text) parts.push({ text: `الوصف: ${text}` });
    if (base64) parts.push({ inline_data: { mime_type: mimeType ?? 'image/jpeg', data: base64 } });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    });
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const p = JSON.parse(raw);
    if (typeof p.calories !== 'number') return json(null);
    return json({
      name: String(p.name ?? '').slice(0, 80),
      calories: Math.round(p.calories),
      protein: Math.round(p.protein ?? 0),
      carbs: Math.round(p.carbs ?? 0),
      fat: Math.round(p.fat ?? 0),
    });
  } catch (_e) {
    return json(null);
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
