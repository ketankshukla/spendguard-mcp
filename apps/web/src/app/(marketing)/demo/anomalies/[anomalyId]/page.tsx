import Link from "next/link";
import { notFound } from "next/navigation";
import { findAnomalyById, loadDemoCorpData } from "@/lib/data/demo-fixture";
import { formatUsd } from "@/lib/format";

const KIND_LABELS: Record<string, string> = {
  spike: "Spend spike",
  discount_opportunity: "Discount opportunity",
  data_quality_gap: "Data quality gap",
};

export default async function AnomalyDetailPage({
  params,
}: {
  params: Promise<{ anomalyId: string }>;
}) {
  const { anomalyId } = await params;
  const { anomalies, costCentersById, proposalsByAnomalyId } = await loadDemoCorpData();
  const anomaly = findAnomalyById(anomalies, decodeURIComponent(anomalyId));

  if (!anomaly) {
    notFound();
  }

  const proposal = proposalsByAnomalyId.get(anomaly.id);
  const costCenter = costCentersById.get(anomaly.costCenterId);

  return (
    <div className="flex flex-col gap-8">
      <Link href="/demo" className="text-sm font-medium text-emerald-600 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="flex flex-col gap-2">
        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {KIND_LABELS[anomaly.kind]}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {costCenter?.name ?? anomaly.costCenterId} — {anomaly.period}
        </h1>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase text-zinc-500">Baseline</p>
          <p className="mt-2 text-xl font-semibold text-black dark:text-zinc-50">
            {formatUsd(anomaly.baselineAmount.amountMinorUnits)}
          </p>
        </div>
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase text-zinc-500">Observed</p>
          <p className="mt-2 text-xl font-semibold text-black dark:text-zinc-50">
            {formatUsd(anomaly.observedAmount.amountMinorUnits)}
          </p>
        </div>
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase text-zinc-500">Delta</p>
          <p className="mt-2 text-xl font-semibold text-black dark:text-zinc-50">
            {anomaly.deltaPercent > 0 ? "+" : ""}
            {anomaly.deltaPercent}%
          </p>
        </div>
      </section>

      {proposal ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Drafted savings action</h2>
          <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
            <p className="font-medium text-black dark:text-zinc-50">{proposal.title}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{proposal.description}</p>
            <p className="mt-3 text-sm">
              Estimated savings:{" "}
              <span className="font-semibold text-emerald-600">
                {formatUsd(proposal.estimatedSavings.amountMinorUnits)}
              </span>
            </p>
            <p className="mt-1 text-xs uppercase text-zinc-500">
              Status: {proposal.status} · version {proposal.version}
            </p>
          </div>
        </section>
      ) : (
        <p className="text-sm text-zinc-500">
          Data-quality gaps have no financial delta, so no savings action is drafted from this anomaly.
        </p>
      )}
    </div>
  );
}
