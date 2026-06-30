// supabase/functions/ai-parse/index.ts
// Deno Edge Function — the server side of the AI Service Layer.
// Holds the Gemini API key as a SECRET (never shipped to the app). The app
// calls this via supabase.functions.invoke('ai-parse', { body: { text } }).
//
// Deploy:
//   supabase functions deploy ai-parse
//   supabase secrets set GEMINI_API_KEY=your_key   # set ONCE, server-side only
//
// Returns ParsedDay: { reply, items: DetectedItem[] }.

// @ts-nocheck — Deno runtime types are provided by the Supabase Edge runtime.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `أنت مساعد ينظّم يوم المستخدم. حلّل النص واستخرج عناصر مكتوبة الأنواع.
أعد JSON فقط بالشكل:
{"reply":"رد دافئ بجملة واحدة","items":[{"type":"journal|appointment|task|checklist|exam|habit|reminder|note|suggestion|meal|workout|study_session","title":"عنوان قصير بلهجة المستخدم","detail":"وقت/تفصيل اختياري","confidence":0.0}]}
احفظ النص الكامل دائماً كعنصر journal. لا تكتب أي شيء خارج JSON.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || !GEMINI_API_KEY) {
      return json({ reply: '', items: [] });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM}\n\nالنص:\n${text}` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
      }),
    });

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(raw);

    // normalize → DetectedItem shape with ids + pending status
    let i = 0;
    const items = (parsed.items ?? []).map((it: any) => ({
      id: `g_${Date.now()}_${i++}`,
      type: it.type ?? 'note',
      title: String(it.title ?? '').slice(0, 80),
      detail: it.detail,
      source: text,
      confidence: typeof it.confidence === 'number' ? it.confidence : 0.6,
      status: 'pending',
    }));

    return json({ reply: parsed.reply ?? 'فهمت يومك ✨', items });
  } catch (_e) {
    return json({ reply: '', items: [] });
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
