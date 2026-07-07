# TRUTH.md — data-source of truth per screen

**Rule:** every screen reads and writes through `services/repository` (backed by
`db/local`, the on-device source of truth). `data/mock` holds **type definitions
only** plus one clearly-labeled read-only starter set (`SEED_AREAS`) and the
habit template catalog (`habitTemplates`). No screen imports mock user-data at
runtime.

Status legend:
- **WIRED** — already read/wrote through the repository before this pass.
- **FIXED** — converted this pass (was reading `data/mock` / `store/mockStore`).
- **SEED** — reads read-only starter content through the repository
  (`repository.listAreas`); not yet user-editable/persisted (a later scope).
- **N-A** — no user-data reads (pure UI / timer / navigation).

| Screen | Data source (read) | Writes through | Status |
|---|---|---|---|
| `home/index` | `repository` (intelligence, events, tasks) | `repository.persistAccepted` | WIRED |
| `more/index` | `repository.listHabits/listTasks/listJournal` | — | FIXED (severed `[]`-mock fallbacks) |
| `tasks/index` | `repository.listTasks` | `repository.addTask/toggleTask` | FIXED |
| `tasks/[id]` | `repository.listTasks` → find | (subtask toggle local) | **FIXED** (was `mockTasks.find` → empty) |
| `tasks/new` | `repository.listAreas` (area picker) | `repository.addTask` | FIXED |
| `habits/index` | `repository.listHabits` | `repository.logHabit` | **FIXED** (was `store/mockStore`, now deleted) |
| `habits/[id]` | `repository.listHabits` + `listHabitLogs` | — | WIRED |
| `habits/new` | `repository.listAreas` (area picker) | `repository.addHabit` | FIXED |
| `habits/templates` | `habitTemplates` (static catalog) | `repository.addHabit` | N-A (catalog) |
| `journal/index` | `repository.listJournal` | `repository.addJournal` | FIXED |
| `journal/[id]` | `repository.listJournal` → find | — | **FIXED** (was `mockJournals.find` → empty) |
| `study/index` | `repository.listCourses` | `repository.addCourse` | FIXED |
| `study/[id]` | `repository.listCourses` → find + `listFlashcards` | `repository.persistAccepted` | **FIXED** (was `mockCourses.find` → empty) |
| `study/flashcards` | `repository.listDueFlashcards` | `repository.reviewFlashcard` | FIXED |
| `schedule/index` | `repository.listEvents` | `repository.persistAccepted` | FIXED |
| `learning/index` | `repository.listLibrary` | `repository.addLibraryItem` | FIXED |
| `health/index` | `repository.getHealthToday/listMeals/listHealthWeek` | `repository.upsertHealthToday/addMeal` | FIXED |
| `exercise/index` | `repository.listWorkouts` | `repository.addWorkout` | FIXED |
| `focus/index` | `repository.listFocusSessions` | **`repository.addFocusSession`** | **FIXED** (was fabricated `mockFocusSessions`) |
| `dopamine` (Wellbeing) | `repository.listWellbeing/wellbeingWeek` | `repository.addWellbeingActivity/toggle…` | WIRED |
| `ai-hub` (Intelligence) | `repository.searchMemory` + `intelligence` | `repository.addMemoryNode` | WIRED |
| `memory/index` | `repository.searchMemory/relatedMemory` | — | WIRED |
| `ai-studio` | `store/workspaceStore` (typed workspaces) | store | WIRED (own typed store, not mock) |
| `areas/index` | `repository.listAreas` | — | SEED |
| `areas/[id]` | `repository.listAreas` + `listHabits` (real linked habits) | — | SEED (+ real habits) |
| `areas/[id]/project/[pid]` | `repository.listAreas` → project | — | SEED |
| `settings/*` | stores + `repository`/`db` (export/delete) | real | WIRED |

## New repository read/write APIs added this pass
- `listAreas()` / `getArea(id)` — single read seam for the starter Areas.
- `listFocusSessions()` / `addFocusSession(...)` — real, persisted focus history
  (new `focus_sessions` local collection).

## Removed
- `store/mockStore.ts` (deleted — was the last runtime mock store; habits now
  read the repository).
- `mockDopamine` runtime object and the fabricated `mockFocusSessions` rows.
- All `data/mock` **value** seed reads from screens (11 symbols now 0 refs).

## Known remaining limitations (next scopes, not this one)
- **Areas** are read-only starter content (SEED). Creating/editing areas and the
  tasks/goals nested inside a project are not yet persisted — those nested items
  are illustrative starter content, not the user's real Task/Journal store.
- A few section headers still have decorative add buttons that are not yet wired
  to a create flow (e.g. `schedule` `+`, `exercise` `+`). They do nothing and
  claim nothing — to be wired in a per-domain feature scope.

## DONE check for this scope
Speaking a capture that yields an appointment + a task + a journal entry, then
Apply, makes each appear in Schedule / Tasks / Journal immediately (optimistic
+ focus refresh) and after a full app kill/restart (persisted in `db/local`,
read back through the repository on next launch).
