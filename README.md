# NEXT STEP — הצעד הבא שלך

A Hebrew-first, RTL web app that helps Jewish Israeli students in grades 11–12 (and recent graduates) explore four post-high-school pathways — **IDF service, pre-military academies (mechinot), hesder yeshivot and higher yeshivot** — and get up to three explainable recommendations from a catalog of verified institutions.

Core flow: landing page → adaptive questionnaire → pathway-level fit → up to 3 institution recommendations → search and institution profiles → save → compare → personal pathway map → community questions and answers → grounded assistant with citations.

Without Supabase settings the app runs as a device-only guide (everything personal stays in `localStorage`). With them it adds email-link accounts, saving to the account, a personal pathway map, a moderated community and an admin review queue for registry imports.

## Stack

- **Next.js 15 (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** with design tokens in `src/app/globals.css`
- **Zod** for the domain schema, API input and AI output validation
- **Heebo** (body) and **Frank Ruhl Libre** (display) self-hosted through `@fontsource` — no request to Google from the visitor's browser
- **lucide-react** icons; original SVG landscapes instead of stock photography
- **Vitest** (matching engine) and **Playwright** (user journeys, desktop + mobile)
- Optional: **Anthropic API** (`@anthropic-ai/sdk`) for consent-gated summaries and the assistant; **Supabase** (`@supabase/ssr`, server-side only, schema `next_step`) for accounts, community and the catalog

## Running locally

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are required. Without them the app uses the bundled seed catalog and the deterministic engine, AI features say they are unavailable, account features say they are not available on this site, and `/admin` returns 404.

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # Vitest — matching engine, catalog integrity, questionnaire logic
npm run build && npm run test:e2e   # Playwright — starts `next start` on port 3100
npm run seed:sql       # writes supabase/seed.sql (catalog → next_step.institutions)
npm run registry:report   # matches data/registry/*.json against the catalog, writes
                          # docs/coverage-report.md and supabase/registry-entries.sql
TEST_DATABASE_URL=postgres://… npm test   # also runs the 12 RLS tests against real Postgres
npm run build && POSTGREST_BIN=/path/to/postgrest npm run test:e2e:db
```

`test:e2e:db` builds a throwaway database (`ns_e2e`) from the migrations, seed and registry SQL, runs a real PostgREST v12 in front of it, and stands in for Supabase Auth with a small gateway (`e2e-supabase/support/gateway.mjs`) that accepts HS256 test tokens. Everything the app does against the database — RLS, column grants, rate-limit triggers, RPCs — is the real thing; only the email delivery and token issuing are simulated. Test users are labelled as test users and exist only in that database.

Playwright uses the Chromium it ships with (`npx playwright install chromium` on a fresh machine).

## Environment variables

See `.env.example`. All optional.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL for metadata |
| `ANTHROPIC_API_KEY` | Enables the assistant and opt-in AI summaries (server-side only) |
| `ANTHROPIC_MODEL` | Model override; default `claude-opus-5-5` |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Enables accounts, saving, pathway map, community. Read at runtime on the server only — deliberately not `NEXT_PUBLIC_`. `SUPABASE_ANON_KEY` is accepted as a fallback name |
| `CATALOG_SOURCE` | `supabase` reads the catalog from `next_step.institutions`; anything else uses the bundled seed |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for the legacy `/admin` JSON editor's writes. Not needed for anything else; the app never uses it for user data |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Basic-auth credentials for `/admin`; if unset, the admin area does not exist |

## Database setup (optional)

All tables live in the `next_step` schema (the deployed project shares a Supabase project with another app, so nothing is created in `public`).

1. Apply the files in `supabase/migrations/` in order. They create the tables, row-level security, column grants, rate-limit and counter triggers, and RPCs (`ensure_profile`, `search_questions`, moderation helpers).
2. Load `supabase/seed.sql` (catalog) and, optionally, `supabase/registry-entries.sql` (registry imports; re-running keeps reviewers' decisions).
3. In the Supabase dashboard:
   - **API → Exposed schemas**: add `next_step`. (On the deployed project this was done in SQL on 22 October 2026: `alter role authenticator set pgrst.db_schemas = 'public, graphql_public, next_step'`; revert with `reset pgrst.db_schemas`. If someone later edits the list in the dashboard, check `next_step` is still there.)
   - **Authentication → URL configuration → Redirect URLs**: add `https://<your-site>/**`. Do not change the Site URL if the project serves another app.
4. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Add `CATALOG_SOURCE=supabase` only after step 3 is done.

How access is enforced: every query runs on the server with the signed-in user's JWT (cookies refreshed in middleware). There is no service-role key in the request path, so the database is the authority — users read and change only their own saved items, steps and notifications; roles, verification flags and counters cannot be written by users (column grants + triggers); client-supplied user ids are never trusted.

Roles (`member`, `representative`, `moderator`, `admin`) are assigned in SQL by a project owner, for example:

```sql
update next_step.profiles set role = 'moderator' where id = '<auth user id>';
update next_step.profiles set role = 'representative', represented_institution_id = 'hesder-hakotel' where id = '<auth user id>';
```

Notes for a shared project: auth users are shared, so the other app's `on_auth_user_created` trigger also runs for NEXT STEP sign-ups (and vice versa a NEXT STEP profile is created lazily by `ensure_profile`). Supabase's built-in email sender is rate-limited to a few emails per hour; configure custom SMTP before real use.

## Architecture

```
src/
  lib/domain/        types.ts (Zod schema for institutions), pathways.ts (neutral pathway copy + labels)
  data/              institutions.ts — the curated, sourced seed catalog
  lib/data/          repository.ts — Seed and Supabase implementations of InstitutionRepository
  lib/questionnaire/ questions.ts — questions, options, conditional visibility, pruning
  lib/matching/      config.ts (weights, thresholds), engine.ts (scoring, constraints, explanations)
  lib/plan/          actionPlan.ts — deterministic personal action plan
  lib/ai/            explain.ts — optional grounded summaries with structured output + fallback
  lib/client/        store.ts — localStorage-backed state (answers, progress, favorites, compare)
  components/        site, questionnaire, results, institution, compare, admin, art
  lib/supabase/      server client, config, middleware session refresh, error → Hebrew message mapping
  lib/auth/          getViewer() (anonymous / signed in / not configured), safe redirects
  lib/community/     labels, Zod schemas, queries
  lib/ai/            retrieval.ts + assistant.ts — retrieval over catalog and community, cited answers only
  lib/registry/      match.ts — conservative matching of registry entries to catalog records
  app/               routes: / /questionnaire /results /institutions /institutions/[slug] /compare /plan
                     /login /auth/callback /account /saved /my-path /community /community/ask
                     /community/[id] /moderation /registry-review /assistant /about /privacy /admin
                     /api/explain /api/assistant /api/admin/institutions
supabase/migrations/ schema, RLS, triggers and indexes for `next_step`
data/registry/       registry snapshots with source URL and retrieval date
e2e-supabase/        database-backed end-to-end tests
```

The catalog is separate from the engine: pages load records through the repository and pass plain objects into `match()`. Matching runs **in the browser**, so questionnaire answers never reach the server unless the user opts into the AI summary.

## The recommendation algorithm

Each institution has structured attributes: pathway, Torah-study intensity (0–4), military model (direct service, hesder, shiluv, pre-military, individually arranged, unknown), Torah/service balance, religious environments, development focus, service interests, environment and learning styles, strengths, region(s), residential arrangement, duration, community size and audience.

1. **Signals.** Each answered question produces a signal in [0, 1] for each institution, plus optional "reason" and "concern" text tied to the user's own answer.
2. **Components.** Signals are averaged (weighted) into seven components. Default weights live in `src/lib/matching/config.ts` and can be changed there:
   pathway 25 · education/religious 20 · development 15 · military/service 15 · location & living 10 · social 10 · practical 5.
3. **Missing answers are neutral.** An unanswered question produces no signal. A component with no signals is removed from both numerator and denominator, so skipping never lowers a score. Neutral answers ("no preference", "anywhere", "not sure") are treated the same way. Coverage (share of weight answered) is reported, and low coverage shows a notice.
4. **Hard constraints** are used only for audience: if the user asks for men's or women's frameworks and a record's audience is known to be the other, it is excluded (and listed in `excluded`). Unknown audience never excludes; it is flagged instead. No pathway is excluded because the user didn't pick it — it is ranked lower.
5. **Score.** Weighted mean × 100, labelled everywhere as "ציון התאמה להעדפות שציינת" — a compatibility score from stated preferences, not a probability. Verification status and amount of content do **not** affect the score.
6. **Selection.** Options scoring ≥ 55 are eligible. Up to three are picked greedily; when the user is open to more than one pathway, each already-chosen option from the same pathway costs 7 points, which favours variety without forcing it. If fewer than three qualify, fewer are shown with an explanation — no padding.
7. **Explanations.** Reasons are ranked by their actual contribution to the score (generic "you picked this pathway" reasons are ranked last). Each card shows three reasons, highlights, concerns, "what to verify" (per pathway) and "what is still unknown" (missing website, contact, costs, admissions, audience, partial verification), plus a per-component breakdown.

Unpublished or `unverified` records are filtered out before scoring and are never shown.

## AI integration (optional)

- `/api/explain` is server-only and returns `{ available: false }` without a key; the UI then hides the panel entirely.
- The user must tick a consent box that explains exactly what is sent (answers, including free text, and the recommended institutions' catalog facts) and to whom.
- The model receives the engine's chosen institutions and their catalog facts and reasons; it cannot pick or add institutions. Output is constrained with a JSON schema, re-validated with Zod, and filtered to the requested ids. Any failure, refusal or timeout returns `null` and the deterministic text stands on its own.
- Server-side fallback on refusals is enabled (`fallbacks: "default"`), with a simple per-instance rate limit.
- `/api/assistant` (page `/assistant`) answers free-text questions only from retrieved sources: pathway overviews, catalog records and answered community threads, each with a trust label. An answer is accepted only if it cites at least one retrieved source; unknown citation markers are removed, and the model is told to say when the sources don't cover the question. Without a key it returns 503 and the page says the assistant is unavailable. Source text is not sent back to the browser, only titles and links.

## Institution data — what is verified

All records were checked on **21 October 2026**. "Verified" means the facts were read on the institution's official site or a government page; "partial" means existence and basic facts come from an encyclopedic source and the official site could not be opened, so no website link is shown. Costs, schedules and admission requirements appear only when a source states them; elsewhere the UI shows "המידע עדיין לא אומת".

| Record | Pathway | Status | Main source |
| --- | --- | --- | --- |
| שירות סדיר — מסלולי לחימה | צה״ל (track) | verified | idf.il |
| שירות סדיר — טכנולוגיה, מודיעין וסייבר | צה״ל (track) | verified | idf.il |
| שירות סדיר — חינוך, אנשים וקהילה | צה״ל (track) | verified | idf.il |
| מסלול גרעיני מדרשות | צה״ל (track, women) | verified | noar.mod.gov.il |
| עין פרת — כפר אדומים | מכינה | verified | ein-prat.com |
| מכינת עוצם | מכינה | verified | otzem.org.il |
| קשת יהודה | מכינה | partial (English-program site only) | idfprep.org |
| בני דוד, עלי | מכינה | partial | Wikipedia |
| מכינת רבין | מכינה | partial | Wikipedia |
| ישיבת הר עציון | הסדר | verified | etzion.org.il |
| ישיבת הכותל | הסדר | verified | hakotel.org.il |
| ישיבת ההסדר עתניאל | הסדר | verified | otniel.org |
| ישיבת ההסדר שדרות | הסדר | verified | sderot.org |
| ישיבת שעלבים | הסדר | verified | yeshivatshaalvim.org |
| ישיבת הר ברכה | הסדר | verified | en.yhb.org.il |
| ישיבת ההסדר ירוחם | הסדר | partial | Wikipedia |
| ישיבת ברכת משה, מעלה אדומים | הסדר | partial | Wikipedia |
| ישיבת מאיר הראל, מודיעין | הסדר | partial | Wikipedia |
| ישיבת מעלה גלבוע (שילוב) | הסדר | partial | Wikipedia |
| ישיבת מרכז הרב | ישיבה גבוהה | verified | mercazharav.org.il |
| ישיבת הר המור | ישיבה גבוהה | verified | harhamor.co.il |
| ישיבת בית אל | ישיבה גבוהה | partial | Wikipedia |
| מכינת נחשון | מכינה | **unverified — unpublished** | — |

The IDF records describe general service directions, not units, and every IDF card states that placement depends on official requirements, medical eligibility, assessments and available positions.

The matching attributes (e.g. Torah intensity, environment styles) are an editorial classification made from the sources, and the UI labels them that way. They should be reviewed with each institution.

## Privacy

- Questionnaire answers and progress live only in `localStorage`, and matching runs in the browser. `/privacy` explains what is stored and has a one-click delete for device data.
- Accounts are optional (email link, no password). With an account the server stores the email, an optional display name, saved institutions and notes, pathway-map steps, community posts, helpful marks, reports and notifications. Private data is protected by RLS; community posts are public.
- The assistant sends the question and the retrieved source snippets to Anthropic; no account data is sent. AI summaries on the results page are sent only after explicit consent.
- No ID numbers, medical or military-profile questions. No analytics.

## Tests

Latest run, 22 October 2026 (journey milestone):

- `npm test` with `TEST_DATABASE_URL` — **104 passed** (Vitest): matching engine, catalog integrity, questionnaire, action plan, repositories, middleware, Hebrew search normalization, error mapping, safe redirects, community schemas, assistant retrieval and citation checks, registry matching, and 13 RLS tests run against real Postgres 16 with the migrations applied. Without `TEST_DATABASE_URL` the 13 RLS tests are skipped.
- `npm run test:e2e` — **60 passed** (Playwright, desktop + mobile, no database): journeys, search, RTL, keyboard, empty states, unconfigured account/assistant states, admin hidden, no horizontal overflow.
- `npm run test:e2e:db` — **13 passed** (last run 21 October; not re-run for the journey milestone) (Playwright against Postgres + PostgREST): sign-in link and callback, profile creation, saving and privacy between users, device → account import, pathway map, community ask/answer/labels/helpful/notifications, reports and moderation, database rate limit, assistant unavailable without key, admin-only registry review.
- `npm run typecheck`, `npm run lint`, `npm run build` — clean.

## Implementation status

This section is the single source of truth for what works. Last updated 22 October 2026.

### Implemented and tested

| Area | Evidence |
| --- | --- |
| Questionnaire, matching engine, pathway ranking, recommendations, profiles, compare, action plan | Vitest engine/plan tests; Playwright `e2e/journey.spec.ts` |
| Institution search (Hebrew normalization, filters in the URL, empty state) | Vitest `src/lib/search`; Playwright |
| Email-link sign-in, callback, sign-out, profile and display name | `e2e-supabase/platform.spec.ts` |
| Saving to the account, notes, device → account import; private per user | `e2e-supabase`; RLS tests |
| Personal pathway map (add, status, order, delete, import from plan) | `e2e-supabase`; RLS tests |
| `/journey`: route from questionnaire to placement (6 milestones from the user's own data), per-place stage tracker (interested → chosen, IDF tracks use call-up/screening/assignment), next action per place from catalog data only; on the device without an account, in `saved_institutions.stage` with one | Vitest `src/lib/journey`; Playwright `e2e/journey.spec.ts` (device mode); RLS test for the stage column. Account mode not yet exercised in `e2e-supabase` |
| App-style navigation (bottom tab bar on phones, "המסע שלי" in the header) and a home page that shows the real journey state | Playwright overflow + home tests |
| Community: questions, answers, labels (official / personal experience / AI / test), helpful marks, similar-question suggestions, notifications | `e2e-supabase` |
| Moderation: reports, hide/restore, moderator-only pages, database rate limits | `e2e-supabase`; RLS tests |
| Assistant: retrieval, citation enforcement, clear "unavailable" state without a key | Vitest `src/lib/ai/retrieval.test.ts`; Playwright both suites |
| Registry import (hesder association list), conservative matching, coverage report, admin-only review queue | Vitest `src/lib/registry`; `e2e-supabase` |
| Schema `next_step` applied to the Supabase project, catalog and registry loaded | Applied via Supabase migrations; row counts checked |
| Production build, typecheck, lint | clean |

### Implemented but not fully verified

- **Live Supabase from the deployed site**: the community page loads from the live database (checked 22 October), and the sign-in redirect URL was added by the owner. A full sign-in by email on the live site has not been confirmed yet.
- **Real email delivery** of sign-in links (the e2e gateway simulates it).
- **Assistant and AI summaries with a real key**: never called with `ANTHROPIC_API_KEY`, so answer quality is unverified.
- **Legacy `/admin` JSON editor with credentials** in a browser.
- **Hosted preview on Vercel**: a deployment is not production verification.

### Blocked by an external dependency

- Assistant and AI summaries need `ANTHROPIC_API_KEY`.
- Accounts on the live site need `next_step` exposed in the Supabase API settings and the site's redirect URL allowed.
- Mechina registry: mechinot.org.il could not be opened from the build environment.
- The 9 `partial` records need their official sites.
- A GitHub repository needs the owner's go-ahead.

### Not implemented

- Account deletion from the UI (rows cascade from `auth.users`, but there is no self-service button yet).
- Email notifications (notifications are in-app only).
- Verified-representative onboarding flow (roles are assigned in SQL).
- Shared rate limiting for the AI endpoints across instances (community limits are enforced in the database).
- Analytics (deliberately none).

### Data categories

| Category | Where | Shown to users? |
| --- | --- | --- |
| Verified | `verificationStatus: "verified"` (13), facts from official or government sites | Yes |
| Partial | `verificationStatus: "partial"` (9) | Yes, with a badge |
| Unverified | 1 record (Nachshon), `published: false` | Never |
| Registry entries | 62 hesder entries in `next_step.registry_entries`, not shown publicly; 6 matched, 8 for review, 48 not yet in the catalog | Admins only |
| Missing | Empty profile fields (costs, admissions, schedules) | Shown as "המידע עדיין לא אומת" |
| User-generated | Device: answers, favorites, compare, plan. Account: saved items, steps, posts | Owner only, except community posts (public) |
| Test data | Users and posts in the e2e database only, flagged `is_test` | Never in the live project |

National coverage is **not complete** — see `docs/coverage-report.md` for scope, sources, matching rules and gaps. This is not production-ready.

## Known limitations and next steps

- Add the 48 hesder yeshivot that are on the association's list but not in the catalog, each verified from its own source; the association lists 62 while the Ministry of Defense cites 77.
- Load a mechina registry when the Council of Mechinot directory can be reached; there is no authoritative list for higher yeshivot.
- Costs, admissions and daily schedules are mostly unverified and should be collected directly from institutions.
- Hebrew microcopy uses the masculine second person; a gender-neutral or user-selectable form is worth adding.
- Real photography (licensed) can replace the SVG landscapes.
