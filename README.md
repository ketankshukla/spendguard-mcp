# SpendGuard AI

A production-shaped MCP portfolio application. SpendGuard AI helps a FinOps team investigate cloud-spend
anomalies, draft a savings action, obtain independent approval, execute it through a safe simulated provider,
survive retries and restarts, and produce an authoritative receipt plus operational evidence.

The default provider is **simulated and deterministic**. This public portfolio never spends money, mutates a
real cloud account, exposes customer data, or requires a real cloud credential.

## Live

- **GitHub**: https://github.com/ketankshukla/spendguard-mcp
- **Production**: https://spendguard-mcp-web.vercel.app/

## Monorepo Layout

```
apps/web           Next.js App Router product (marketing + product UI, MCP transport, AI host)
services/risk-engine  Independently deployable Python MCP server (proposal scoring, simulation)
packages/           domain, contracts, db, auth, policy, mcp-server, mcp-host, registry, config, ...
docs/               implementation-plan.md, worklog.md, ADRs, runbooks
```

## Local Development

```bash
pnpm install
pnpm turbo lint typecheck test build
pnpm --filter web dev
```

Requires Node.js >= 20, pnpm (via Corepack or `npm install -g pnpm`), and — for the Python risk service —
Python 3.14 and `uv`.

## Status

See `docs/implementation-plan.md` for phase-by-phase status and `docs/worklog.md` for a running log of
decisions, commands, and results.
