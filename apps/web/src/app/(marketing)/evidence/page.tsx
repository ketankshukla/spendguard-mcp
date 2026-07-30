export default function EvidencePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">Evidence</h1>
      <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
        This page will index the assurance ladder for SpendGuard AI: unit, contract, protocol, browser, security,
        and reliability test results; scenario-pack outcomes for hostile inputs; and links to CI runs, screenshots,
        and traces for each major claim (see Phase 17).
      </p>
      <div className="rounded-2xl border border-dashed border-black/[.16] bg-white p-10 text-center text-sm text-zinc-500 dark:border-white/[.16] dark:bg-zinc-950">
        Placeholder — evidence index is populated once the assurance ladder and CI pipeline exist.
      </div>
    </div>
  );
}
