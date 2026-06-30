# Life OS — Service Layer

The whole app talks to the backend through **this folder only**. Every AI
surface (Home capture, Review Inbox, AI Studio, Smart Schedule Builder) goes
through one extensible service. These are **real seams**, not throwaway stubs:
today they ship real (if limited) local implementations; tomorrow the same
interfaces are backed by Supabase + Edge Functions — no UI rewrite needed.

| Module | Responsibility | Today | Grows into |
|---|---|---|---|
| `aiService.ts` | capture · routing/classification · extraction · suggestions · workspace generation | real rule-based local parse | server AI (LLM) behind same API |
| `captureService.ts` | voice upload→transcribe, image/PDF→OCR | real interface, no-op fallback | Supabase Storage + Whisper/OCR functions |
| `scheduleService.ts` | Smart Schedule Builder (photo/PDF → schedule + checklist + sessions + reminders + conflicts) | OCR seam + structuring | live OCR + AI structuring |
| `memory.ts` | Memory Foundation: linked entity graph (nodes + edges) | in-memory graph + search | `memory_nodes` / `memory_edges` tables |
| `supabase.ts` | Auth · DB · Storage client | env-driven lazy client | live Supabase project |
| `types.ts` | shared types for every AI surface | — | — |

## Going live
1. `npm i @supabase/supabase-js`
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Apply `supabase/schema.sql` (Areas→Projects, habits, tasks, journal,
   workspaces, captures, files, memory graph, RLS, storage buckets).
4. Add Edge Functions `transcribe`, `ocr`, `ai-parse`, `ai-workspace` and flip
   the `isSupabaseConfigured()` branches in the services to call them.

The frontend never changes — it already calls these interfaces.

## Review Layer contract
`parseDay()` returns `DetectedItem[]`. Nothing is written to the system until
the user approves through the **Review Layer** (`components/ai/ReviewLayer.tsx`):
per item **Accept / Edit / Merge / Ignore / Delete**, plus **Apply all**. The
same component powers the Home result card, the AI Review Inbox, and AI Studio.
