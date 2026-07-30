/**
 * Zod input/output schemas shared at every trust boundary: MCP tool
 * inputs/outputs, HTTP API bodies, and the Python risk service's fixtures.
 *
 * These schemas are SHAPE checks only. They never grant authority — tenant,
 * role, and scope must always come from verified server context, never from
 * a schema-validated field in the request body.
 */

import { z } from "zod";

export const MoneySchema = z.object({
  amountMinorUnits: z.number().int(),
  currency: z.string().length(3),
});

export const ReportingPeriodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Reporting period must be an ISO month, e.g. 2026-01");

export const UtcInstantSchema = z.string().datetime({ offset: false });

export const AnomalyKindSchema = z.enum(["spike", "discount_opportunity", "data_quality_gap"]);
export const AnomalySeveritySchema = z.enum(["low", "medium", "high"]);
export const ProposalStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
  "executed",
  "rolled_back",
]);
export const ExecutionStatusSchema = z.enum(["pending", "in_progress", "succeeded", "failed", "unknown"]);

export const CostCenterSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  cloudProvider: z.enum(["aws", "gcp", "azure", "simulated"]),
});

export const SpendRecordSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  costCenterId: z.string().min(1),
  period: ReportingPeriodSchema,
  amount: MoneySchema,
  recordedAt: UtcInstantSchema,
});

export const AnomalySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  costCenterId: z.string().min(1),
  period: ReportingPeriodSchema,
  kind: AnomalyKindSchema,
  severity: AnomalySeveritySchema,
  baselineAmount: MoneySchema,
  observedAmount: MoneySchema,
  deltaPercent: z.number(),
  detectedAt: UtcInstantSchema,
});

export const SavingsProposalSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  anomalyId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  estimatedSavings: MoneySchema,
  status: ProposalStatusSchema,
  version: z.number().int().positive(),
  createdAt: UtcInstantSchema,
});

// ---------------------------------------------------------------------------
// MCP tool boundary schemas (contractVersion + traceId envelope conventions)
// ---------------------------------------------------------------------------

export const ContractEnvelopeSchema = z.object({
  contractVersion: z.string().min(1),
  traceId: z.string().min(1),
});

export const ListCostCentersInputSchema = z.object({
  tenantId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const ListCostCentersOutputSchema = ContractEnvelopeSchema.extend({
  costCenters: z.array(CostCenterSchema),
  nextCursor: z.string().nullable(),
});

export const GetSpendSummaryInputSchema = z.object({
  tenantId: z.string().min(1),
  fromPeriod: ReportingPeriodSchema,
  toPeriod: ReportingPeriodSchema,
  costCenterId: z.string().min(1).optional(),
});

export const GetSpendSummaryOutputSchema = ContractEnvelopeSchema.extend({
  fromPeriod: ReportingPeriodSchema,
  toPeriod: ReportingPeriodSchema,
  totalsByCostCenter: z.array(
    z.object({
      costCenterId: z.string().min(1),
      period: ReportingPeriodSchema,
      total: MoneySchema,
    }),
  ),
  dataFreshness: UtcInstantSchema,
});

export const DetectSpendAnomaliesInputSchema = z.object({
  tenantId: z.string().min(1),
  fromPeriod: ReportingPeriodSchema,
  toPeriod: ReportingPeriodSchema,
});

export const DetectSpendAnomaliesOutputSchema = ContractEnvelopeSchema.extend({
  anomalies: z.array(AnomalySchema),
  dataFreshness: UtcInstantSchema,
});

export const GetAnomalyDetailInputSchema = z.object({
  tenantId: z.string().min(1),
  anomalyId: z.string().min(1),
});

export const GetAnomalyDetailOutputSchema = ContractEnvelopeSchema.extend({
  anomaly: AnomalySchema,
});

export const DraftSavingsActionInputSchema = z.object({
  tenantId: z.string().min(1),
  anomalyId: z.string().min(1),
});

export const DraftSavingsActionOutputSchema = ContractEnvelopeSchema.extend({
  proposal: SavingsProposalSchema,
});

// ---------------------------------------------------------------------------
// Structured error envelope
// ---------------------------------------------------------------------------

export const ErrorCategorySchema = z.enum([
  "validation",
  "authentication",
  "authorization",
  "conflict",
  "rate_limit",
  "dependency",
  "timeout",
  "unknown_outcome",
  "internal",
]);

export const ErrorEnvelopeSchema = z.object({
  category: ErrorCategorySchema,
  message: z.string().min(1),
  traceId: z.string().min(1),
  retryable: z.boolean(),
});

export type Money = z.infer<typeof MoneySchema>;
export type CostCenter = z.infer<typeof CostCenterSchema>;
export type SpendRecordContract = z.infer<typeof SpendRecordSchema>;
export type AnomalyContract = z.infer<typeof AnomalySchema>;
export type SavingsProposalContract = z.infer<typeof SavingsProposalSchema>;
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
