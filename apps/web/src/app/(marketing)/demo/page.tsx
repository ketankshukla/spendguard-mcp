export default function DemoPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">Demo</h1>
      <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
        The interactive, seeded FinOps dashboard lands in Phase 03 (deterministic domain slice) and Phase 04
        (durable Postgres state). It will let you walk through a real spend spike for &ldquo;Demo Corp&rdquo;,
        review a drafted savings action, approve it, and inspect the resulting receipt — all against safe,
        simulated data.
      </p>
      <div className="rounded-2xl border border-dashed border-black/[.16] bg-white p-10 text-center text-sm text-zinc-500 dark:border-white/[.16] dark:bg-zinc-950">
        Placeholder — dashboard, anomaly detail, and action flow are not implemented yet.
      </div>
    </div>
  );
}
