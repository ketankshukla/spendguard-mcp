import {
  getDb,
  getTenant,
  listCostCenters,
  listSpendRecords,
} from "@spendguard/db";
import {
  detectSpendAnomalies,
  draftSavingsProposal,
  summarizeSpendByCostCenter,
  summarizeSpendTrend,
  totalSpend,
  type Anomaly,
  type AnomalyId,
  type ProposalId,
} from "@spendguard/domain";

const DEMO_TENANT_ID = "tenant-demo-corp";

/**
 * Loads Demo Corp from Neon Postgres (seeded from `scenario-packs/seed/demo-corp.json`
 * via `packages/db`'s idempotent seed script) and derives every dashboard value
 * through pure @spendguard/domain functions. Every number on the demo dashboard
 * can be recomputed from the seeded rows — no value is computed ad hoc in the UI.
 */
export async function loadDemoCorpData() {
  const db = getDb();

  const tenant = await getTenant(db, DEMO_TENANT_ID);
  if (!tenant) {
    throw new Error(
      `Demo tenant "${DEMO_TENANT_ID}" was not found. Run "pnpm --filter @spendguard/db db:seed" against the configured DATABASE_URL first.`,
    );
  }

  const costCenters = await listCostCenters(db, tenant.id);
  const spendRecords = await listSpendRecords(db, tenant.id);

  const costCentersById = new Map(costCenters.map((cc) => [cc.id, cc] as const));

  const trend = summarizeSpendTrend(spendRecords);
  const byCostCenter = summarizeSpendByCostCenter(spendRecords);
  const total = totalSpend(spendRecords);

  const latestPeriod = trend.length > 0 ? trend[trend.length - 1]!.period : null;
  const anomalies = detectSpendAnomalies(tenant.id, spendRecords, {
    detectedAt: latestPeriod ? `${latestPeriod}-28T00:00:00.000Z` : "2026-01-28T00:00:00.000Z",
  });

  const proposalsByAnomalyId = new Map(
    anomalies
      .filter((a: Anomaly) => a.kind !== "data_quality_gap")
      .map((anomaly: Anomaly) => [
        anomaly.id,
        draftSavingsProposal(anomaly, {
          idFactory: () => `${anomaly.id}:proposal` as ProposalId,
          createdAt: anomaly.detectedAt,
        }),
      ]),
  );

  return {
    tenant,
    costCenters,
    costCentersById,
    spendRecords,
    trend,
    byCostCenter,
    total,
    anomalies,
    proposalsByAnomalyId,
  };
}

export function findAnomalyById(anomalies: readonly Anomaly[], anomalyId: string): Anomaly | undefined {
  return anomalies.find((a) => a.id === (anomalyId as AnomalyId));
}
