// supabase/functions/insights/index.ts
// Deno Edge Function — server enrichment for the Life Intelligence Engine.
// Receives ONLY compact aggregates (counts/kinds/day — never raw private text)
// and asks Gemini for up to 3 extra cross-domain insights. Gemini key stays a
// server secret.
//
// Deploy: supabase functions deploy insights
// Returns: [{kind, title, body, confidence}] or [].

// @ts-nocheck — Deno runtime types are provided by the Supabase Edge runtime.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `أنت محرك رؤى لنظام تشغيل حياة شخصي. تصلك مؤشرات مجمّعة (بلا نصوص خاصة).
أعد JSON فقط: مصفوفة بحد أقصى 3 عناصر بالشكل:
[{"kind":"correlation|warning|opportunity|trend","title":"جملة قصيرة هادئة بالعربية","body":"سطر توضيحي اختياري","confidence":0.0}]
كن هادئًا وعمليًا؛ لا وعظ ولا مبالغة. إن لم يوجد ما يستحق، أعد [].`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const aggregates = await req.json();
    if (!GEMINI_API_KEY) return json([]);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM}\n\nالمؤشرات:\n${JSON.stringify(aggregates).slice(0, 2000)}` }] },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.5 },
      }),
    });
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    const parsed = JSON.parse(raw);
    return json(Array.isArray(parsed) ? parsed.slice(0, 3) : []);
  } catch (_e) {
    return json([]);
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
