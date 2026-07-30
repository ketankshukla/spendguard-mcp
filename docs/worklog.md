# SpendGuard AI — Worklog

## 2026-07-30 — Phase 01: Prepare workstation

**Decisions / commands run:**
- Verified existing tools before installing anything: `node --version` (v24.18.0), `npm --version` (11.16.0), `git --version` (2.55.0.windows.3), `python --version` (3.14.6), `uv --version` (0.11.32). All already present and meet/exceed policy.
- `pnpm` was missing. Attempted `corepack enable; corepack prepare pnpm@latest --activate` — failed with `EPERM: operation not permitted, open 'C:\Program Files\nodejs\yarn'` (no admin rights to write Node install directory shims).
- Fell back to `npm install -g pnpm`, resolved pnpm 11.18.0.
- Configured global git identity: `user.name = Ketan Shukla`, `user.email = ketankshukla@gmail.com` (provided by user; no prior global gitconfig existed on this machine).
- Created project root `E:\mastering-a-skill\spendguard-mcp` (left `e:\spend-guard`, containing only the master prompt, intact).
- Wrote `docs/workstation-check.md`, `.tool-versions.md`, `.gitignore`.
- `git init`, `git add .`, `git commit -m "chore: document reproducible workstation"` — succeeded (root commit `bd1532c`).

**Deviations:**
- Corepack-based pnpm activation failed due to lack of admin rights on this Windows machine; used npm global install instead. This is functionally equivalent for reproducibility purposes since `pnpm-lock.yaml` is the machine-checked version proof.

**Result:** Phase 01 acceptance checks pass. Proceeding to Phase 02.

**Remaining risks:** None blocking. Admin rights are unavailable in this shell; any future step requiring elevated install (e.g. Docker Desktop) will need manual user action.

## 2026-07-30 — Phase 02: Monorepo + first deployed shell

**Decisions / commands run:**
- Scaffolded `apps/web` with `pnpm create next-app@latest` (TypeScript, Tailwind, ESLint, App Router, `src/` dir, `@/*` alias). Next.js resolved to 16.2.12, React 19.2.4.
- `pnpm approve-builds --all` used to non-interactively approve native postinstall scripts (`sharp`, `unrs-resolver`) — the interactive `pnpm approve-builds` prompt cannot be driven through the automation shell.
- Created workspace root: `pnpm-workspace.yaml` (packages glob + `onlyBuiltDependencies`), root `package.json` with Turborepo, `turbo.json` pipeline (`build`, `dev`, `lint`, `typecheck`, `test`).
- Added `packages/config` (shared `tsconfig.base.json`).
- Added `.github/pull_request_template.md`.
- Restructured `apps/web/src/app` into a `(marketing)` route group: home, `/architecture`, `/demo`, `/evidence` pages plus a shared nav layout, branded for SpendGuard AI. Updated root `layout.tsx` metadata.
- Fixed a race condition where `typecheck` ran before Next.js generated typed-route validators for the new pages by adding `"typecheck": { "dependsOn": ["^typecheck", "build"] }` in `turbo.json`.
- Removed a stray `apps/web/pnpm-lock.yaml` and `apps/web/pnpm-workspace.yaml` left over from the initial non-workspace install.
- `pnpm turbo lint typecheck build` — all pass (3/3 tasks). `pnpm --filter web dev` verified locally in browser preview with no console errors.
- `git commit -m "chore: document reproducible workstation"` then `git commit -m "feat: deploy SpendGuard product shell"`.
- User created GitHub repo `ketankshukla/spendguard-mcp`; pushed with `git remote add origin ...; git branch -M main; git push -u origin main` (browser device-auth flow). Succeeded.
- User connected the repo to Vercel and deployed. Production URL confirmed by user: https://spendguard-mcp-web.vercel.app/

**Deviations:**
- Used `npm install -g pnpm` in Phase 01 due to Corepack `EPERM` (recorded there).
- `pnpm approve-builds --all` (non-interactive flag) used instead of the interactive prompt shown in official docs, since this automation shell cannot answer interactive TUI prompts.

**Result:** Phase 02 acceptance checks pass — local build/lint/typecheck clean, GitHub push succeeded, Vercel production URL live and confirmed by the user. Preview-PR loop (open PR → verify preview → merge → verify production) not yet exercised; will be exercised naturally on the next PR.

**Remaining risks:** Preview-deployment-specific verification (unique PR URL) has not yet been demonstrated since the first push went directly to `main`. Should be verified on the next feature branch/PR.

## 2026-07-30 — Phase 03: Deterministic FinOps domain slice

**Decisions / commands run:**
- Created `packages/domain` (pure TypeScript, no framework/DB/MCP imports): `src/entities.ts` (branded opaque IDs; `Money` as integer minor units + ISO currency; `UtcInstant`/`ReportingPeriod` as explicit ISO strings; `Tenant`, `CostCenter`, `SpendRecord`, `Anomaly`, `SavingsProposal`, `Approval`, `Execution`, `Receipt`) and `src/services.ts` (`summarizeSpendByCostCenter`, `summarizeSpendTrend`, `totalSpend`, `detectSpendAnomalies` using a trailing-average baseline with configurable spike/discount thresholds and data-quality-gap detection, `draftSavingsProposal`, `canTransitionProposal`/`transitionProposal` state machine).
- Created `packages/contracts` with Zod 4 (`zod@^4.4.3`, current stable, confirmed via `npm view zod version`) schemas for `Money`, `Anomaly`, `SavingsProposal`, MCP tool input/output envelopes (`contractVersion` + `traceId`), and a structured `ErrorEnvelopeSchema` with the required error categories.
- Wrote `scenario-packs/seed/demo-corp.json`: Demo Corp tenant, 4 cost centers, ~46 monthly spend records (2025-02 through 2026-01) with three deliberate anomalies — a compute spike (~+83%), a storage sustained discount opportunity (~-28%), and a data-platform data-quality gap (missing 2025-10) — plus a networking blip that stays under threshold to prove the detector doesn't over-fire.
- Added `pnpm --filter @spendguard/domain test` (14 vitest cases: aggregation, zero-spend, trend sort, spike/discount/gap detection, determinism, proposal drafting incl. rejection for data-quality-gap anomalies, and the full state-transition matrix incl. terminal-state rejection) and `pnpm --filter @spendguard/contracts test` (8 vitest cases covering money integer/currency validation and contract envelope requirements).
- Built the read-only dashboard at `apps/web/src/app/(marketing)/demo` (kept in the existing `(marketing)` route group rather than a separate `(product)` group, since there is no authenticated product yet — Phase 05 will introduce `(product)` when real auth exists) plus a dynamic anomaly detail route at `demo/anomalies/[anomalyId]`. Data loads via `apps/web/src/lib/data/demo-fixture.ts`, which imports the JSON fixture directly and derives every value through the pure domain functions — no fixture number is hard-coded in the UI.
- Fixed a Turbopack resolution issue: internal relative imports in `packages/domain`/`packages/contracts` using explicit `.js` extensions (valid for Node ESM) were not resolved by Next's Turbopack bundler against sibling `.ts` files, causing "module has no exports" build errors. Switched to extensionless relative imports, which resolve correctly under `moduleResolution: "bundler"`.
- Fixed a Server/Client Component boundary error: `formatUsd` was defined in a `"use client"` chart module and called directly from a Server Component. Extracted it to a plain `apps/web/src/lib/format.ts` module.
- `pnpm turbo lint typecheck test build` — all 6 tasks pass across `@spendguard/domain`, `@spendguard/contracts`, and `web`.

**Deviations:**
- Dashboard placed under `(marketing)/demo` instead of `(product)/demo` per the target repo shape, since `(product)` implies authenticated routes that don't exist until Phase 05. Will migrate when identity lands.
- Used a dependency-free hand-rolled bar chart (`SpendTrendChart`) instead of Recharts for this phase, to keep the checkpoint minimal; Recharts/shadcn can be introduced later if richer visualization is needed.

**Result:** Phase 03 acceptance checks pass — every displayed number is recomputed from the fixture, detection is deterministic (tested), the domain package has zero framework imports, and boundary cases (zero spend, missing month, negative adjustment) are covered by tests.

**Remaining risks:** None blocking for this phase. Not yet pushed to GitHub/Vercel as of this log entry — planned as the next commit.

## 2026-07-30 — Phase 04: Neon Postgres + Drizzle (scaffolding)

**Decisions / commands run:**
- Created `packages/db` with `drizzle-orm@^0.45.2`, `postgres@^3.4.9`, `drizzle-kit@^0.31.10`, `tsx@^4.23.1` (versions confirmed current via `npm view`).
- Wrote `src/schema.ts`: `tenants`, `memberships`, `cost_centers`, `spend_records`, `anomalies`, `savings_proposals`, `approvals`, `executions`, `receipts`, `durable_tasks`, `audit_events` — 11 tables. Every tenant-owned table carries a `tenant_id` column with a foreign key to `tenants` and a compound unique constraint scoped to the tenant (e.g. `spend_records_tenant_cc_period_unique` on `(tenant_id, cost_center_id, period)`), so no query can silently cross tenants.
- Wrote `src/client.ts` (lazy pooled Postgres connection via `postgres-js`, reads `DATABASE_URL` at call time not module load), `src/migrate.ts`, `src/seed.ts` (idempotent — upserts via `onConflictDoUpdate` keyed on primary id, safe to run repeatedly, loads `scenario-packs/seed/demo-corp.json`), and tenant-scoped repository adapters in `src/repositories/` (`tenants.ts`, `cost-centers.ts`, `spend-records.ts`) that map DB rows to the `@spendguard/domain` entity types.
- Generated the initial migration with `drizzle-kit generate` (using a placeholder `DATABASE_URL` — generation is schema-only and needs no live connection): `packages/db/drizzle/0000_dizzy_molly_hayes.sql`, committed alongside its `meta/` snapshot/journal.
- Added `packages/db/tests/schema.test.ts` (3 vitest cases asserting the tenancy invariants: every tenant-owned table has `tenant_id`, and `spend_records` has a tenant-scoped compound unique constraint) — passes without a live database, since it only inspects Drizzle's static table config.
- Fixed a module-resolution mismatch: initially set `packages/db/tsconfig.json` to `module`/`moduleResolution: "NodeNext"` (which requires explicit `.js` extensions on relative imports), but this conflicted with `tsc`'s single-program resolution mode when type-checking `@spendguard/domain`'s extensionless imports transitively. Reverted `packages/db` to the same `bundler` resolution as the rest of the repo and switched its own relative imports to extensionless, for consistency.
- `pnpm --filter @spendguard/db typecheck` and `test` pass; `pnpm turbo lint typecheck test build` passes across all 5 packages (`@spendguard/config`, `@spendguard/contracts`, `@spendguard/db`, `@spendguard/domain`, `web`).
- Walked the user through adding the Neon integration via the Vercel Marketplace (Storage tab → Connect Database → Neon → link to `spendguard-mcp-web`, both Production and Preview environments) — not yet completed as of this entry.

**Deviations:**
- `db:migrate` and `db:seed` have not yet been run against a live database — no Neon connection exists yet. They are implemented and typecheck cleanly; execution is pending Phase 04 external-account step.

**Result:** Phase 04 scaffolding acceptance checks pass (schema, migrations generate cleanly, tenancy invariants hold, tests pass). Live migration/seed against Neon and preview/production environment isolation are pending the Neon integration.

**Remaining risks:** Once Neon is connected, need to confirm the exact env var name(s) Vercel/Neon inject (commonly `DATABASE_URL` or `POSTGRES_URL`) and ensure `packages/db` reads the correct one; also need a preview-branch database per the "never use production connection string for local tests or preview resets" rule.

## 2026-07-30 — Phase 04: Neon Postgres + Drizzle (completed)

**Decisions / commands run:**
- User added the Neon integration via Vercel's Storage tab (Connect Database → Neon), linked to `spendguard-mcp-web` for Production + Preview. Vercel/Neon injected `DATABASE_URL` (pooled, matches what `packages/db` already expects) plus `DATABASE_URL_UNPOOLED`, `PG*`, and `POSTGRES_*` variants.
- Installed the Vercel CLI globally (`npm i -g vercel`), ran `vercel link` (interactive project-picker prompt could not be driven headlessly, so re-ran non-interactively as `vercel link --yes --project spendguard-mcp-web` from `apps/web`) and `vercel env pull .env.local` to fetch development env vars locally (creates `apps/web/.env.local`, auto-added to `.gitignore` by the CLI).
- Copied just the `DATABASE_URL` line into `packages/db/.env` (confirmed via `git check-ignore -v` that it's excluded from version control) and ran:
  - `pnpm --filter @spendguard/db db:migrate` → applied `0000_dizzy_molly_hayes.sql` to the live Neon database successfully.
  - `pnpm --filter @spendguard/db db:seed` → seeded 4 cost centers and 47 spend records for tenant "Demo Corp".
  - Ran `db:seed` a second time and verified via a temporary count script (`select count(*) from tenants/cost_centers/spend_records`) that row counts stayed at 1/4/47 — confirming the `onConflictDoUpdate` upsert is truly idempotent, no duplicates. Deleted the temporary script afterward.
- Wired the UI to the database: added `@spendguard/db` as a dependency of `apps/web`, rewrote `apps/web/src/lib/data/demo-fixture.ts` to call `getDb()`, `getTenant()`, `listCostCenters()`, `listSpendRecords()` instead of importing the static JSON fixture, and made `loadDemoCorpData()` async (all derived values — trend, aggregation, anomaly detection, proposal drafting — are still computed via the same pure `@spendguard/domain` functions, just fed live rows instead of fixture rows). Updated both the demo dashboard page and the anomaly-detail page to `await` the loader.
- `pnpm turbo lint typecheck test build` passes across all 5 packages; `next build` connected to the live Neon database via `apps/web/.env.local` during static generation of `/demo` and its anomaly-detail routes, and the dev server serves `/demo` with real seeded data (verified in browser preview).

**Deviations:** None beyond those already recorded (npm global pnpm install, non-interactive `pnpm approve-builds`/`vercel link`).

**Result:** Phase 04 acceptance checks pass — migration applies to a fresh(er) database cleanly, seed is idempotent (verified twice), and the `/demo` UI reads real repository-backed data instead of fixture memory. Preview-environment database isolation (separate Neon branch for PRs) is provided by Vercel's Neon integration by default (Preview environment linked separately) but not yet explicitly exercised with a PR.

**Remaining risks:** Have not yet opened a PR to confirm the Preview environment gets its own isolated Neon branch/connection rather than reusing production data — should verify on the next feature PR.
