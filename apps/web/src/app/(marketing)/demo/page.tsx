import Link from "next/link";
import { loadDemoCorpData } from "@/lib/data/demo-fixture";
import { formatUsd } from "@/lib/format";
import { SpendTrendChart } from "@/components/spend-trend-chart";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
};

const KIND_LABELS: Record<string, string> = {
  spike: "Spend spike",
  discount_opportunity: "Discount opportunity",
  data_quality_gap: "Data quality gap",
};

export default async function DemoPage() {
  const { tenant, costCentersById, trend, byCostCenter, total, anomalies } = await loadDemoCorpData();

  const latestPeriod = trend.length > 0 ? trend[trend.length - 1]!.period : null;
  const topCostCentersLatest = byCostCenter
    .filter((entry) => entry.period === latestPeriod)
    .sort((a, b) => b.total.amountMinorUnits - a.total.amountMinorUnits);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-2">
        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Simulated data · {tenant.name}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">Spend dashboard</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Every number below is recomputed live from{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            scenario-packs/seed/demo-corp.json
          </code>{" "}
          through the pure functions in <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">@spendguard/domain</code>.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase text-zinc-500">Total spend (all periods)</p>
          <p className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">{formatUsd(total.amountMinorUnits)}</p>
        </div>
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase text-zinc-500">Cost centers tracked</p>
          <p className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">{costCentersById.size}</p>
        </div>
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase text-zinc-500">Anomalies detected</p>
          <p className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">{anomalies.length}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Total spend trend</h2>
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-950">
          <SpendTrendChart points={trend.map((p) => ({ period: p.period, amountMinorUnits: p.total.amountMinorUnits }))} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Top cost centers {latestPeriod ? `(${latestPeriod})` : ""}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-black/[.08] dark:border-white/[.08]">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3">Cost center</th>
                <th className="px-4 py-3">Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.06] dark:divide-white/[.06]">
              {topCostCentersLatest.map((entry) => (
                <tr key={entry.costCenterId} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {costCentersById.get(entry.costCenterId)?.name ?? entry.costCenterId}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatUsd(entry.total.amountMinorUnits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Anomalies</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {anomalies.map((anomaly) => (
            <Link
              key={anomaly.id}
              href={`/demo/anomalies/${encodeURIComponent(anomaly.id)}`}
              className="flex flex-col gap-2 rounded-2xl border border-black/[.08] bg-white p-6 transition-colors hover:border-emerald-400 dark:border-white/[.08] dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black dark:text-zinc-50">
                  {costCentersById.get(anomaly.costCenterId)?.name ?? anomaly.costCenterId}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[anomaly.severity]}`}>
                  {anomaly.severity}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {KIND_LABELS[anomaly.kind]} in {anomaly.period}
                {anomaly.kind !== "data_quality_gap" ? ` (${anomaly.deltaPercent > 0 ? "+" : ""}${anomaly.deltaPercent}%)` : ""}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Action panel</h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-black/[.16] bg-white p-6 dark:border-white/[.16] dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Drafting, submitting for approval, and executing a savings action requires verified identity and durable
            state — not yet wired into this read-only demo.
          </p>
          <button
            type="button"
            disabled
            className="w-fit cursor-not-allowed rounded-full bg-zinc-300 px-5 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
          >
            Draft savings action (disabled)
          </button>
        </div>
      </section>
    </div>
  );
}
