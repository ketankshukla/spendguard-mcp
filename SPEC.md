# SPEC - spendguard-mcp

> What this repo is for, what it deliberately does not do, and what must stay
> true for a change to be correct.

**Production-shaped MCP application** - **Live:** https://spendguard-mcp-web.vercel.app

## 1. Purpose

Show what the MCP series' ideas look like assembled into a product rather than a
lesson: investigate a cloud-spend anomaly, draft a savings action, obtain
**independent** approval, execute through a safe provider, survive retries and
restarts, and emit an authoritative receipt plus operational evidence.

## 2. Scope

**In scope** - a pnpm/Turborepo monorepo; a Next.js product surface carrying the
MCP transport and the AI host; an independently deployable Python MCP risk-scoring
service; shared packages for domain, contracts, database, auth, policy, MCP
server/host and registry; ADRs, runbooks and a running worklog beside the code.

**Explicitly out of scope**

- **Spending real money or mutating a real cloud account.** The default provider
  is simulated and deterministic. This is a hard boundary, not a default.
- **Real customer data or a live cloud credential.** The public deployment
  requires neither.
- **Being a FinOps product.** It is production-*shaped*, not production-deployed.

## 3. Architecture

```
apps/web              Next.js App Router - marketing, product UI, MCP transport, AI host
services/risk-engine  Python MCP server - proposal scoring, simulation
packages/             domain - contracts - db - auth - policy - mcp-server - mcp-host - registry - config
docs/                 implementation-plan.md - worklog.md - ADRs - runbooks
scenario-packs/       the anomaly scenarios the demo runs against
```

Two languages on purpose: the risk engine is Python and independently
deployable, so the boundary between the web product and the scoring service is a
real network contract rather than a function call.

## 4. Invariants

1. **The provider is deterministic and simulated.** The full approval and
   execution path is exercised without a side effect that could not be undone.
2. **Approval is independent of the actor proposing the action.** A single
   identity must not be able to both draft and approve.
3. **Execution survives retries and restarts** and produces one authoritative
   receipt, not a log line.
4. **Contracts are shared packages**, so the web product and the Python service
   cannot drift silently.
5. **One task graph across the workspace** - lint, typecheck, test and build run
   the same way everywhere.

## 5. Verification

CI runs lint, typecheck, test and build across the workspace. `docs/` carries the
implementation plan, architecture decision records and runbooks; the worklog
records what was done and why alongside the code.

## 6. Known limitations

- **Simulated provider.** A real cloud adapter is unwritten, and writing one is
  where the genuinely hard problems (partial failure, eventual consistency,
  provider rate limits) begin.
- **Scenario packs are synthetic**, chosen to exercise the paths rather than
  sampled from real spend data.
- **Monorepo overhead.** The layout is justified by two languages and a shared
  contract, and would be over-engineering for a single application.

## 7. Related

- Blog: <https://ketanshukla.dev/blog/topics/mcp>
- The series it grew out of: [`mcp-five`](https://github.com/ketankshukla/mcp-five)
