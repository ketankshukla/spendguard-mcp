# SpendGuard AI — Implementation Plan

Tracks phases from the master build prompt, dependencies, risks, and acceptance checks. Updated as work progresses.

## Phase Status

| # | Phase | Status | Notes |
|---|---|---|---|
| 01 | Prepare workstation | Done | See `docs/workstation-check.md` |
| 02 | Monorepo + first deployed shell | Done | GitHub: https://github.com/ketankshukla/spendguard-mcp · Production: https://spendguard-mcp-web.vercel.app/ |
| 03 | Deterministic FinOps domain slice | Done | `packages/domain`, `packages/contracts`, seeded dashboard at `/demo` |
| 04 | Neon Postgres + Drizzle | Done | Neon connected via Vercel Marketplace; migrated + seeded (1 tenant, 4 cost centers, 47 spend records); `/demo` dashboard now reads live DB via `@spendguard/db` repositories |
| 05 | WorkOS AuthKit identity/roles | Pending | Requires WorkOS account |
| 06+ | MCP server, AI host, workflow, MCP App, Python risk service, registry, observability, assurance, release | Pending | See master prompt phases 6–18 |

## Dependencies & External Accounts Required

- **GitHub**: repository hosting, PR workflow, branch protection, Actions.
- **Vercel**: preview/production deploys for `apps/web` and the Python risk service.
- **Neon Postgres**: durable state (via Vercel Marketplace or standalone).
- **WorkOS**: AuthKit for human identity + MCP OAuth alignment.

These require human-provided credentials/authorization and cannot be provisioned autonomously. Work will proceed on all local, reversible phases and pause precisely at the external-account boundary in each phase.

## Risks

- **Package/API drift**: Prompt references package versions (mcp-handler 2, MCP Python SDK v2, Zod 4, AI SDK) that must be checked against current stable releases at implementation time; deviations will be recorded here and in `docs/worklog.md`.
- **External account gating**: Phases 2, 4, 5, and later deployment/registry phases require real accounts. Local scaffolding will be completed first; the actual account creation/connection step will be flagged to the user.
- **Scope size**: This is an 18-phase, production-shaped build. Progress will be made incrementally with a working checkpoint at the end of each phase.

## Acceptance Checks

Per-phase acceptance checks are defined in the master prompt (`SpendGuard-AI-Devin-Desktop-Master-Build-Prompt.md`, copied to `e:\spend-guard`). This plan will be updated with actual results as each phase completes.
