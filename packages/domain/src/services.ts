/**
 * Pure domain services: spend aggregation, anomaly detection, proposal
 * validation, and state transitions. No database, HTTP, AI, or MCP imports.
 * Every function here is deterministic given its inputs.
 */

import {
  type Anomaly,
  type AnomalyId,
  type AnomalyKind,
  type AnomalySeverity,
  type CostCenterId,
  type Money,
  type ProposalId,
  type ProposalStatus,
  type ReportingPeriod,
  type SavingsProposal,
  type SpendRecord,
  type TenantId,
  addMoney,
  comparePeriods,
  isValidReportingPeriod,
  money,
  zeroMoney,
} from "./entities";

// ---------------------------------------------------------------------------
// Spend aggregation
// ---------------------------------------------------------------------------

export interface CostCenterSpendSummary {
  readonly costCenterId: CostCenterId;
  readonly period: ReportingPeriod;
  readonly total: Money;
}

export interface SpendTrendPoint {
  readonly period: ReportingPeriod;
  readonly total: Money;
}

/** Aggregates spend records into per-cost-center, per-period totals. Deterministic and pure. */
export function summarizeSpendByCostCenter(records: readonly SpendRecord[]): CostCenterSpendSummary[] {
  const totals = new Map<string, { costCenterId: CostCenterId; period: ReportingPeriod; total: Money }>();

  for (const record of records) {
    const key = `${record.costCenterId}|${record.period}`;
    const existing = totals.get(key);
    if (existing) {
      totals.set(key, { ...existing, total: addMoney(existing.total, record.amount) });
    } else {
      totals.set(key, {
        costCenterId: record.costCenterId,
        period: record.period,
        total: record.amount,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => {
    const periodCompare = comparePeriods(a.period, b.period);
    if (periodCompare !== 0) return periodCompare;
    return a.costCenterId.localeCompare(b.costCenterId);
  });
}

/** Aggregates total spend per period across all cost centers, for a trend chart. Fills currency from records or defaults to USD when there are none for a period. */
export function summarizeSpendTrend(records: readonly SpendRecord[]): SpendTrendPoint[] {
  const totals = new Map<ReportingPeriod, Money>();

  for (const record of records) {
    const existing = totals.get(record.period);
    totals.set(record.period, existing ? addMoney(existing, record.amount) : record.amount);
  }

  return Array.from(totals.entries())
    .map(([period, total]) => ({ period, total }))
    .sort((a, b) => comparePeriods(a.period, b.period));
}

/** Total spend for a single tenant across all provided records (assumed pre-filtered to the tenant). */
export function totalSpend(records: readonly SpendRecord[], currency = "USD"): Money {
  return records.reduce((sum, record) => addMoney(sum, record.amount), zeroMoney(currency));
}

// ---------------------------------------------------------------------------
// Anomaly detection
// ---------------------------------------------------------------------------

export interface AnomalyDetectionOptions {
  /** Percent increase over trailing baseline required to flag a spike. Default 25. */
  readonly spikeThresholdPercent?: number;
  /** Percent decrease under trailing baseline required to flag a discount opportunity. Default 20. */
  readonly discountThresholdPercent?: number;
  /** Number of trailing periods averaged to form the baseline. Default 3. */
  readonly baselineWindow?: number;
  readonly detectedAt?: string;
  readonly idFactory?: (input: { costCenterId: CostCenterId; period: ReportingPeriod; kind: AnomalyKind }) => AnomalyId;
}

const DEFAULT_SPIKE_THRESHOLD_PERCENT = 25;
const DEFAULT_DISCOUNT_THRESHOLD_PERCENT = 20;
const DEFAULT_BASELINE_WINDOW = 3;

function severityFor(deltaPercent: number, kind: AnomalyKind): AnomalySeverity {
  if (kind === "data_quality_gap") return "medium";
  const magnitude = Math.abs(deltaPercent);
  if (magnitude >= 75) return "high";
  if (magnitude >= 40) return "medium";
  return "low";
}

/**
 * Detects spend anomalies per cost center using a trailing-average baseline.
 * Deterministic: the same records and options always produce the same anomalies.
 *
 * Rules:
 * - A "spike" is flagged when the observed period's spend exceeds the trailing
 *   baseline by at least `spikeThresholdPercent`.
 * - A "discount_opportunity" is flagged when spend falls below baseline by at
 *   least `discountThresholdPercent` (a sustained drop worth investigating and,
 *   often, formalizing as a committed-use or reserved-capacity action).
 * - A "data_quality_gap" is flagged when a period between the first and last
 *   observed period for a cost center has no spend record at all.
 */
export function detectSpendAnomalies(
  tenantId: TenantId,
  records: readonly SpendRecord[],
  options: AnomalyDetectionOptions = {},
): Anomaly[] {
  const spikeThreshold = options.spikeThresholdPercent ?? DEFAULT_SPIKE_THRESHOLD_PERCENT;
  const discountThreshold = options.discountThresholdPercent ?? DEFAULT_DISCOUNT_THRESHOLD_PERCENT;
  const baselineWindow = options.baselineWindow ?? DEFAULT_BASELINE_WINDOW;
  const detectedAt = options.detectedAt ?? new Date(0).toISOString();

  const byCostCenter = new Map<CostCenterId, SpendRecord[]>();
  for (const record of records) {
    const list = byCostCenter.get(record.costCenterId) ?? [];
    list.push(record);
    byCostCenter.set(record.costCenterId, list);
  }

  const anomalies: Anomaly[] = [];
  let sequence = 0;
  const nextId = (costCenterId: CostCenterId, period: ReportingPeriod, kind: AnomalyKind): AnomalyId => {
    sequence += 1;
    if (options.idFactory) return options.idFactory({ costCenterId, period, kind });
    return `${tenantId}:${costCenterId}:${period}:${kind}:${sequence}` as AnomalyId;
  };

  for (const [costCenterId, costCenterRecords] of byCostCenter) {
    const sorted = [...costCenterRecords].sort((a, b) => comparePeriods(a.period, b.period));
    const byPeriod = new Map(sorted.map((r) => [r.period, r] as const));

    // Data-quality gaps: any month strictly between the first and last observed
    // period for this cost center that has no record at all.
    if (sorted.length >= 2) {
      let cursor = sorted[0]!.period;
      const last = sorted[sorted.length - 1]!.period;
      while (comparePeriods(cursor, last) < 0) {
        if (!byPeriod.has(cursor) && comparePeriods(cursor, sorted[0]!.period) > 0) {
          anomalies.push({
            id: nextId(costCenterId, cursor, "data_quality_gap"),
            tenantId,
            costCenterId,
            period: cursor,
            kind: "data_quality_gap",
            severity: severityFor(0, "data_quality_gap"),
            baselineAmount: zeroMoney(sorted[0]!.amount.currency),
            observedAmount: zeroMoney(sorted[0]!.amount.currency),
            deltaPercent: 0,
            detectedAt,
          });
        }
        cursor = nextPeriodOf(cursor);
      }
    }

    // Spikes and discount opportunities against a trailing-average baseline.
    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i]!;
      const windowStart = Math.max(0, i - baselineWindow);
      const window = sorted.slice(windowStart, i);
      if (window.length === 0) continue; // no baseline yet

      const baselineTotal = window.reduce((sum, r) => sum + r.amount.amountMinorUnits, 0);
      const baselineAverage = baselineTotal / window.length;
      if (baselineAverage === 0) continue; // avoid divide-by-zero; a jump from 0 is not flagged here

      const deltaPercent = ((current.amount.amountMinorUnits - baselineAverage) / baselineAverage) * 100;

      if (deltaPercent >= spikeThreshold) {
        anomalies.push({
          id: nextId(costCenterId, current.period, "spike"),
          tenantId,
          costCenterId,
          period: current.period,
          kind: "spike",
          severity: severityFor(deltaPercent, "spike"),
          baselineAmount: money(Math.round(baselineAverage), current.amount.currency),
          observedAmount: current.amount,
          deltaPercent: Math.round(deltaPercent * 100) / 100,
          detectedAt,
        });
      } else if (deltaPercent <= -discountThreshold) {
        anomalies.push({
          id: nextId(costCenterId, current.period, "discount_opportunity"),
          tenantId,
          costCenterId,
          period: current.period,
          kind: "discount_opportunity",
          severity: severityFor(deltaPercent, "discount_opportunity"),
          baselineAmount: money(Math.round(baselineAverage), current.amount.currency),
          observedAmount: current.amount,
          deltaPercent: Math.round(deltaPercent * 100) / 100,
          detectedAt,
        });
      }
    }
  }

  return anomalies.sort((a, b) => {
    const periodCompare = comparePeriods(a.period, b.period);
    if (periodCompare !== 0) return periodCompare;
    return a.costCenterId.localeCompare(b.costCenterId);
  });
}

function nextPeriodOf(period: ReportingPeriod): ReportingPeriod {
  const [yearStr, monthStr] = period.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Proposal drafting and state transitions
// ---------------------------------------------------------------------------

const SAVINGS_ESTIMATE_PERCENT_OF_DELTA = 0.6;

export interface DraftProposalOptions {
  readonly idFactory?: () => ProposalId;
  readonly createdAt?: string;
}

/** Deterministically drafts a savings proposal from a detected anomaly. */
export function draftSavingsProposal(anomaly: Anomaly, options: DraftProposalOptions = {}): SavingsProposal {
  if (anomaly.kind === "data_quality_gap") {
    throw new Error("Cannot draft a savings action from a data-quality-gap anomaly; it has no financial delta.");
  }

  const deltaMinorUnits = Math.abs(anomaly.observedAmount.amountMinorUnits - anomaly.baselineAmount.amountMinorUnits);
  const estimatedSavings = money(
    Math.round(deltaMinorUnits * SAVINGS_ESTIMATE_PERCENT_OF_DELTA),
    anomaly.observedAmount.currency,
  );

  const id = options.idFactory ? options.idFactory() : (`${anomaly.id}:proposal` as ProposalId);
  const createdAt = options.createdAt ?? new Date(0).toISOString();

  const title =
    anomaly.kind === "spike"
      ? `Investigate and reduce spend spike (${anomaly.deltaPercent}%)`
      : `Formalize sustained discount opportunity (${anomaly.deltaPercent}%)`;

  return {
    id,
    tenantId: anomaly.tenantId,
    anomalyId: anomaly.id,
    title,
    description: `Baseline ${anomaly.baselineAmount.amountMinorUnits} ${anomaly.baselineAmount.currency}, observed ${anomaly.observedAmount.amountMinorUnits} ${anomaly.observedAmount.currency} in ${anomaly.period}.`,
    estimatedSavings,
    status: "draft",
    version: 1,
    createdAt,
  };
}

const ALLOWED_TRANSITIONS: Record<ProposalStatus, readonly ProposalStatus[]> = {
  draft: ["submitted"],
  submitted: ["approved", "rejected"],
  approved: ["executed"],
  rejected: [],
  executed: ["rolled_back"],
  rolled_back: [],
};

export interface TransitionResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

/** Pure state-machine check. Never mutates; callers apply the transition if allowed. */
export function canTransitionProposal(from: ProposalStatus, to: ProposalStatus): TransitionResult {
  const allowedTargets = ALLOWED_TRANSITIONS[from];
  if (allowedTargets.includes(to)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Cannot transition proposal from "${from}" to "${to}". Allowed targets from "${from}": ${
      allowedTargets.length > 0 ? allowedTargets.join(", ") : "(none — terminal state)"
    }.`,
  };
}

/** Applies a validated transition, bumping the version. Throws if the transition is not allowed. */
export function transitionProposal(proposal: SavingsProposal, to: ProposalStatus): SavingsProposal {
  const result = canTransitionProposal(proposal.status, to);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
  return { ...proposal, status: to, version: proposal.version + 1 };
}

export function isValidPeriodRange(from: ReportingPeriod, to: ReportingPeriod): boolean {
  return isValidReportingPeriod(from) && isValidReportingPeriod(to) && comparePeriods(from, to) <= 0;
}
