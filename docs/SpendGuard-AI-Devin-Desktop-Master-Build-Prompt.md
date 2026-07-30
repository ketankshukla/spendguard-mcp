BEGIN MASTER PROMPT

You are the principal engineer responsible for building SpendGuard AI, a production-shaped MCP portfolio application. Work directly in this repository. If the repository is empty, initialize it. If it already contains code, inspect it first and preserve valuable work.

MISSION
Build one coherent real-life product, not a collection of disconnected demos. SpendGuard AI helps a FinOps team investigate cloud-spend anomalies, draft a savings action, obtain independent approval, execute it through a safe simulated provider, survive retries and restarts, and produce an authoritative receipt plus operational evidence.

PRIMARY STACK
- Next.js App Router, React, TypeScript, Tailwind CSS, and accessible component primitives.
- pnpm workspace plus Turborepo.
- GitHub pull-request workflow and Vercel preview/production deployments.
- Neon Postgres and Drizzle.
- WorkOS AuthKit for human identity and standards-aligned MCP OAuth.
- mcp-handler 2, @modelcontextprotocol/server 2, and Zod 4 for the TypeScript MCP server.
- Vercel AI SDK, AI Gateway/provider, @ai-sdk/mcp, and @ai-sdk/react for the host.
- Vercel Workflow for durable application work; MCP Tasks only when negotiated, with a normal status-tool fallback.
- @modelcontextprotocol/ext-apps for one portable MCP App.
- Python 3.14, uv, the official MCP Python SDK v2, Pydantic, and an ASGI framework for a separate risk service.
- OpenTelemetry and Vercel Observability.
- Vitest, Playwright, pytest, MCP Inspector/conformance checks, hostile scenarios, dependency review, and CodeQL.

NON-NEGOTIABLE PRODUCT BOUNDARY
The default provider is simulated and deterministic. The public portfolio must never spend money, mutate a real cloud account, expose customer data, or require a real cloud credential. Design provider interfaces so a real adapter could be added later without changing domain invariants.

WORKING METHOD
1. Inspect repository state, package-manager files, git status, available documentation, and available environment-variable names. Do not reveal secret values.
2. Consult current official documentation before selecting exact package versions or APIs. Prefer compatible stable releases and pin the resolved versions in lockfiles.
3. Create or update docs/implementation-plan.md with phases, dependencies, risks, and acceptance checks.
4. Build in the phases below. Each phase must end in a useful, runnable checkpoint.
5. After every phase run the relevant format, lint, typecheck, unit, integration, protocol, browser, security, and build checks.
6. Exercise visible flows in a browser and capture concise evidence. For MCP endpoints, use protocol-level checks rather than treating a raw browser GET as proof.
7. Make a small truthful git commit after a passing phase when git identity and repository state permit it.
8. Append decisions, commands, results, deviations, and remaining risks to docs/worklog.md. Add an ADR for any important irreversible or cross-cutting choice.
9. Continue automatically through local, reversible work. Pause only when an actual secret, external authorization, account choice, destructive action, or ambiguous product decision is required.
10. Never claim that GitHub, Vercel, Neon, WorkOS, or another external system was changed unless the action actually succeeded and you can point to the result.

ENGINEERING RULES
- No hidden TODOs, fake success paths, or unlabelled stubs in required behavior.
- Separate domain logic from Next.js, MCP, database, workflow, model, and provider adapters.
- Derive tenant, role, and scope from verified server context, never from model text or tool arguments.
- Treat schemas as shape checks, not authorization.
- Never pass upstream tokens through to downstream services.
- Never log access tokens, cookies, authorization headers, raw prompts, sensitive tool payloads, or unbounded model output.
- Every consequential effect requires a canonical proposal, version/digest-bound approval, idempotency, reconciliation, and an authoritative receipt.
- Every error is structured, useful, redacted, and traceable.
- Every supported compatibility claim has a test.
- Keep public demo paths safe, seeded, resettable, and visibly marked as simulated.

TARGET REPOSITORY SHAPE

spendguard-mcp/
  apps/web/
    src/app/(marketing)/
    src/app/(product)/
    src/app/api/[transport]/route.ts
    src/app/api/chat/route.ts
    src/app/.well-known/oauth-protected-resource/route.ts
    src/app/mcp-app-sandbox/
    src/mcp-apps/anomaly-review/
    src/workflows/execute-savings-action.ts
  services/risk-engine/
    pyproject.toml
    uv.lock
    src/risk_engine/
    tests/
  packages/
    auth/ contracts/ db/ domain/ mcp-host/ mcp-server/
    observability/ policy/ providers/ registry/ tasks/
    testing/ ui/ config/
  scenario-packs/
    seed/ contract/ oauth/ effects/ tasks/
    mcp-app/ registry/ reliability/ security/
  docs/
    adr/ architecture/ contracts/ evidence/ observability/
    runbooks/ slo/ threat-model.md implementation-plan.md worklog.md
  .github/workflows/
  pnpm-workspace.yaml
  turbo.json
  package.json

DEPENDENCY DIRECTION
- domain imports no Next.js, MCP, model, database, workflow, or provider library.
- contracts contains Zod/JSON-schema boundary types and generated artifacts, not business side effects.
- db, WorkOS, MCP, AI, workflow, telemetry, and provider code implement ports defined closer to the domain.
- apps/web composes packages and owns HTTP/UI integration.
- services/risk-engine is independently deployable and communicates through typed MCP contracts.

CORE ENTITIES
Tenant, Membership, CloudAccount, CostCenter, SpendRecord, Anomaly, SavingsProposal, Approval, Execution, Receipt, DurableTask, AuditEvent, ToolCatalogEntry, ServerRegistration.

MONEY AND TIME
Represent money as integer minor units plus ISO currency. Use UTC instants and explicit reporting periods. Use opaque identifiers. Make tenant ownership explicit on every tenant-owned record.

FINAL MCP SURFACE

TypeScript tools:
- list_cost_centers
- get_spend_summary
- detect_spend_anomalies
- get_anomaly_detail
- draft_savings_action
- submit_action_for_approval
- execute_approved_action
- get_action_status
- get_action_receipt
- rollback_action

Python tools:
- score_savings_action
- simulate_commitment_plan

Resources:
- finops://tenants/{tenantId}/policy
- finops://proposals/{proposalId}
- finops://receipts/{receiptId}
- finops://contracts/tool-catalog/v1

Prompts:
- investigate_spend_spike
- prepare_savings_review

CONTRACT REQUIREMENTS
- Use narrow semantic tools, not generic SQL, HTTP, filesystem, or cloud-command tools.
- Inputs have descriptions, bounds, enums where stable, pagination, and explicit periods.
- Results provide concise content for model readability and structuredContent for applications.
- Outputs include contractVersion, traceId, data freshness, source basis, and domain identifiers where useful.
- Error envelopes distinguish validation, authentication, authorization, conflict, rate limit, dependency, timeout, unknown outcome, and internal failure. Do not leak stack traces.
- Tool annotations and descriptions are selection hints, never security controls.
- Resources are read-only contextual truth. Prompts are user-invoked recipes and cannot grant authority.
- Publish a machine-readable contract catalog and fingerprint discovered contracts for drift detection.

PHASE 01: PREPARE A BORING, REPEATABLE WORKSTATION

Outcome:
You can create, run, test, and commit both JavaScript and Python code from PowerShell without depending on winget.

Why now:
Tooling is learned once and reused through every later stage. Fixing it now prevents framework, MCP, database, and deployment errors from becoming indistinguishable.

Architecture shift:
From an empty folder to a verified engineering workstation with explicit versions and one project root.

Technology:
Node.js 20 or newer; pnpm; Git; GitHub account; Python 3.14.6; uv; optional Docker Desktop; VS Code or Devin Desktop.

Create or change:
- E:\mastering-a-skill\spendguard-mcp: The new project root; keep the earlier portfolio-demo intact.
- docs\workstation-check.md: Records versions, install source, and one command that proves each tool.
- .tool-versions.md: Human-readable version policy; package lockfiles become the machine proof.
- .gitignore: Blocks secrets, build outputs, virtual environments, and editor noise.

Implementation order:
1. Verify first: Run version checks before installing anything. Preserve working installations.
2. Install Node: Use the official Node installer when winget is unavailable; select an LTS/current version supported by the chosen Next.js and MCP packages.
3. Enable pnpm: Use Corepack or npm to install pnpm, then record the resolved version.
4. Install Git: Use the official Git for Windows installer and configure your GitHub identity.
5. Install uv: Use Astral's official PowerShell installer or pipx; do not make Python 3.14 itself your package manager.
6. Create root: Create the project directory, open it in the editor, and write the workstation proof.

Representative commands:
node --version
npm --version
pnpm --version
git --version
python --version
uv --version

Acceptance checks:
- Node: Version is at least 20 and node resolves in a new PowerShell window.
- pnpm: A package can be installed and the lockfile is deterministic.
- Git: A local commit succeeds with the intended name and email.
- Python: python --version reports 3.14.6.
- uv: uv can create a virtual environment and resolve a lockfile.

Preferred checkpoint commit:
chore: document reproducible workstation

Mandatory caution:
Do not install random package-manager substitutes because one command failed. The guide deliberately provides a no-winget path.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 02: CREATE THE MONOREPO AND DEPLOY THE FIRST EMPTY SHELL

Outcome:
A polished Next.js landing page is live on a Vercel preview and production URL from a GitHub-connected repository.

Why now:
Deployment is cheapest before data, identity, and MCP exist. Proving the GitHub-to-Vercel path now isolates future failures.

Architecture shift:
From local files to a public delivery loop: local commit, GitHub push, pull-request preview, production promotion.

Technology:
pnpm workspace; Turborepo; Next.js App Router; React; TypeScript; Tailwind CSS; ESLint; Vercel Git integration.

Create or change:
- apps\web: The only web deployable; contains public portfolio and later product routes.
- packages\config: Shared TypeScript, ESLint, and formatting policy.
- pnpm-workspace.yaml: Declares apps, packages, and services as one workspace.
- turbo.json: Defines build, lint, test, typecheck, and development pipelines.
- .github\pull_request_template.md: Makes proof and screenshots part of every change.

Implementation order:
1. Scaffold: Create the App Router project with TypeScript, Tailwind, ESLint, src directory, and alias.
2. Wrap workspace: Move the app under apps/web and add workspace and Turborepo configuration.
3. Brand the shell: Create SpendGuard AI public home, architecture, demo, and evidence navigation placeholders.
4. Initialize Git: Create the main branch, commit, create the GitHub repository, and push.
5. Connect Vercel: Import the GitHub repository, set Root Directory to apps/web, and enable preview deployments.
6. Prove delivery: Open a pull request, verify the preview, merge, and verify production.

Representative commands:
pnpm create next-app@latest apps/web
pnpm install
pnpm turbo lint typecheck build
git add .
git commit -m "feat: deploy SpendGuard product shell"

Acceptance checks:
- Local: Home page renders with no browser console errors.
- Build: Lint, typecheck, and production build pass from the repository root.
- Preview: A pull request receives a unique Vercel URL.
- Production: The main branch deploys to the stable production domain.
- Evidence: README records both URLs and a screenshot.

Preferred checkpoint commit:
feat: deploy SpendGuard product shell

Mandatory caution:
Do not add a database, authentication, an AI model, or MCP yet. The checkpoint is the delivery loop itself.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 03: MODEL THE FINOPS PROBLEM BEFORE ADDING AI

Outcome:
The site shows a realistic read-only dashboard driven by deterministic seed data and a domain vocabulary you can explain.

Why now:
MCP should expose a real capability, not invent the capability. A deterministic domain core creates truth that the UI, MCP server, tests, and Python service can share.

Architecture shift:
From a marketing shell to a useful product slice with tenants, accounts, spend records, anomalies, proposals, approvals, and receipts.

Technology:
TypeScript domain package; Zod 4 schemas; seeded fixtures; React Server Components; Recharts; shadcn/ui.

Create or change:
- packages\domain\src\entities.ts: Business entities and value objects independent of Next.js and MCP.
- packages\domain\src\services.ts: Spend aggregation, anomaly detection, proposal validation, and state transitions.
- packages\contracts\src\schemas.ts: Zod input/output schemas shared at trust boundaries.
- scenario-packs\seed\demo-corp.json: A believable tenant with twelve months of spend and injected anomalies.
- apps\web\src\app\(product)\demo: Read-only dashboard and anomaly detail pages.

Implementation order:
1. Write the story: Define the user, pain, decision, consequence, and evidence in docs/product-brief.md.
2. Define entities: Model money as integer minor units, timestamps as UTC, and identifiers as opaque strings.
3. Write pure services: Keep calculations deterministic and free of database, HTTP, AI, and MCP imports.
4. Create fixtures: Include normal months, one spike, one discount opportunity, and one data-quality gap.
5. Build dashboard: Render spend trend, top cost centers, anomalies, and a disabled action panel.
6. Test the math: Unit-test aggregation, anomaly thresholds, rounding, and state-transition rejections.

Representative commands:
pnpm --filter @spendguard/domain test
pnpm --filter web dev
pnpm turbo lint typecheck test build

Acceptance checks:
- Truth: Every displayed number can be recomputed from the fixture.
- Determinism: The same fixture produces the same anomalies and proposal estimate.
- Isolation: The domain package imports no Next.js, MCP, database, or model library.
- UX: A recruiter can understand the business problem in under one minute.
- Tests: Boundary cases include zero spend, missing month, and negative adjustment.

Preferred checkpoint commit:
feat: add deterministic FinOps domain slice

Mandatory caution:
Do not call an LLM to classify anomalies yet. First establish a deterministic baseline you can test and challenge.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 04: REPLACE FIXTURE MEMORY WITH DURABLE POSTGRES STATE

Outcome:
The dashboard reads seeded data from a real relational database, and schema changes are versioned through migrations.

Why now:
Identity, approvals, idempotency, tasks, and audit receipts all require durable state. Adding the database after the domain core keeps persistence from defining the business model.

Architecture shift:
From process memory and JSON fixtures to repositories backed by Neon Postgres with explicit migrations and seed/reset operations.

Technology:
Neon Postgres through the Vercel Marketplace; Drizzle ORM and Drizzle Kit; server-only repository adapters; optional local Postgres.

Create or change:
- packages\db\src\schema.ts: Tenant, membership, account, spend, anomaly, proposal, approval, execution, task, and audit tables.
- packages\db\src\repositories: Adapters implementing domain repository interfaces.
- packages\db\drizzle: Committed SQL migrations; never edit an applied migration.
- packages\db\src\seed.ts: Idempotent demo seed and safe reset for the demo tenant.
- apps\web\src\lib\data: Server-only queries that map database rows into domain types.

Implementation order:
1. Provision: Create Neon through Vercel and place the primary region near the web functions.
2. Model tenancy: Put tenant_id on every tenant-owned row and enforce compound uniqueness.
3. Create migrations: Generate, inspect, commit, and apply the initial schema.
4. Implement adapters: Keep SQL in db repositories; domain services remain persistence-agnostic.
5. Seed: Load Demo Corp and make repeated seed runs safe.
6. Wire UI: Replace fixture reads with server-side repository calls and useful empty/error states.

Representative commands:
pnpm --filter @spendguard/db db:generate
pnpm --filter @spendguard/db db:migrate
pnpm --filter @spendguard/db db:seed
pnpm turbo test build

Acceptance checks:
- Migration: A fresh database can be created from committed migrations.
- Seed: Running the seed twice creates no duplicate tenant or spend rows.
- Tenancy: Cross-tenant repository tests return no data.
- Preview: Preview deployments use a non-production database or database branch.
- Recovery: The README explains reset, backup, and migration rollback limits.

Preferred checkpoint commit:
feat: persist SpendGuard state in Neon Postgres

Mandatory caution:
Never use the production connection string for local tests or preview resets. Environment isolation is part of correctness.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 05: ADD HUMAN IDENTITY, ORGANIZATIONS, AND ROLES

Outcome:
Users sign in, select an organization, and see only the tenant data and actions allowed by their role.

Why now:
Remote tools cannot be secure if the web product has no coherent identity and tenancy model. Add identity before public mutation endpoints.

Architecture shift:
From an anonymous demo to a multi-tenant product with viewer, analyst, approver, and admin responsibilities.

Technology:
WorkOS AuthKit for web authentication and organizations; server-side session verification; RBAC policy package; audit-safe principal context.

Create or change:
- packages\auth\src\session.ts: Turns verified provider identity into an internal principal.
- packages\policy\src\authorize.ts: Pure action/object policy decisions with reason codes.
- apps\web\src\app\auth\callback: AuthKit callback and session establishment.
- apps\web\src\middleware.ts: Protects product routes without treating cookies as domain authorization.
- packages\db\src\repositories\memberships.ts: Maps organization membership to internal roles.

Implementation order:
1. Configure provider: Create development and production WorkOS environments; add redirect URLs separately.
2. Verify sessions: Validate on the server and create an immutable principal containing user, tenant, role, and trace context.
3. Map membership: Resolve organization membership from trusted provider and database f…5636 tokens truncated…n, and approval state.
- packages\mcp-server\src\apps\register-anomaly-review.ts: Tool metadata and app resource registration.
- apps\web\src\app\mcp-app-sandbox: Separate sandbox route/origin policy for the product host.
- apps\web\src\app\api\mcp-app-host: Validated resource reads and app-visible tool calls.
- scenario-packs\mcp-app: Unsupported host, CSP violation, forged message, oversized payload, and fallback cases.

Implementation order:
1. Install official skill: Give the coding agent the current ext-apps create/add skill and make it inspect version compatibility.
2. Bundle view: Create self-contained HTML or declare every external asset in a deny-by-default CSP.
3. Register resource: Attach the ui:// resource to the ordinary anomaly-review tool.
4. Separate visibility: Keep app-only tools away from the model and validate every app-initiated call.
5. Render safely: Use a sandboxed iframe and verify origin, source, message type, correlation, timeout, and size.
6. Preserve fallback: Text and structured content must fully explain the result without the App.

Representative commands:
npx skills add modelcontextprotocol/ext-apps
pnpm --filter web build:mcp-apps
pnpm --filter web test:e2e:mcp-app

Acceptance checks:
- Sandbox: The view cannot read parent cookies, DOM, or unrelated storage.
- CSP: Undeclared network and script destinations are blocked.
- Visibility: App-only tools are never offered to the model.
- Fallback: Inspector and text-only hosts still receive useful content.
- Accessibility: Keyboard, focus, contrast, chart alternative, and error states pass.

Preferred checkpoint commit:
feat: add secure anomaly review MCP App

Mandatory caution:
Do not reuse the normal authenticated web page as iframe content. An MCP App is untrusted portable UI with a different security contract.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 14: ADD THE PYTHON RISK SERVER AS A BOUNDED SECOND SERVICE

Outcome:
The host can call an independently deployed Python MCP service to score proposals and run simulations without moving core authority out of TypeScript.

Why now:
Python belongs where it adds a credible capability: analytics and simulation. Adding it now demonstrates cross-runtime MCP composition without making early learning harder.

Architecture shift:
From one server to two focused servers with different languages, release cadences, resource identities, scopes, and SLOs.

Technology:
Python 3.14; uv; official MCP Python SDK v2; Pydantic; Starlette or FastAPI-compatible ASGI entry; pytest; Vercel Python runtime.

Create or change:
- services\risk-engine\pyproject.toml: Python version, exact dependencies, project scripts, and test configuration.
- services\risk-engine\uv.lock: Reproducible Python dependency graph.
- services\risk-engine\src\risk_engine: Pure scoring, simulation, adapters, MCP registration, auth, and telemetry.
- services\risk-engine\tests: Unit, contract, authorization, and HTTP/MCP integration tests.
- docs\adr\ADR-014-python-risk-boundary.md: Why Python is separate and what it is forbidden to own.

Implementation order:
1. Create service: Initialize with uv and pin the stable MCP Python SDK v2 line.
2. Keep pure math: Implement score_action and simulate_commitment as deterministic functions first.
3. Expose MCP: Register read-only tools with typed Pydantic inputs and structured results.
4. Mount ASGI: Use the current v2 SDK's documented stateless HTTP/ASGI pattern and test the actual Vercel entrypoint.
5. Protect resource: Give the Python server its own canonical resource URI, audience, scopes, and metadata.
6. Deploy separately: Create a second Vercel project from the same GitHub repository with its own root and environment.

Representative commands:
cd services/risk-engine
uv init
uv add "mcp[cli]>=2,<3" pydantic
uv add --dev pytest pytest-asyncio httpx ruff mypy
uv run pytest

Acceptance checks:
- Boundary: Risk server cannot approve or execute an action.
- Parity: Python and TypeScript share JSON contract fixtures, not source imports.
- Auth: A token for the TypeScript MCP resource is rejected by Python.
- Deploy: Vercel health and MCP discovery pass on the Python project.
- Failure: Host can degrade gracefully when risk scoring is unavailable.

Preferred checkpoint commit:
feat: add Python proposal risk MCP server

Mandatory caution:
Do not make the Python service a universal proxy or duplicate the TypeScript domain truth. It returns evidence; it does not grant authority.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 15: CREATE THE MULTI-SERVER CONTROL PLANE

Outcome:
An admin console inventories both servers, records capabilities and health, and lets the host apply per-server admission and routing policy.

Why now:
With two servers, connection inventory, trust posture, compatibility, and tool collisions become real rather than theoretical.

Architecture shift:
From hard-coded URLs to a catalog whose entries are discovered, reviewed, admitted, monitored, and revoked.

Technology:
Server registry tables; discovery snapshots; trust levels; capability fingerprints; host connection manager; policy explanations; health probes.

Create or change:
- packages\registry\src\catalog.ts: Server identity, endpoint, owner, trust, versions, capabilities, health, and release.
- packages\registry\src\discover.ts: Fetches discover/list data with SSRF-safe URL policy and deadlines.
- packages\mcp-host\src\router.ts: Maintains one client per server and resolves namespaced eligible tools.
- apps\web\src\app\(product)\admin\servers: Catalog, diff, health, quarantine, and policy explanation UI.
- scenario-packs\registry: Tool collision, changed schema, unhealthy server, revoked trust, and cross-server prompt-injection cases.

Implementation order:
1. Define admission: Require owner, HTTPS endpoint, canonical resource, supported version, auth posture, risk class, and test evidence.
2. Discover safely: Allowlist origins, block private/reserved addresses, validate redirects, and bound response size/time.
3. Fingerprint: Hash normalized capabilities and require review for material diffs.
4. Namespace: Preserve server identity in model-visible names and traces; never merge authority invisibly.
5. Route: Create independent clients and tokens per server; filter by intent, principal, data, and risk.
6. Quarantine: Disable a server without deleting history, evidence, or prior receipts.

Representative commands:
pnpm --filter @spendguard/registry test
pnpm --filter @spendguard/mcp-host test:multi-server
pnpm --filter web test:e2e:registry

Acceptance checks:
- Isolation: Each client communicates with exactly one server and uses that resource's token.
- Collision: Same tool name on two servers is not silently overwritten.
- Diff: A changed schema or annotation creates a reviewable catalog event.
- SSRF: Discovery rejects loopback, link-local, private ranges, and unsafe redirects in production.
- Revocation: Quarantine removes tools from new model contexts immediately.

Preferred checkpoint commit:
feat: add MCP server registry and host routing

Mandatory caution:
Do not create a gateway that sees every credential and rewrites every message without a precise reason. Centralize invariants, not all business logic.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 16: MAKE RELIABILITY, SECURITY, AND COST OBSERVABLE

Outcome:
Every user request can be followed through model, host, server, workflow, provider, receipt, release, and cost without exposing secrets or full prompts.

Why now:
The project now has enough boundaries and failure modes that logs alone cannot explain it. Evidence must connect technical behavior to user outcome.

Architecture shift:
From scattered console messages to a shared telemetry vocabulary, SLOs, redaction policy, dashboards, alerts, and runbooks.

Technology:
OpenTelemetry; Vercel Observability; structured logs; trace propagation; metrics; audit log; SLO/error budget; optional Upstash rate limiting.

Create or change:
- packages\observability\src\instrumentation.ts: Shared spans, metrics, safe attributes, and correlation.
- apps\web\src\instrumentation.ts: Registers telemetry before application requests.
- docs\observability\event-vocabulary.md: Names, required fields, forbidden fields, retention, and owner.
- docs\slo\mcp-workflow-slo.md: User-visible success and latency indicators with error budget.
- docs\runbooks: OAuth outage, provider unknown outcome, workflow backlog, bad release, and cost spike.

Implementation order:
1. Define outcomes: Measure successful investigation, safe proposal, approval completion, execution receipt, and recovery.
2. Instrument boundaries: Create spans for host decision, tool call, policy, database, workflow step, provider, and receipt.
3. Redact: Never emit tokens, Authorization headers, secrets, raw prompts, full tool payloads, or sensitive resource content by default.
4. Add metrics: Latency, error, denial, task age, duplicate prevention, unknown outcomes, saturation, and cost per completed workflow.
5. Write SLO: Set a realistic target and connect alerts to user-visible failure.
6. Exercise runbooks: Use scenario packs to trigger one failure and verify the evidence chain.

Representative commands:
pnpm --filter @spendguard/observability test
pnpm --filter web test:telemetry
pnpm run scenario:unknown-outcome

Acceptance checks:
- Trace: One trace links user request to authoritative receipt.
- Privacy: Automated tests fail when forbidden headers or fields reach logs.
- Metrics: Failures and retries do not double-count completed business outcomes.
- SLO: The indicator is based on user-visible success, not process uptime alone.
- Cost: The dashboard shows model, function, workflow, storage, and provider cost dimensions.

Preferred checkpoint commit:
feat: add end-to-end observability and SLOs

Mandatory caution:
More logging is not observability. Unbounded prompts and tool payloads create a second sensitive data store and often make incidents worse.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 17: BUILD THE ASSURANCE LADDER AND HOSTILE SCENARIOS

Outcome:
Pull requests prove domain logic, contracts, protocol compatibility, OAuth, browser behavior, failure recovery, security, and performance before merge.

Why now:
The application now makes consequential claims. A portfolio becomes credible when those claims have executable ways to fail.

Architecture shift:
From feature tests to an assurance system ordered from fast deterministic checks to realistic end-to-end and adversarial evidence.

Technology:
Vitest; Playwright; pytest; MCP Inspector; MCP conformance framework; contract fixtures; property tests; dependency scanning; CodeQL; k6 optional.

Create or change:
- packages\testing\src\fixtures: Shared canonical JSON fixtures and expected results.
- scenario-packs\security: Prompt injection, SSRF, scope escalation, cross-tenant access, approval replay, and data exfiltration.
- scenario-packs\reliability: Timeout, retry, process loss, stale version, duplicate delivery, and unknown outcome.
- tests\e2e: Browser flows for public demo, sign-in, proposal, approval, execution, and evidence.
- .github\workflows\assurance.yml: Runs the assurance ladder with machine-readable artifacts.

Implementation order:
1. Order the ladder: Format and types, unit, contract, integration, protocol, browser, security, load, and chaos.
2. Create oracles: Use independent expected fixtures, not snapshots generated by the same implementation.
3. Test peers: Run server cases against a v2 client and selected real client compatibility lanes.
4. Attack authority: Attempt token confusion, tenant swapping, stale approval, injected instructions, unsafe URLs, and forged app messages.
5. Test recovery: Interrupt between effect and receipt and prove reconciliation.
6. Publish evidence: Upload reports, traces, screenshots, and a concise human summary per pull request.

Representative commands:
pnpm turbo lint typecheck test build
pnpm run test:contract
pnpm run test:e2e
pnpm run test:security
uv run --directory services/risk-engine pytest

Acceptance checks:
- Fast gate: A developer gets deterministic local feedback before opening a pull request.
- Protocol: Supported version and extension combinations are named and tested.
- Security: Every high-risk boundary has at least one negative test.
- Flakes: Quarantined tests have owner and expiry; green never silently ignores failures.
- Artifact: A reviewer can trace each claim to a test, result, and release.

Preferred checkpoint commit:
test: add MCP assurance and adversarial scenarios

Mandatory caution:
A green CI pipeline can still be meaningless if the oracle is weak, failures are ignored, or production behavior is never represented.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

PHASE 18: FINISH GITHUB-TO-VERCEL PRODUCTION DELIVERY AND THE PORTFOLIO PROOF

Outcome:
The monorepo produces reviewed previews, controlled production releases, rollback evidence, a public architecture story, and a rehearsed interview demo.

Why now:
The final product is not complete when the code builds. It is complete when another person can evaluate, operate, and understand it.

Architecture shift:
From a working system to a maintained public portfolio product with release discipline and a concise proof narrative.

Technology:
GitHub branch protection; GitHub Actions; Vercel preview/production projects; Neon preview branches; WorkOS environment separation; deployment checks; release records.

Create or change:
- .github\workflows\ci.yml: Fast deterministic quality gate for every pull request.
- .github\workflows\security.yml: Dependency review, secret scan, CodeQL, and scheduled checks.
- docs\adr: Key architecture decisions with consequences and reversal signals.
- docs\threat-model.md: Assets, actors, boundaries, abuse cases, controls, and residual risk.
- apps\web\src\app\architecture and evidence: Public diagrams, scenario results, runbooks, and release proof.

Implementation order:
1. Protect main: Require reviews and quality checks; disallow direct production edits.
2. Isolate environments: Separate development, preview, and production URLs, data, identity, secrets, and OAuth redirects.
3. Gate migrations: Run backward-compatible migrations before traffic and record the exact commit and result.
4. Verify release: Smoke test public pages, protected flows, both MCP servers, workflow, and receipt lookup.
5. Prove rollback: Roll back application release and explain database/workflow compatibility during reversal.
6. Publish story: Create a five-minute demo, architecture tour, evidence index, resume bullets, and interview answer.

Representative commands:
pnpm turbo lint typecheck test build
pnpm run verify:preview
pnpm run verify:production
pnpm run evidence:bundle

Acceptance checks:
- Preview: Every pull request has isolated UI and safe data evidence.
- Production: Health, discovery, auth metadata, read tool, workflow, and receipt checks pass.
- Rollback: The previous deployment can run against the current compatible schema and workflow versions.
- Portfolio: A visitor understands problem, architecture, consequence, and proof without installing anything.
- Interview: You can explain principle, exact implementation location, and evidence for every major claim.

Preferred checkpoint commit:
docs: publish SpendGuard production evidence portfolio

Mandatory caution:
Do not expose production secrets, real cloud accounts, customer data, or writable public demo effects. The portfolio must be safe to inspect.

Before advancing, record the passing commands and evidence in docs/worklog.md. If exact APIs differ from this prompt because official stable documentation has changed, preserve the architectural invariant, use the current supported API, test it, and record the deviation.

GLOBAL ACCEPTANCE CRITERIA

The work is complete only when all applicable statements are true:
1. A new developer can provision, seed, run, test, and understand the monorepo from the README and runbooks.
2. The public site explains problem, architecture, MCP boundaries, security, evidence, and limitations.
3. Protected UI enforces verified identity, tenant isolation, roles, and separation of duties.
4. The TypeScript MCP endpoint is discoverable and typed, implements current stateless MCP semantics, documents supported compatibility, and is protected by resource-server OAuth in protected environments.
5. The AI host discovers only policy-allowed capabilities and provides transparent tool calls, approval UI, cancellation, and final receipts.
6. Consequential mutations use canonical proposals, exact version/digest binding, idempotency, durable execution, provider reconciliation, and authoritative receipts.
7. Durable work survives interruption and presents progress through MCP Tasks when negotiated plus a documented status-tool fallback.
8. The MCP App renders in a compatible host, validates messages, is sandboxed, and has an accessible text fallback.
9. The Python MCP risk service is independently buildable, tested, authenticated, observable, and optional without breaking the main product.
10. The registry/control plane inventories servers and tools, fingerprints contracts, applies trust status and exposure policy, and makes multi-server ambiguity visible.
11. Telemetry correlates user request, model turn, MCP call, policy decision, workflow, provider attempt, receipt, and release without recording prohibited content.
12. CI runs deterministic fast gates plus contract, protocol, browser, security, reliability, and Python tests; evidence is published.
13. Preview and production environment mappings are documented and isolated. Rollback compatibility is documented and tested to the extent possible.
14. The five-minute demo works from reset seed data and includes at least one rejected attack or invariant violation.
15. There are no committed secrets, no false claims of external deployment, and no unlabelled required stubs.

FINAL HANDOFF
At completion, provide:
- concise architecture and dependency summary;
- exact local run and test commands;
- environment-variable NAMES, their purpose, and where the user must set them;
- database provision/migration/seed steps;
- GitHub and Vercel steps that still require human authorization;
- URLs or identifiers for external actions that actually succeeded;
- test/build results and known limitations;
- a repository tour for the five-minute demo;
- next three improvements ordered by risk reduction, not novelty.

END MASTER PROMPT
