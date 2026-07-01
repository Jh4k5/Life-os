# Go live — one-click automated deploy (no terminal)

The whole backend deploys itself on GitHub Actions (which has internet access).
You do **one** ~2-minute thing, once: add three secrets in the GitHub web UI.
After that, the deploy runs on a button (or Claude triggers it for you).

## Step 1 — add 3 repository secrets (one time)

GitHub → your repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**. Add these three:

| Secret name             | Where to get it                                                        |
| ----------------------- | ---------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens → *Generate new token*   |
| `SUPABASE_DB_PASSWORD`  | Supabase → Project → **Settings → Database → Database password**       |
| `GEMINI_API_KEY`        | A **freshly rotated** Gemini key (the old one was shared in chat)      |

Optional: `SUPABASE_PROJECT_REF` (defaults to `jlwmpyhiitgdklrbmxrh`).

> These live only as GitHub Actions secrets — never in the app bundle or git.
> The client keeps using only the public anon key (protected by RLS).

## Step 2 — run it

- GitHub → **Actions** tab → **Deploy to Supabase (go live)** → **Run workflow**.
- Or just tell Claude "the secrets are set" and it triggers + watches the run.

The workflow then, automatically:
1. `supabase link` to the project,
2. `supabase db push` — applies `migrations/0001_init.sql` + `0002_phase2_domains.sql`,
3. deploys Edge Functions: `ai-parse`, `ocr`, `transcribe`, `nutrition`,
4. `supabase secrets set GEMINI_API_KEY` (+ `GEMINI_MODEL`).

When it's green, the app is live: sign up → data persists → AI parse, meal-photo
macros, and voice transcription use the server (Gemini) path.

## Why one manual step is unavoidable
Deploying schema/functions needs privileged credentials (a Supabase access token
and the DB password) that only the account owner can generate, and that must
never be committed to the repo. Pasting them into GitHub's encrypted Secrets
store is the secure, minimal footprint — everything else is automated.
