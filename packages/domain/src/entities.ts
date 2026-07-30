/**
 * Core FinOps domain entities and value objects.
 *
 * This module imports nothing from Next.js, MCP, a database driver, a workflow
 * engine, or a model provider. It is pure TypeScript business vocabulary that
 * every other layer (UI, MCP tools, Python risk service via shared contracts)
 * treats as ground truth.
 */

// ---------------------------------------------------------------------------
// Opaque identifiers
// ---------------------------------------------------------------------------

declare const brand: unique symbol;
type Branded<T, B extends string> = T & { readonly [brand]: B };

export type TenantId = Branded<string, "TenantId">;
export type CostCenterId = Branded<string, "CostCenterId">;
export type SpendRecordId = Branded<string, "SpendRecordId">;
export type AnomalyId = Branded<string, "AnomalyId">;
export type ProposalId = Branded<string, "ProposalId">;
export type ApprovalId = Branded<string, "ApprovalId">;
export type ExecutionId = Branded<string, "ExecutionId">;
export type ReceiptId = Branded<string, "ReceiptId">;
export type PrincipalId = Branded<string, "PrincipalId">;

export function asTenantId(value: string): TenantId {
  return value as TenantId;
}
export function asCostCenterId(value: string): CostCenterId {
  return value as CostCenterId;
}
export function asSpendRecordId(value: string): SpendRecordId {
  return value as SpendRecordId;
}
export function asAnomalyId(value: string): AnomalyId {
  return value as AnomalyId;
}
export function asProposalId(value: string): ProposalId {
  return value as ProposalId;
}

// ---------------------------------------------------------------------------
// Money and time
// ---------------------------------------------------------------------------

/** Money is always integer minor units (e.g. cents) plus an explicit ISO 4217 currency. */
export interface Money {
  readonly amountMinorUnits: number;
  readonly currency: string;
}

export function money(amountMinorUnits: number, currency = "USD"): Money {
  if (!Number.isInteger(amountMinorUnits)) {
    throw new Error(`Money amounts must be integer minor units, got ${amountMinorUnits}`);
  }
  return { amountMinorUnits, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add Money of different currencies: ${a.currency} vs ${b.currency}`);
  }
  return money(a.amountMinorUnits + b.amountMinorUnits, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot subtract Money of different currencies: ${a.currency} vs ${b.currency}`);
  }
  return money(a.amountMinorUnits - b.amountMinorUnits, a.currency);
}

export function zeroMoney(currency = "USD"): Money {
  return money(0, currency);
}

/** An explicit UTC instant, always represented as an ISO-8601 string with a "Z" suffix. */
export type UtcInstant = string;

export function nowUtc(): UtcInstant {
  return new Date().toISOString();
}

/** An explicit monthly reporting period, e.g. "2026-01". Never a Date/Month index. */
export type ReportingPeriod = string;

export function isValidReportingPeriod(period: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

export function comparePeriods(a: ReportingPeriod, b: ReportingPeriod): number {
  return a.localeCompare(b);
}

export function previousPeriod(period: ReportingPeriod): ReportingPeriod {
  const [yearStr, monthStr] = period.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Tenant {
  readonly id: TenantId;
  readonly name: string;
}

export interface CostCenter {
  readonly id: CostCenterId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly cloudProvider: "aws" | "gcp" | "azure" | "simulated";
}

export interface SpendRecord {
  readonly id: SpendRecordId;
  readonly tenantId: TenantId;
  readonly costCenterId: CostCenterId;
  readonly period: ReportingPeriod;
  readonly amount: Money;
  readonly recordedAt: UtcInstant;
}

export type AnomalyKind = "spike" | "discount_opportunity" | "data_quality_gap";
export type AnomalySeverity = "low" | "medium" | "high";

export interface Anomaly {
  readonly id: AnomalyId;
  readonly tenantId: TenantId;
  readonly costCenterId: CostCenterId;
  readonly period: ReportingPeriod;
  readonly kind: AnomalyKind;
  readonly severity: AnomalySeverity;
  readonly baselineAmount: Money;
  readonly observedAmount: Money;
  /** Signed percentage change from baseline to observed, e.g. 42.5 or -30. */
  readonly deltaPercent: number;
  readonly detectedAt: UtcInstant;
}

export type ProposalStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "executed"
  | "rolled_back";

export interface SavingsProposal {
  readonly id: ProposalId;
  readonly tenantId: TenantId;
  readonly anomalyId: AnomalyId;
  readonly title: string;
  readonly description: string;
  readonly estimatedSavings: Money;
  readonly status: ProposalStatus;
  /** Incremented on every mutation; approvals bind to an exact version. */
  readonly version: number;
  readonly createdAt: UtcInstant;
}

export interface Approval {
  readonly id: ApprovalId;
  readonly proposalId: ProposalId;
  readonly approverId: PrincipalId;
  readonly decision: "approved" | "rejected";
  /** The exact proposal version this approval is bound to. */
  readonly boundProposalVersion: number;
  readonly decidedAt: UtcInstant;
}

export type ExecutionStatus = "pending" | "in_progress" | "succeeded" | "failed" | "unknown";

export interface Execution {
  readonly id: ExecutionId;
  readonly proposalId: ProposalId;
  readonly status: ExecutionStatus;
  readonly idempotencyKey: string;
  readonly startedAt: UtcInstant;
  readonly completedAt: UtcInstant | null;
}

export interface Receipt {
  readonly id: ReceiptId;
  readonly executionId: ExecutionId;
  readonly proposalId: ProposalId;
  readonly outcome: "success" | "failure";
  readonly realizedSavings: Money | null;
  readonly issuedAt: UtcInstant;
}
