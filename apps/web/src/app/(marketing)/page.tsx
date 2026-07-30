import Link from "next/link";

const PIPELINE_STEPS = [
  { title: "Investigate", detail: "Detect and explain a cloud-spend anomaly with full source basis." },
  { title: "Draft", detail: "Draft a bounded savings action as a canonical, versioned proposal." },
  { title: "Approve", detail: "Require independent human approval, bound to the exact proposal digest." },
  { title: "Execute", detail: "Run the action through a safe, deterministic simulated provider." },
  { title: "Reconcile", detail: "Survive retries and restarts with idempotent, durable execution." },
  { title: "Prove", detail: "Produce an authoritative receipt plus operational evidence." },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-20">
      <section className="flex flex-col gap-6">
        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Simulated · Safe to inspect · No real cloud account required
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          Cloud-spend anomalies, investigated and resolved with an auditable MCP workflow.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          SpendGuard AI is a production-shaped portfolio application for a FinOps team: detect a spend spike,
          draft a savings action, get it independently approved, execute it safely, and walk away with a receipt.
        </p>
        <div className="flex gap-4">
          <Link
            href="/demo"
            className="flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            View the demo
          </Link>
          <Link
            href="/architecture"
            className="flex h-11 items-center justify-center rounded-full border border-black/[.12] px-6 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.16] dark:text-zinc-50 dark:hover:bg-white/[.06]"
          >
            Read the architecture
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PIPELINE_STEPS.map((step, index) => (
          <div
            key={step.title}
            className="flex flex-col gap-2 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950"
          >
            <span className="text-xs font-semibold text-emerald-600">Step {index + 1}</span>
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">{step.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.detail}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
