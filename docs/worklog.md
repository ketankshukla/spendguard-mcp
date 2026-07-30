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
