# Supabase setup — Life OS

The app (React Native + Expo) talks to Supabase through `services/` only.
The Next.js snippet (`@supabase/ssr`, cookies, middleware) does **not** apply
here — Expo uses `@supabase/supabase-js` + AsyncStorage (already wired in
`services/supabase.ts`).

## 1) Client env (public — safe in the app)
`.env` (git-ignored) already contains:
```
EXPO_PUBLIC_SUPABASE_URL=https://jlwmpyhiitgdklrbmxrh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
```
The anon/publishable key is public by design (protected by Row-Level Security).

## 2) Apply the database schema (migration-based)
```
supabase login
supabase link --project-ref jlwmpyhiitgdklrbmxrh
supabase db push            # applies supabase/migrations/* in order:
                            #   0001_init        — base (areas→projects, habits,
                            #                      tasks, journal, workspaces,
                            #                      captures, files, memory, RLS, buckets)
                            #   0002_phase2_*    — study, learning, health/nutrition/
                            #                      exercise, events (calendar), analytics,
                            #                      wellbeing, app_usage (+RLS, indexes)
```
(`supabase/schema.sql` is kept as a readable single-file reference; the
canonical source for `db push` is `supabase/migrations/`.)

## 3) AI (Gemini) — server-side only, NEVER in the app
The Gemini key is a **secret**. It lives only as an Edge Function secret:
```
supabase functions deploy ai-parse
supabase functions deploy ocr          # image/PDF → text (Smart Schedule Builder)
supabase functions deploy transcribe   # voice → text
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_KEY
# optional: supabase secrets set GEMINI_MODEL=gemini-2.0-flash
```
The app calls `supabase.functions.invoke('ai-parse', { body: { text } })`
(see `services/aiService.ts`). If the function isn't deployed, the app falls
back to the local rule-based parser automatically — nothing breaks.

> ⚠️ Rotate the Gemini key if it was ever shared in plaintext. It must never be
> committed or placed in any `EXPO_PUBLIC_*` variable (those ship in the bundle).

## 4) Storage
`schema.sql` creates `attachments` and `voice` buckets for the capture pipeline
(images/PDFs/voice). Wire `captureService.ts` to upload + the `transcribe`/`ocr`
functions when ready.
