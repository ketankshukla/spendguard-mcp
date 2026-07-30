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
