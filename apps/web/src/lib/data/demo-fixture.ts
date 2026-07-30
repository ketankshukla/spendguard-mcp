import {
  asCostCenterId,
  asTenantId,
  detectSpendAnomalies,
  draftSavingsProposal,
  summarizeSpendByCostCenter,
  summarizeSpendTrend,
  totalSpend,
  type Anomaly,
  type AnomalyId,
  type CostCenter,
  type ProposalId,
  type SpendRecord,
  type Tenant,
} from "@spendguard/domain";

import demoCorpFixture from "../../../../../scenario-packs/seed/demo-corp.json";

interface DemoCorpFixture {
  readonly tenant: { readonly id: string; readonly name: string };
  readonly costCenters: ReadonlyArray<{
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly cloudProvider: "aws" | "gcp" | "azure" | "simulated";
  }>;
  readonly spendRecords: ReadonlyArray<{
    readonly id: string;
    readonly tenantId: string;
    readonly costCenterId: string;
    readonly period: string;
    readonly amount: { readonly amountMinorUnits: number; readonly currency: string };
    readonly recordedAt: string;
  }>;
}

const fixture = demoCorpFixture as DemoCorpFixture;

function loadTenant(): Tenant {
  return { id: asTenantId(fixture.tenant.id), name: fixture.tenant.name };
}

function loadCostCenters(): CostCenter[] {
  return fixture.costCenters.map((cc) => ({
    id: asCostCenterId(cc.id),
    tenantId: asTenantId(cc.tenantId),
    name: cc.name,
    cloudProvider: cc.cloudProvider,
  }));
}

function loadSpendRecords(): SpendRecord[] {
  return fixture.spendRecords.map((sr) => ({
    id: sr.id as SpendRecord["id"],
    tenantId: asTenantId(sr.tenantId),
    costCenterId: asCostCenterId(sr.costCenterId),
    period: sr.period,
    amount: sr.amount,
    recordedAt: sr.recordedAt,
  }));
}

/**
 * Loads the deterministic Demo Corp fixture and derives every dashboard value
 * from it via pure @spendguard/domain functions. Every number on the demo
 * dashboard can be recomputed from `scenario-packs/seed/demo-corp.json`.
 */
export function loadDemoCorpData() {
  const tenant = loadTenant();
  const costCenters = loadCostCenters();
  const spendRecords = loadSpendRecords();

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
