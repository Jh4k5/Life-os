# LIFE OS AI — Full Diagnostic Audit

**Scope:** read-only diagnosis. No code was changed to produce this document.
**Repo state audited:** `HEAD = d96dfef` on branch `claude/read-files-build-app-rw8fqi`.
**Method:** every claim below cites an exact file:line verified in this repo state.

> Important framing: this branch has had several fix sessions land recently
> (settings, AI commands, customization, connected strip). Where a founder
> complaint has since been partially or fully addressed at HEAD, this audit says
> so explicitly rather than repeating a stale finding.

---

## 1. Auth & session persistence

**Root cause.** The app has two modes — *live* (Supabase configured) and
*demo* (not configured) — and the release APK is built in **demo mode**, because
the only file that carries the Supabase URL/key (`.env`) is git-ignored and the
APK workflow injects no such env. In demo mode auth is faked; in live mode there
is **no proactive session-restore listener**, and cold start validates the
session with a *network* call (`getUser()`) rather than the local
`getSession()`, so a signed-up-but-unconfirmed account (Supabase's default) reads
back as "no user" on every relaunch.

**Evidence.**
- Demo mode faked success: `services/auth.ts:16` (`signIn` → `return { ok: true }`) and `services/auth.ts:23` (`signUp` → `return { ok: true }`) when `getClient()` is null.
- Entry routing branches on config, not real session: `app/index.tsx:16-19` (demo → straight to `/(tabs)/home`) vs `app/index.tsx:21-23` (live → `auth.currentUser()`).
- Cold-start uses a network `getUser()`, not local `getSession()`: `services/auth.ts:60-65`.
- **No** `getSession` / `onAuthStateChange` / `refreshSession` anywhere in `app/`, `services/`, `components/` (repo-wide grep returns zero matches).
- Client *does* persist sessions to AsyncStorage: `services/supabase.ts:22-35` (`persistSession: true`, `storage: AsyncStorage`) — so persistence is possible in live mode; nothing restores it eagerly.
- `.env` is git-ignored (`.gitignore:13`) and untracked (`git ls-files --error-unmatch .env` → not found). The build workflow `.github/workflows/build-apk.yml` injects no `EXPO_PUBLIC_SUPABASE_*` (grep: none), so **every CI APK is demo mode** → `isSupabaseConfigured()` (`services/supabase.ts:17-18`) is false on device.

**Why prior fixes didn't resolve it.** Past sessions added a real Supabase
client and a delete-account Edge Function, but never (a) guaranteed the anon key
is present in the shipped bundle, nor (b) added a `getSession()`-based restore +
`onAuthStateChange` gate. The demo fallback (`auth.ts:16,23`) masks the failure
as "success," so it never surfaces as an error to fix.

**Severity: blocks-everything** (for any multi-device / real-account claim).

---

## 2. AI parsing pipeline (voice/text → detected items)

**Root cause.** The "smart" path is the remote Gemini Edge Function; it is
double-gated and **off in the shipped app**, so the device almost always runs the
**local keyword rule parser**, which only classifies lines that contain explicit
cue words and silently drops everything else into a single journal entry.

**Evidence.**
- Remote is tried first but returns null without a client: `services/aiService.ts` `remoteParse()` (`getClient()` guard) → `parseDay()` calls it before the local path. `getClient()` is null unless `EXPO_PUBLIC_SUPABASE_*` are set (`services/supabase.ts:22-24`) — which they are not in the CI APK (see §1).
- Server side is gated again: `supabase/functions/ai-parse/index.ts:33` early-returns empty unless `GEMINI_API_KEY` is set as a project secret.
- Local classifier is pure keyword matching: `services/aiService.ts:51-76` (`detectType`) — e.g. a line only becomes a `task` if it contains لازم/يجب/محتاج/task/todo (`aiService.ts:71`), a `habit` only with عادة/daily (`aiService.ts:65`). A plain sentence with no cue word falls through to `note` (`aiService.ts:75`).
- `note`/`journal` lines are then **discarded** from the actionable list (only the whole dump is kept as one journal): the per-line loop skips `type==='note'||'journal'`. So "اتصل بأمي الساعة ٥" with no verb cue produces **no task** — just a journal blob.
- **Write/read parity is actually OK now** (a previously-reported bug): `insertDetected` routes each type to a local collection via `mapFor` (`services/repository.ts` `mapFor`, habit at `:148`), and the reading screens use the same collections (`listTasks` → `tasks`, `listJournal` → `journal_entries`, `listHabits` → `services/repository.ts:502`). App screens import only *types* from `data/mock` (grep: `tasks/*`, `study/*` import `type TaskData`/`Flashcard`), not seed data — so the old mock-vs-repository split is resolved.
- Recent improvement at HEAD: command grammar (op create/update/delete) was added to the local parser (`services/aiService.ts` `detectCommand` / `detectStudyBuild`), so imperative Arabic/English commands now route to update/delete — but this rides on the same brittle keyword base.

**Why prior fixes didn't resolve it.** Effort went into the local rule parser and
the Review UI, but the *quality* ceiling is the remote model, which never ships
enabled. No fix guarantees the Gemini path is live on device, so testers keep
hitting the weak local branch.

**Severity: blocks-everything** (this is the product's core promise).

---

## 3. Habit reminders / timers

**Root cause.** A habit created with a time schedules **nothing**. The habit
creator collects reminder times in local state and then throws them away — they
are never passed to `addHabit`, `addHabit` never calls the notification service,
and the data model has no reminder column.

**Evidence.**
- Reminders are collected but dropped: `app/(tabs)/more/habits/new.tsx:43` (`const [reminders,setReminders]=useState(['08:00'])`) and `:41` (`customDays`), but the save call `app/(tabs)/more/habits/new.tsx:52` passes only `{name,emoji,color,type,target,unit,freq,timePref,areaId}` — no reminders/days.
- `addHabit` has no reminder parameter and never touches notifications: `services/repository.ts:537-548`.
- The only proactive scheduler fires for `reminder`/`appointment` types only, never habits: `services/repository.ts:121-127` (`scheduleReminders`), and it is only called from the capture-apply paths (`repository.ts:333`, `:359`).
- No reminder column exists server-side either: `supabase/schema.sql:51-63` (`habits` has `time_pref` but no reminders/days).
- The notification seam itself works and even shows foreground banners (`services/notifications.ts:12` `setNotificationHandler`, `:32-46`), and is correctly used by Focus (`app/(tabs)/more/focus/index.tsx:92`) and Wellbeing rules (`app/(tabs)/more/dopamine/index.tsx:85`) — so the plumbing exists; habits simply never call it.

**Why prior fixes didn't resolve it.** The reminder *UI* was built (steppers in
`habits/new.tsx`) which looks done, but the wire from UI → repository →
notifications was never connected, and no recurring-schedule engine exists.

**Severity: major.**

---

## 4. Settings functionality

**Root cause.** As of HEAD most controls are genuinely wired (a recent "settings
truth" pass fixed the dead ones). The historical complaint ("settings do nothing")
was accurate before that pass; today the gaps are narrow.

**Evidence — control-by-control (current state).**

| Control | Wired? | Applied where | Persists? |
|---|---|---|---|
| Theme (dark/light/system) | ✅ | `contexts/ThemeContext.tsx` `setMode` → whole palette | ✅ `@mode` |
| Accent | ✅ | `ThemeContext` `setAccent` → `c.accent` app-wide | ✅ `@accent` |
| Font size | ✅ | `lib/textScale.ts` patches base `<Text>`/`<TextInput>` | ✅ `settingsStore` |
| Density | ✅ (recent) | `hooks/useDensity.ts` → `components/ui/SmartCard.tsx` padding + settings gaps | ✅ `settingsStore` |
| Language | ✅ | `lib/i18n.ts` `changeLang` (+RTL) | ✅ `@lang` |
| Haptics | ✅ | `services/feedback.ts` gates on `settingsStore.haptics` | ✅ |
| Notifications (master) | ✅ (recent) | `services/notifications.ts` gates `scheduleReminder` | ✅ `settingsStore` |
| Export data | ✅ | `db.exportAll()` + Share sheet | n/a |
| Delete account | ✅ | Edge Function + `db.clearAll()` → auth | n/a |
| Sounds | removed (recent) | playback is a verified no-op; toggle removed | n/a |
| `aiLanguage` (store field) | removed (recent) | was never read | n/a |

**Why prior fixes didn't resolve it (historically).** Density's multiplier
existed in `tokens/spacing.ts` but was never imported; Sounds toggled a no-op
`feedback.playSound`. Both were dead until the recent settings pass. **Caveat:**
these settings only persist to AsyncStorage (`settingsStore`) — they do **not**
sync to a user account (see §1), so on a fresh install/device everything resets.

**Severity: minor** (at HEAD) / was **major** historically.

---

## 5. Cross-section linkage

**Root cause.** Local-first writes and reads mostly share a collection, so
same-screen persistence works — but a few chains are broken by **two data models
for the same entity** (goals) and by **routes that point at screens that don't
exist** (exam), so items created in one place never appear where the user expects.

**Evidence — traced examples.**
- **Goal (broken):** the goal creator writes to the `goals` collection —
  `app/(tabs)/more/areas/[id]/project/new-goal.tsx:26` (`repository.addGoal`) —
  but the project screen renders the project row's **embedded** `project.goals`
  array, not the collection: `app/(tabs)/more/areas/[id]/project/[pid].tsx:75-78`.
  A created goal is therefore invisible. Worse, **nothing reads the `goals`
  collection at all** in `app/` (grep: `listGoals` has no caller) — it is a dead
  write path.
- **Voice habit (partial):** "أضف عادة قراءة كل ليلة" → local parser tags it
  `habit` (`aiService.ts:65`) → Review → `insertDetected` → `habits` collection
  (`repository.ts:148`) → `listHabits` (`repository.ts:502`) shows it ✅. But its
  "كل ليلة"/time is lost — no reminder (see §3), and `mapFor` hard-codes
  `freq:'daily', time_pref:'anytime'` (`repository.ts:148`) regardless of the
  spoken schedule.
- **Exam deep-link (broken target):** `routeFor('exam', …)` returns
  `'/(tabs)/more/schedule'` (`services/repository.ts` `routeFor`) — there is no
  exam detail screen, so a "View" on an exam lands on the schedule, not the exam.
- **Improved at HEAD:** the memory graph now stores each node's real entity id and
  the Connected strip deep-links to it (`repository.relatedMemory` returns a
  `route`; `components/ui/ConnectedLayer.tsx` rows are tappable) — so
  task/journal/exam connections navigate correctly where nodes exist.

**Severity: major** (goals dead path + exam route); rest minor.

---

## 6. General repo health

**Root cause.** Structural drivers of "why repeated sessions don't produce durable
improvements": (a) the demo/live split silently swallows the most important
failures, (b) errors are widely swallowed with empty catches, and (c) some
features are built UI-first and never wired to their service.

**Evidence.**
- **26 empty/silent catch blocks** across `services/`, `app/`, `components/`
  (grep for `catch {}` / `.catch(()=>{})`), e.g. `services/aiService.ts` remote
  path swallows every error → the app silently falls back to local with no signal.
- **Feature-built-but-not-wired** pattern: `habits/new.tsx:43` reminders (see §3);
  `goals` collection written, never read (see §5).
- **Demo/live ambiguity** is the master issue: `services/auth.ts:16,23` returns
  success in demo, so a tester cannot tell whether they are "really" signed in.
- Not a bug (clarification): `data/mock` imports in signed-in screens are
  **type-only** (`import type { TaskData }`) plus the legitimate `habitTemplates`
  starter list — not stale seed reads.

**Severity: major** (observability + the demo/live trap).

---

## 7. Strategic & product-level audit (is this a billion-dollar-caliber foundation?)

**Root cause (one paragraph).** The *skeleton* of the stated vision exists —
capture → Review Layer → local-first repository → a memory graph → per-section
screens — which is genuinely more than most prototypes. But the **load-bearing
pillars of the vision are the ones that are stubbed or gated off**: the AI that is
supposed to "understand you" ships as a keyword matcher; the "one life graph" is a
label index with 1-hop lookups, not a typed graph with foreign keys to the real
rows; there is no recurring-event/notification engine, so a life OS cannot
actually remind you of your life; and the demo/live boundary is implicit, so the
product cannot tell the user (or its own builders) whether anything is real. Left
as-is, these cap the app at "beautiful prototype."

**Evidence & specifics.**
- **Vision vs reality — the AI.** The promise is natural understanding; the
  shipped reality is `services/aiService.ts:51-76` keyword rules with the real
  model (`supabase/functions/ai-parse/index.ts:33`) gated off on device (§2).
  Voice is transcribed and fed in (`hooks/useVoice.ts` → `parseDay`), but because
  the parser is weak, voice is effectively a *bolted-on transcription*, not a
  first-class end-to-end input.
- **Memory graph is not a real life graph.** Nodes are label mirrors; there is no
  FK from `memory_nodes` to the domain rows — the entity id lives only inside a
  JSON `data` blob (`services/repository.ts` `persistMemory`), and lookup is
  substring + 1 hop (`repository.ts` `relatedMemory`). It cannot answer "everything
  connected to this exam across all domains" reliably, which is the core life-OS
  claim.
- **No event/notification infrastructure.** Reminders are one-shot
  `nudgeIn`/`scheduleReminder` calls (`services/notifications.ts:32-46`) fired
  inline at write time. There is no recurring scheduler, no server-side push, no
  re-arm on reboot — so habits/routines (the heartbeat of a life OS) can't fire
  (§3).
- **No account = no product.** Everything is AsyncStorage-local (§1, §4). There is
  no cross-device identity, so the app cannot honestly be "your life, everywhere."
- **Review Layer gates AI writes, not all writes.** `persistAccepted`/`persistOne`
  are review-gated, but the direct add-screens (`tasks/new`, `habits/new`,
  `journal/new`, `areas/new`) write straight to the repository. That is a
  reasonable product choice, but it means "AI proposes, human approves before
  anything is written" is only true for the capture path.
- **Observability = none.** `analytics.log` is local only; 26 silent catches (§6)
  mean failures are invisible. A category-defining product needs error/product
  telemetry to know what's breaking for users.

**What is actively working against a premium outcome (blunt).**
1. The single most damaging decision is the **silent demo fallback** (`auth.ts:16,23`): it converts "nothing is actually persisted/authenticated" into "looks like it worked," which is why months of testing never exposed that the app was never really live.
2. Shipping the **weak local parser as the default brain** guarantees the AI feels dumb on every real device test, undermining the one differentiator.
3. **UI-first features with no service wire** (habit reminders, goals) create the illusion of completeness and burn future sessions re-discovering the same gaps.

**Comparative bar (Apple / Notion / Linear / Arc / Perplexity) — top 5
highest-leverage gaps.**
1. **Guarantee the live path ships** (anon key in the build, Gemini secret set, `getSession()` restore) — turns the app from a local toy into a real product. *Highest leverage.*
2. **Make the AI actually good on device** — either always-on remote model or a far stronger local NLU, plus schedule/entity extraction that survives to the row.
3. **A real recurring reminder/event engine** — habits, routines, and time-bound tasks that fire reliably (and re-arm on reboot).
4. **A true typed life graph** — FK-linked nodes/edges with a query API, so cross-domain "connected" is real and fast at volume.
5. **One entity model per domain + observability** — kill the goals double-model, remove dead write paths, replace silent catches with typed error reporting/telemetry.

**Severity: blocks-everything** for the "billion-dollar" claim; individually the
items range major→blocks.

---

## Prioritized fix & closing-the-gap roadmap
*(ordered by leverage; diagnosis only — none implemented here)*

1. **Ship the live path.** Inject `EXPO_PUBLIC_SUPABASE_*` into `build-apk.yml`; verify the Gemini secret via `deploy-supabase.yml`; add `getSession()` + `onAuthStateChange` restore in `app/index.tsx` and gate `(tabs)` on a real session. *(blocks-everything → §1)*
2. **Kill the silent demo mask.** Make demo mode explicit/visible (or remove it); stop `auth.ts:16,23` returning `{ok:true}` as if signed in. *(blocks-everything → §1/§6)*
3. **Guarantee the AI's remote brain on device**, with a clear "offline/local" indicator; strengthen the local fallback's task/date/habit extraction so no cue-word-less sentence is silently dropped. *(blocks-everything → §2)*
4. **Wire habit reminders end-to-end** and add a recurring scheduler: `habits/new.tsx` reminders → `addHabit` → notifications; persist a `habit_reminders` model; re-arm on launch. *(major → §3)*
5. **Unify the goal model:** make project detail read the `goals` collection (or make `addGoal` write the embedded array), and delete the dead `listGoals` write path. *(major → §5)*
6. **Add an exam detail route** (or repoint `routeFor('exam')`) so exam deep-links land correctly. *(minor → §5)*
7. **Promote the memory graph to a typed, FK-linked life graph** with an id-based neighbor query and richer edge types; back the Connected strip with it. *(major/strategic → §7)*
8. **Replace 26 silent catches with typed error reporting** and add product/error telemetry. *(major/strategic → §6/§7)*
9. **Account-level sync for settings & customization** so preferences survive reinstall/device change. *(major → §4/§1)*
10. **Decide and document the Review-before-write contract** — either route all writes through it or explicitly scope it to capture. *(strategic → §7)*
