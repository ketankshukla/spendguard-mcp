const LAYERS = [
  {
    name: "apps/web",
    detail:
      "Next.js App Router product: public marketing pages, authenticated product UI, the MCP HTTP transport, the AI chat host, and the durable workflow entry points.",
  },
  {
    name: "services/risk-engine",
    detail:
      "An independently deployable Python MCP server that scores proposed savings actions and simulates commitment plans. It returns evidence; it never approves or executes.",
  },
  {
    name: "packages/domain",
    detail:
      "Pure business logic: tenants, spend aggregation, anomaly detection, proposal validation, and state transitions. Imports nothing from Next.js, MCP, the database, or a model.",
  },
  {
    name: "packages/contracts",
    detail:
      "Zod schemas and generated artifacts shared at every trust boundary between the UI, MCP tools, and the risk service.",
  },
  {
    name: "packages/db",
    detail:
      "Drizzle schema, committed migrations, and repository adapters over Neon Postgres. Tenant ownership is explicit on every row.",
  },
  {
    name: "packages/auth + policy",
    detail:
      "WorkOS-verified identity turned into an internal principal, and pure authorize() decisions with reason codes. Tenant, role, and scope always come from verified server context.",
  },
  {
    name: "packages/mcp-server + mcp-host",
    detail:
      "The narrow, semantic MCP tool surface (list_cost_centers, detect_spend_anomalies, draft_savings_action, and so on) and the host-side router that connects the AI SDK chat experience to eligible tools.",
  },
  {
    name: "packages/registry",
    detail:
      "A control-plane catalog that discovers, fingerprints, admits, and can quarantine MCP servers — including cross-runtime servers like the Python risk engine.",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">Architecture</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          SpendGuard AI separates domain truth from delivery mechanism. Every consequential effect flows through a
          canonical proposal, an independent approval bound to an exact version, idempotent durable execution, and an
          authoritative receipt — never directly from model text or tool arguments.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LAYERS.map((layer) => (
          <div
            key={layer.name}
            className="flex flex-col gap-2 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950"
          >
            <h3 className="font-mono text-sm font-semibold text-emerald-600">{layer.name}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{layer.detail}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        This page will grow with diagrams and the full dependency-direction map as the MCP server, host, and workflow
        layers are built out in later phases.
      </p>
    </div>
  );
}
