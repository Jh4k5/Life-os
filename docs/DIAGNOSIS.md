# LIFE OS AI — Full Diagnostic Audit (v2, independently re-verified)

**Scope:** read-only diagnosis. No application code was changed to produce this document.
**Repo state audited:** tree of `81edc80` (branch `claude/read-files-build-app-rw8fqi`), re-audited on branch `claude/life-os-diagnostic-audit-92x3rq`.
**Method:** a prior audit (`docs/DIAGNOSIS.md` @ `81edc80`) existed; per instructions it was **not trusted** — every claim below was re-verified against the code, and two of its load-bearing claims are **corrected** here (marked ⚠️ CORRECTION).

## ملخص تنفيذي (بالعربي)

المشكلة الجذرية ليست "الذكاء ضعيف" ولا "الإعدادات خربانة" — هي ثلاث حقائق بنيوية:

1. **الحساب لا يُستعاد أبدًا عند فتح التطبيق**: لا يوجد أي `getSession()` أو `onAuthStateChange` في الكود كله، والتسجيل يوجّهك للتطبيق حتى لو لم تُنشأ جلسة أصلًا (تأكيد الإيميل معلّق) — لذلك كل إعادة فتح تطلب تسجيل الدخول.
2. **كل بياناتك محلية فقط**: طبقة المزامنة `db/sync.ts` المذكورة في التعليقات **غير موجودة كملف أصلًا** — لا صف واحد من مهامك/عاداتك/يومياتك يصل إلى Supabase حتى لو سجّلت دخولًا حقيقيًا.
3. **عقل التطبيق الفعلي هو مطابقة كلمات مفتاحية**: مسار Gemini مبني لكنه مشروط بسر `GEMINI_API_KEY` على الخادم، وعند فشله يسقط **بصمت** إلى محلّل قواعد بسيط يسقط أي جملة بلا كلمة دالة.

التذكيرات للعادات غير موصولة نهائيًا (الواجهة تجمع الأوقات ثم ترميها)، والإعدادات معظمها الآن موصول فعلًا (تحسّنت مؤخرًا). التفاصيل والأدلة سطرًا بسطر أدناه، ثم خارطة طريق مرتّبة بالأولوية في آخر الملف.

---

## 1. Auth & session persistence

**Root cause.** Three independent breaks stack on top of each other. (a) There is **no session restore path at all**: `getSession()` / `onAuthStateChange()` appear **nowhere** in the codebase, and cold start decides "signed in?" via a *network* call. (b) The sign-up screen navigates into the app on `{ok:true}` even when Supabase created **no session** (its default "confirm email" flow returns a user but a `null` session) — so "sign-up worked" is an illusion, and the next cold start correctly finds no session and shows sign-in again. (c) In any build without env vars (Expo Go, EAS, local dev without `.env`), auth is silently **faked**: `signIn`/`signUp` return `{ok:true}` without doing anything, and the entry route skips auth entirely.

**Evidence.**
- No restore listener anywhere: repo-wide grep for `getSession|onAuthStateChange|refreshSession` matches **only the old docs file** — zero hits in `app/`, `services/`, `components/`, `hooks/`.
- Cold start = network `getUser()`, not local session read: `services/auth.ts:60-65` (`client.auth.getUser()`), called from `app/index.tsx:21-23`. Offline or slow network at launch ⇒ `null` ⇒ `/(auth)/welcome`.
- Sign-up navigates regardless of session: `app/(auth)/sign-up.tsx:35-41` — on `res.ok` it sets local profile state and `router.replace('/(tabs)/home')`; the comment on lines 36-37 even says "whether or not the account finishes verifying." `auth.signUp` (`services/auth.ts:21-30`) reports `ok:true` whenever there's no *error* — an unconfirmed signup has no error **and no session**.
- Demo-mode fake success: `services/auth.ts:16` and `:23` (`if (!client) return { ok: true }`); entry bypass: `app/index.tsx:17-19` (`!isSupabaseConfigured()` → straight to `/(tabs)/home`).
- Client config itself is correct: `services/supabase.ts:25-33` (`persistSession: true`, `storage: AsyncStorage`) — persistence is *possible*; nothing restores or listens.
- No route guard on `(tabs)`: `app/(tabs)/_layout.tsx` and `app/_layout.tsx:32` contain no auth check — only `app/index.tsx` routes by auth, so anything that lands past it is unguarded.

**⚠️ CORRECTION to the prior audit.** It claimed "the APK workflow injects no such env … **every CI APK is demo mode**." That is **false at this repo state**: `.github/workflows/build-apk.yml:50-51` runs `cp .env.example .env` before the build, and `.env.example` carries the **real** project URL + publishable key (`.env.example:7-8`, real values present since commit `639e50d`, 2026-07-01; the workflow has had the `cp` step since its creation in `73ecb7d`, 2026-07-02). So GitHub-Actions APKs are **live-mode**. This actually *fits the founder's symptom better*: a demo-mode app would never ask to sign in (it skips auth entirely, `app/index.tsx:17-19`); an app that "always asks to sign in again" is a **live** app whose session is never restored / was never created (breaks (a)+(b) above). Demo mode still silently applies to Expo Go and EAS builds (`eas.json` defines no env) and local dev without `.env`.

**Why previous fix attempts didn't resolve it.** Sessions added a correct client (`5224937`), real env values (`639e50d`), and CI injection (`73ecb7d`) — each fixed one layer — but nobody ever added the restore listener or handled the "signup without session" case, and the two silent-success paths (`auth.ts:16,23`; `sign-up.tsx:35-41`) make every test *look* like it passed.

**Severity: blocks-everything.**

---

## 2. AI parsing pipeline (voice/text → detected items)

**Root cause.** The pipeline is: voice (`hooks/useVoice.ts`) → `capture()` (`app/(tabs)/home/index.tsx:100-114`) → `aiService.parseDay()` → remote Gemini first, local keyword parser as fallback. The remote path is **double-gated** — it needs a configured client *and* the server-side `GEMINI_API_KEY` secret — and every failure at either gate is **silent**, so on a typical device the user gets the local keyword matcher and has no way to know. The local matcher only classifies lines containing explicit cue words; everything else collapses into one journal blob.

**Evidence — which path actually runs.**
- Gate 1 (client): `services/aiService.ts:20-21` — `remoteParse` returns `null` without a client. Live in CI APKs (see §1 correction), null in Expo Go/EAS/local-without-`.env`.
- Gate 2 (server secret): `supabase/functions/ai-parse/index.ts:34-36` — no `GEMINI_API_KEY` ⇒ returns `{reply:'', items:[]}`; the client treats empty items as failure (`aiService.ts:34`) and **silently** falls back local. Setting the secret requires manually running `deploy-supabase.yml` with 3 GitHub secrets (`.github/workflows/deploy-supabase.yml:42-52`); whether that ever happened is unverifiable from the repo — but the *design* guarantees that if it didn't, nobody notices.
- All remote errors swallowed: `aiService.ts:30-32, 36-38` (bare `catch { return null }`).

**Evidence — concrete local-parser failures (`services/aiService.ts`).**
- **Cue-word-or-nothing classification** (`:51-76`): a line becomes a task only with لازم/يجب/محتاج/ابغى/عايز/بدي/task/todo… (`:71`). "اتصل بأمي الساعة ٥" has no cue ⇒ `note` (`:75`) ⇒ **dropped** from actionable items (`:238` skips note/journal) ⇒ no task, just the journal blob.
- **Comma segmentation splits one intent into fragments** (`:151-156` splits on `،`): "لازم أشتري حليب، خبز، وبيض" → 3 lines; only the first has the cue ⇒ one task "لازم أشتري حليب"; خبز and وبيض are silently lost.
- **Priority-order misclassification** (`:55` beats `:71`): "لازم أذاكر للامتحان" contains امتحان ⇒ classified `exam` ⇒ **creates an exam row + an all-day calendar event** (`services/repository.ts:170-185`) instead of a task.
- **`study_session` becomes a Course** (`services/repository.ts:154`): "ذاكرت رياضيات ساعتين" inserts a *new course* named "ذاكرت رياضيات ساعتين" into `study_courses` — repeated captures litter the Study section with junk courses.
- **`suggestion` items are silently unpersistable**: 'ممكن' lines classify as suggestion (`aiService.ts:69-70`), and `mapFor` returns `null` for them (`repository.ts:155-156`) — accepting one in Review does nothing, with no error.
- **Naive time regex** (`:45`): `TIME_RE` matches any bare 1-2-digit number, so "قرأت 20 صفحة" gets `detail: "20"` as a "time". (The *date* resolver has a guard against exactly this — `services/dateResolve.ts:32-34` — but `aiService.extractTime` doesn't use it.)
- **Habit schedule discarded at insert**: `mapFor('habit')` hard-codes `freq:'daily', time_pref:'anytime'` (`repository.ts:148`) — "عادة قراءة كل ليلة الساعة ١٠" persists with no time.

**Evidence — write path vs read path (previously-reported mismatch class).**
- **Now consistent** for the main entities: `insertDetected` (`repository.ts:168-191`) writes to `journal_entries`/`tasks`/`habits`/`events`/`meals`/`workouts`, and the screens read those same collections through `repository.listJournal` (`:368`), `listTasks` (`:426`), `listHabits` (`:502`), `listEvents` (`:879`). Screen imports of `data/mock` are type-only/seed (`repository.ts:10-19`). The old mock-vs-store split is **fixed**.
- **One real residual mismatch:** an AI-captured exam is inserted with `course_id: null` (`repository.ts:172`), but the Study screen only renders exams grouped **under a course** (`repository.ts:588-611`, `examsByCourse.get(r.id)`) — a course-less exam is invisible in Study and only appears as a calendar event. Partially fixed ≠ fixed.

**Why previous fix attempts didn't resolve it.** Sessions kept strengthening the *local* parser (commands `49c496f`, study-build, dialect cues) — polishing the fallback while the actual product brain (Gemini) stays behind a secret that has to be set once, manually, and whose absence is silent by design (`ai-parse/index.ts:34-36`).

**Severity: blocks-everything** (this is the core product promise).

---

## 3. Habit reminders / timers

**Root cause.** A habit created with reminder times schedules **nothing**. The UI collects times and throws them away; the repository has no reminder field; no code path connects habits to the (working) notifications service; and there is no recurring scheduler anywhere — `expo-notifications` calendar/recurring triggers are never used, and nothing re-arms on reboot.

**Evidence.**
- UI collects then drops: `app/(tabs)/more/habits/new.tsx:43` (`reminders` state, default `['08:00']`), `:41` (`customDays`), `:44-45` (`noteEnabled`/`retroEnabled`) — none of them are in the save call `:52`, which passes only `{name, emoji, color, type, target, unit, freq, timePref, areaId}`.
- `addHabit` has no reminder parameter and never touches notifications: `services/repository.ts:537-551`.
- The only proactive scheduling code fires for `reminder`/`appointment` types **only**: `services/repository.ts:121-127` (`scheduleReminders`), invoked only from the capture-apply paths (`:333`, `:359`) — never for habits, never from `habits/new.tsx`.
- **Additional defect:** even when it *does* fire, it doesn't schedule at the item's time — it schedules a fixed nudge **60 minutes from now**: `repository.ts:124` (`notifications.nudgeIn(60, …)`), ignoring the parsed date in the row it just wrote.
- The notification seam itself is real and works (foreground handler `services/notifications.ts:11-20`; date-trigger scheduling `:32-42`; used correctly by Focus `app/(tabs)/more/focus/index.tsx` and Wellbeing rules) — the plumbing exists; habits simply never call it.
- No reminder storage anywhere: `supabase/schema.sql` habits table has `time_pref` but no reminders/days column; local `habits` rows likewise (`repository.ts:538-548`).

**Why previous fix attempts didn't resolve it.** The reminder *UI* was built and looks finished, so sessions moved on; the wire UI → repository → notifications was never pulled, and no session ever built a recurring-schedule engine (one-shot `DATE` triggers are the only kind used).

**Severity: major.**

---

## 4. Settings functionality

**Root cause.** Historically accurate complaint, now mostly fixed: a recent "settings truth pass" (`b62ebf2`) wired density, gated notifications, and removed dead controls. At this HEAD, every visible control is real. The remaining caveats: everything persists **only to device AsyncStorage** (no account sync — a reinstall resets all preferences, see §1/§6), and one dead field (`sounds`) still lives in the store.

**Evidence — Control → Wired? → Applied where? → Persists?**

| Control | Wired? | Applied where | Persists? |
|---|---|---|---|
| Theme dark/light/system | ✅ `app/settings/index.tsx:126` | `contexts/ThemeContext.tsx` palette app-wide | ✅ AsyncStorage |
| Accent color | ✅ `:147` | `ThemeContext` → `c.accent` everywhere | ✅ |
| Font size | ✅ `:174` | `lib/textScale.ts:20-36` patches base `<Text>`/`<TextInput>` render; installed at `app/_layout.tsx:11` | ✅ `settingsStore` |
| Density | ✅ `:200` | `hooks/useDensity.ts:9-12` → `components/ui/SmartCard.tsx:50` padding | ✅ `settingsStore` |
| Language (7 langs + RTL) | ✅ `:218` | `lib/i18n.ts` `changeLang` | ✅ |
| Haptics | ✅ `:253` | `services/feedback.ts` gates on store | ✅ |
| Notifications master | ✅ `:36-39` | `services/notifications.ts:34-36` blocks all scheduling when off | ✅ |
| Export data | ✅ `:46` | `db.exportAll()` (`db/local.ts:195-199`) → Share sheet | n/a |
| Delete account | ✅ `:64-67` | Edge Function `delete-account` + local wipe + accent reset | n/a |
| `sounds` (store field) | ❌ dead | `store/settingsStore.ts:13,34,42` — no UI reads/writes it anymore | — |

**Why previous fix attempts didn't resolve it (historically).** Density's multiplier existed in `tokens/spacing.ts` but nothing imported it; Sounds toggled a no-op. Both were "built" so they looked done. `b62ebf2` fixed the visible layer; account-level persistence was never in scope because no sync layer exists (§6).

**Severity: minor at HEAD** (was major historically).

---

## 5. Cross-section linkage

**Root cause.** Same-collection read/write is now the norm, so most chains hold. The breaks that remain are: a duplicated data model for goals (dead write path), an entity type whose deep link has no real destination (exam), the habit-time loss from §2/§3, and the course-less exam invisibility from §2.

**Evidence — traced chains.**
- **Goal via project (BROKEN — dead write path):** creator writes the `goals` collection — `app/(tabs)/more/areas/[id]/project/new-goal.tsx:26` (`repository.addGoal`, → `repository.ts:721-735`) — but the project screen renders the **embedded** `project.goals` array from the `projects` row: `app/(tabs)/more/areas/[id]/project/[pid].tsx:74-78`. A goal created there never appears anywhere: repo-wide grep shows `repository.listGoals` (`repository.ts:705`) has **zero callers**.
- **Habit via voice (PARTIAL):** "أضف عادة قراءة كل ليلة ١٠ مساء" → `detectType` tags `habit` (`aiService.ts:65-66`) → Review → `insertDetected` → `habits` collection (`repository.ts:148`) → visible in Habits (`listHabits`, `:502`) ✅ — but its schedule is hard-coded away (`freq:'daily', time_pref:'anytime'`, `:148`) and no reminder ever fires (§3) ❌.
- **Task with due date via voice (PARTIAL):** "لازم أسلم التقرير بكرة" → task cue ✅ → but `mapFor('task')` (`repository.ts:136-137`) writes **no `due` field at all** — the parsed time in `detail` is discarded; the task shows undated in Tasks, and never reaches the calendar. (`resolveDate` is only used for events/exams, `:143,171`.)
- **Exam deep link (BROKEN target):** `routeFor('exam', …)` returns `'/(tabs)/more/schedule'` (`repository.ts:210-215`) — no exam detail screen exists; "View" on an exam lands on the generic schedule. Combined with the `course_id: null` invisibility in Study (§2), an AI-captured exam effectively lives only as a calendar row.
- **Improved at HEAD (works):** the memory graph stores each node's real entity id (`persistMemory`, `repository.ts:299-309`) and `relatedMemory` returns tappable deep links (`:922-944`) consumed by the Connected strip — cross-links navigate correctly where the target screen exists.

**Severity: major** (goals dead path; task due-date loss; exam route) — the rest minor.

---

## 6. General repo health

**Root cause.** Four structural drivers explain why repeated build sessions haven't produced durable, observable improvement: (1) the promised sync layer **does not exist as a file**, while comments assert it does; (2) failures are systematically swallowed; (3) work is stranded across unmerged branches with an **empty default branch**; (4) the demo/live boundary is invisible at runtime.

**Evidence.**
- **Phantom sync layer:** `db/local.ts:4-6` and `services/repository.ts:5-6` both describe "a separate sync layer (db/sync.ts)" that "pushes dirty rows to Supabase" — **`db/sync.ts` does not exist** (`db/` contains only `local.ts`). Its consumer API sits unused: `dirty()`, `markClean()`, `mergeRemote()` (`db/local.ts:160-184`) have zero callers. Net effect: **no user row (task/habit/journal/…) ever reaches Supabase**, signed-in or not. The only tables ever written remotely are `analytics_events` (`services/analytics.ts:30`) and `insights` (`services/intelligence.ts:272-329`).
- **Silent failure as a pattern:** 21 bare `catch {` blocks plus `.catch(() => {})` handlers (~32 total swallow sites) across `services/`, `app/`, `components/` — including every remote-AI failure (`aiService.ts:30,36`), every storage write failure (`db/local.ts:83-85`), and analytics (`analytics.ts:38-40` — which is also a **complete no-op when signed out**, `analytics.ts:26-29`, so demo/local usage produces zero telemetry).
- **Empty default branch / stranded work:** `master` has **no commits at all** (this audit session cloned an empty tree); all 82 commits live on `claude/read-files-build-app-rw8fqi`, and a second branch `claude/ui-ux-pro-max-skill-6fcpfk` holds 7 unmerged design-system commits (diverged since `a99c183`). Every "finished" session's work is only as real as the branch someone remembers to build from.
- **Built-but-never-wired features:** habit reminders UI (§3), `goals` collection (§5), dead `sounds` store field (§4), sync bookkeeping flags (`_dirty`/`_deleted`) with no consumer.
- **Mode ambiguity at runtime:** nothing in the UI ever tells the user (or a tester) whether the app is live or demo; `auth.ts:16,23` actively lies. `PersistResult.demo` exists (`repository.ts:33-37`) but is hard-coded `false` (`:350`).

**Severity: major** (the phantom sync + observability gap are the engine of the "nothing sticks" experience).

---

## 7. Strategic & product-level audit

**Root cause (one paragraph).** The skeleton matches the vision unusually well — capture → Review Layer → local-first repository → memory graph → intelligence engine → per-section screens is the right shape, and more of it is real than the founder believes (the settings pass, the SM-2 flashcards, the rule-based insight correlators in `services/intelligence.ts` are genuine). But the four load-bearing pillars of "an AI-first life OS" are precisely the stubbed ones: **identity** (sessions don't survive a restart, §1), **memory** (data never leaves the device — the sync layer is a comment, §6), **intelligence** (the shipped brain is a keyword matcher behind a silently-failing remote, §2), and **proactivity** (no recurring reminder engine, §3). A life OS that forgets who you are, keeps your life on one device, parses by cue words, and never reminds you of anything cannot claim the category — regardless of polish.

**Vision-vs-reality, cited.**
- *"The AI understands you"* → `services/aiService.ts:51-76` keyword rules are the effective brain; the real model is behind an unverifiable manual secret with silent fallback (`ai-parse/index.ts:34-36`, `aiService.ts:34-38`).
- *"One life graph"* → `memory_nodes/edges` exist and carry real entity ids (`repository.ts:299-327`) — genuinely better than isolated tables — but retrieval is **single-longest-word substring match + 1 hop** (`relatedMemory`, `repository.ts:922-944`); no typed traversal, no FK integrity, no ranking. It cannot answer "everything connected to this exam" reliably or at volume.
- *"Review before write"* → true **only for the AI capture path** (`persistAccepted`/`persistOne`, `repository.ts:331-365`; insights actions also route through Review, `intelligence.ts:28-29`). Every direct add-screen writes straight to the store (`tasks/new`, `habits/new.tsx:52`, `journal/new`, …). Defensible product choice — but the claim as stated is not implemented.
- *"Voice is the primary input"* → in a real build it genuinely is: continuous STT with segment accumulation (`hooks/useVoice.ts:36-96`) feeding capture (`home/index.tsx:114`). In Expo Go it silently degrades to disabled (`services/speech.ts:19-39`). Voice quality is capped by §2, not by the voice layer itself.
- *"Cross-domain intelligence"* → exists in embryo and is surfaced (`services/intelligence.ts:60-120+` rule correlators; consumed in `ai-hub`, home, health, journal screens). ⚠️ CORRECTION to the prior audit's implication that each section is a pure island — the engine is real; it is *rule-based and local*, which is a ceiling, not an absence.

**Architectural decisions that will block scale.**
1. **No client↔server data plane.** Local-first without the sync half (§6) means no multi-device, no backup, no server-side AI over the user's history, no web app — ever — until `db/sync.ts` stops being fictional. This is *the* scaling blocker.
2. **Implicit demo/live modes.** One boolean (`isSupabaseConfigured`, `supabase.ts:17-18`) silently reshapes auth, AI, analytics, and capture behavior with no runtime surface — the direct cause of months of misdiagnosed testing.
3. **AsyncStorage as the database.** Whole-collection JSON blobs rewritten per mutation (`db/local.ts:79-86`), full-scan filters per read, unbounded in-memory cache — fine at 100 rows, degrading at thousands (a year of habit logs), with no migration story to SQLite.
4. **One-shot local notifications as the "event system"** (§3): no recurrence, no re-arm on boot, no server push (`notifications.ts` is the entire infrastructure).
5. **Observability zero** in exactly the modes users test in (`analytics.ts:26-29` no-ops signed-out; silent catches elsewhere).
6. Security posture is broadly sane (anon key is legitimately public, RLS `user_id = auth.uid()` on every table — `supabase/schema.sql:163-205`; Gemini key server-side only) — one hygiene note: a real publishable key lives in the committed `.env.example:8` by deliberate choice; acceptable for anon keys, but it normalizes committing credentials.

**Foundational (not cosmetic) missing pieces, ranked.**
1. Session restore + honest auth states (§1) — identity is the precondition for everything "yours."
2. The sync layer (`db/sync.ts`) — memory that outlives the device.
3. Guaranteed-live AI with visible degradation (§2) — the differentiator itself.
4. Recurring reminder/event engine (§3) — proactivity is the "OS" in life OS.
5. Graph retrieval that is typed and id-based rather than substring (§7 above).
6. Error/product telemetry that works signed-out (§6).

**What is actively working against a premium outcome (blunt).**
1. **Silent success theater**: `auth.ts:16,23` fake sign-in, `sign-up.tsx:35-41` navigating without a session, `ai-parse` returning empty on missing secret, bare catches everywhere. The codebase is optimized to *look* finished in a demo, which is why every session "succeeded" and the product still fails on a real phone.
2. **Comments that describe intentions as facts** (`db/local.ts:4-6`, `repository.ts:5-6` describing a nonexistent sync file) — future sessions (human or AI) read these and build on sand.
3. **No mainline**: an empty `master` and diverging feature branches mean there is no single truth of "the product," so effort accumulates in silos.
4. **UI-first completion bias**: reminders UI (§3), goals form (§5) — screens ship, wires don't.

**Comparative bar (Apple / Notion / Linear / Arc / Perplexity) — highest-leverage gaps.**
1. **Make live mode the only mode that can claim success** — session restore, honest signup states, visible offline/local badge, demo mode explicit. (Linear-grade correctness of state.)
2. **Ship the real brain reliably** — deployed+verified Gemini path with observable fallback, and a local fallback that extracts dates/times into the actual rows. (Perplexity-grade "the AI part actually works.")
3. **Build `db/sync.ts`** — the file the architecture already promises; ids/tombstones/dirty flags are all waiting. (Notion-grade "your stuff is everywhere.")
4. **A real recurring notification engine** with boot re-arm. (Apple-grade proactivity.)
5. **Merge to a mainline and protect it** — one branch, one APK pipeline, one truth. (Any-of-them-grade engineering discipline.)

**Severity: blocks-everything** for the stated ambition; individually items range major → blocks.

---

## Prioritized fix & closing-the-gap roadmap
*(ordered by leverage; diagnosis only — nothing below was implemented in this session)*

1. **Session restore + auth truth**: add `getSession()` bootstrap + `onAuthStateChange` in `app/index.tsx`/root layout; make `signUp` distinguish "session created" from "confirmation pending" and route accordingly; stop `auth.ts:16,23` returning fake `{ok:true}`. *(blocks-everything → §1)*
2. **Make mode visible**: a single runtime badge/flag for live vs local mode (and surface `PersistResult.demo` honestly). *(blocks-everything → §1/§6)*
3. **Verify & guarantee the Gemini path**: run/repair `deploy-supabase.yml` (set `GEMINI_API_KEY`), make `ai-parse` failures observable in-app instead of silent local fallback. *(blocks-everything → §2)*
4. **Extract entities into rows, not just labels**: local parser (and remote schema) must write task `due`, habit `freq`/time, exam course linkage; fix the study_session→course junk insert; unify time extraction on `dateResolve`. *(major → §2/§5)*
5. **Wire habit reminders end-to-end**: pass `reminders`/`customDays` from `habits/new.tsx:52` into `addHabit`, store them, schedule recurring notifications (calendar triggers) at the actual times, re-arm on cold start; fix `scheduleReminders` to use the item's real time instead of `nudgeIn(60)`. *(major → §3)*
6. **Build `db/sync.ts`** (push dirty → pull merge on session + interval) — the flags and merge functions already exist in `db/local.ts:160-184`. *(major/strategic → §6/§7)*
7. **Kill the goals double-model**: make the project screen read `listGoals` (or write embedded goals) — one source of truth; delete the dead path. *(major → §5)*
8. **Exam destination**: add an exam detail screen or repoint `routeFor('exam')`; show course-less exams in Study. *(minor → §5)*
9. **Error reporting**: replace bare catches with a tiny `reportError` seam (local ring-buffer + remote when live); make analytics work signed-out (queue locally, flush on login). *(major → §6)*
10. **Repo mainline**: merge the working branch (and the stranded `ui-ux-pro-max` design-system commits after review) into `master`/`main`, protect it, point the APK workflow at it. *(major → §6)*
11. **Graph v2**: typed, FK-linked memory edges with id-based traversal + ranking backing the Connected strip. *(strategic → §7)*
12. **Preference & profile sync** to the account so settings survive reinstall. *(minor once #6 exists → §4)*
13. **Decide the Review contract**: either route direct add-screens through Review too, or scope the claim to AI capture — document it. *(strategic → §7)*
14. **Storage engine plan**: define the AsyncStorage→SQLite migration threshold before data volume forces it. *(strategic → §7)*
