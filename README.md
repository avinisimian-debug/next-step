# NEXT STEP — הצעד הבא שלך

A Hebrew-first, RTL web app that helps Jewish Israeli students in grades 11–12 (and recent graduates) explore four post-high-school pathways — **IDF service, pre-military academies (mechinot), hesder yeshivot and higher yeshivot** — and get up to three explainable recommendations from a catalog of verified institutions.

Core flow: landing page → adaptive questionnaire → review answers → pathway-level fit → up to 3 institution recommendations → institution profiles → side-by-side comparison → personal action plan (with official links and contact details).

## Stack

- **Next.js 15 (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** with design tokens in `src/app/globals.css`
- **Zod** for the domain schema, API input and AI output validation
- **Heebo** (body) and **Frank Ruhl Libre** (display) self-hosted through `@fontsource` — no request to Google from the visitor's browser
- **lucide-react** icons; original SVG landscapes instead of stock photography
- **Vitest** (matching engine) and **Playwright** (user journeys, desktop + mobile)
- Optional: **Anthropic API** (`@anthropic-ai/sdk`) for consent-gated summaries; **Supabase** (PostgREST over `fetch`) for the catalog

## Running locally

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are required. Without them the app uses the bundled seed catalog and the deterministic engine, the AI panel is hidden, and `/admin` returns 404.

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # Vitest — matching engine, catalog integrity, questionnaire logic
npm run build && npm run test:e2e   # Playwright — starts `next start` on port 3100
npm run seed:sql > supabase/seed.sql   # SQL that loads the seed catalog into Supabase
```

Playwright uses the Chromium it ships with (`npx playwright install chromium` on a fresh machine).

## Environment variables

See `.env.example`. All optional.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL for metadata |
| `ANTHROPIC_API_KEY` | Enables opt-in AI summaries on the results page (server-side only) |
| `ANTHROPIC_MODEL` | Model override; default `claude-opus-5-5` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Read the catalog from Supabase instead of the seed file |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin listing of drafts and saving records (server-side only) |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Basic-auth credentials for `/admin`; if unset, the admin area does not exist |

## Database setup (optional)

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor. It creates `public.institutions` with row-level security: anonymous reads only see rows that are published and not `unverified`; there are no write policies (writes use the service-role key on the server).
2. Load the catalog: `npm run seed:sql > supabase/seed.sql`, then run that file.
3. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for admin) and restart.

Each row stores the full record in a `data` jsonb column, validated against `institutionSchema` on every read and write, so the schema lives in one place (`src/lib/domain/types.ts`).

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
  app/               routes: / /questionnaire /results /institutions /institutions/[slug]
                     /compare /plan /about /privacy /admin /api/explain /api/admin/institutions
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

- Answers, progress, favorites, comparison picks and AI consent live only in `localStorage`; `/privacy` has a one-click delete.
- No account, no ID numbers, no medical or military-profile questions; religious-environment questions are optional.
- No analytics are included.

## Tests

- `npm test` — 48 Vitest tests. Engine (26): schema validity and uniqueness of the catalog, distinct profiles (Torah + service, combat, intensive Torah, mixed mechina, technology) getting distinct and sensible results, determinism, neutral handling of missing answers, audience constraints, no padding, variety, explanation presence, low-confidence flag, conditional questions and answer pruning. Plus pathway ranking and the action plan (10), Seed and Supabase repositories with mocked `fetch` (8) and the admin middleware (4).
- `npm run test:e2e` — 19 Playwright tests × desktop and mobile (38 runs), including pathway overview and action plan persistence: Hebrew/RTL, full journey with conditional questions, summary editing, results, details panel, profile, compare; back navigation; resume after reload and restart; required-question gating and exclusive options; keyboard-only answering and focus management; empty states; AI endpoint without a key; admin hidden without credentials; unverified record unreachable; official links labelled and opening safely; no horizontal overflow on key pages.

## Implementation status

This section is the single source of truth for what works. Last updated 21 October 2026.

### Implemented and tested

| Area | Evidence |
| --- | --- |
| Homepage, adaptive questionnaire (conditional follow-ups, back, skip, summary editing, resume after reload) | Playwright `e2e/journey.spec.ts`, desktop + mobile |
| Matching engine: weights, neutral missing answers, audience-only hard constraint, no padding, variety, explanations | Vitest `src/lib/matching/engine.test.ts` (26 tests) |
| Pathway-level recommendations (all four pathways ranked before institutions) | Vitest `src/lib/plan/actionPlan.test.ts`; Playwright full journey |
| Institution profiles, comparison (mobile cards, desktop table) | Playwright full journey, overflow checks |
| Personal action plan (`/plan`): steps from recommendations and answers, sourced deadlines only, check-offs saved in the browser, print | Vitest `actionPlan.test.ts`; Playwright journey (check, reload, still checked) and empty state |
| Persistence: answers, progress, favorites, compare picks, plan check-offs in `localStorage`; one-click delete on `/privacy` | Playwright resume/restart tests |
| Data integrity: schema validation, unique ids/slugs, unpublished and `unverified` records never shown | Vitest catalog tests, `src/lib/data/repository.test.ts`; Playwright 404 for unverified slug |
| Admin authorization (Basic auth; 404 when not configured, 401 on wrong credentials, pass on correct) | Vitest `src/middleware.test.ts`; Playwright (not configured → 404) |
| AI endpoint without a key returns `available: false`, UI hides the panel | Playwright |
| Accessibility basics: Hebrew/RTL, skip link, keyboard answering, focus moves to each question, labelled external links, loading text with `role="status"` | Playwright |
| Production build, typecheck, lint | `npm run build`, `npm run typecheck`, `npm run lint` |

### Implemented but not fully verified

- **Supabase repository**: request shape, filtering, validation and service-key rules are unit-tested with a mocked `fetch`; never run against a live Supabase project.
- **AI summaries**: consent gate, grounding, schema validation and fallback are implemented; never called with a real API key, so output quality is unverified.
- **Admin editing with credentials end to end**: middleware is unit-tested; the editor UI and save route have not been exercised in a browser with credentials set.
- **Route error boundary** (`src/app/error.tsx`): added, not triggered in a test.
- **Hosted preview on Vercel**: deployed from this code without environment variables (seed catalog, no AI, no admin). A deployment is not production verification.

### Blocked by an external dependency

- AI summaries need `ANTHROPIC_API_KEY`.
- Live database needs a Supabase project and keys.
- The 9 `partial` records need their official sites, which could not be opened from the build environment.
- A GitHub repository needs the owner's go-ahead.

### Not implemented

- User accounts, server-side saving of answers or plans, sharing a plan by link.
- Analytics (deliberately none).
- Form-based admin editor and an audit log of verification changes.
- Gender-neutral or user-selectable Hebrew microcopy.
- Shared (multi-instance) rate limiting for the AI endpoint.

### Data categories

| Category | Where | Shown to users? |
| --- | --- | --- |
| Verified | Records with `verificationStatus: "verified"` (13), facts read on official or government sites | Yes |
| Partial | `verificationStatus: "partial"` (9), existence and basics from an encyclopedic source; no website shown | Yes, with a badge |
| Unverified | `verificationStatus: "unverified"` (1, Nachshon), also `published: false` | Never |
| Missing | Empty profile fields (costs, admissions, schedules) | Shown as "המידע עדיין לא אומת" |
| User-generated | Answers, favorites, compare picks, plan check-offs | Only in the user's own browser |
| Development-only sample data | None in the catalog | — |

This is not production-ready: the AI and database paths and admin editing have not been verified end to end, and the catalog still has partial records.

## Known limitations and next steps

- The catalog is intentionally small (22 published records). Next: verify more institutions from official sites (e.g. via the Council of Mechinot directory and the Hesder Yeshivot association), and confirm the partial records directly.
- Matching attributes are editorial; ideally each institution confirms them through the admin flow.
- Costs, admissions and daily schedules are mostly unverified and should be collected directly from institutions.
- Hebrew microcopy uses the masculine second person, following the brief; a gender-neutral or user-selectable form is worth adding.
- The admin area is a JSON editor with schema validation; a form-based editor and an audit log of verification changes would be the next step. Seed mode is read-only.
- The AI rate limit is per server instance; use a shared store in production.
- Real photography (licensed) can replace the SVG landscapes in `src/components/art/Landscape.tsx`.
