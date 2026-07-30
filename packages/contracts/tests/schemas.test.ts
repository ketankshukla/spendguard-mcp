import { describe, expect, it } from "vitest";
import {
  AnomalySchema,
  GetSpendSummaryOutputSchema,
  MoneySchema,
  SavingsProposalSchema,
} from "../src/schemas.js";

describe("MoneySchema", () => {
  it("accepts integer minor units with a 3-letter currency", () => {
    expect(MoneySchema.safeParse({ amountMinorUnits: 100, currency: "USD" }).success).toBe(true);
  });

  it("rejects non-integer amounts", () => {
    expect(MoneySchema.safeParse({ amountMinorUnits: 1.5, currency: "USD" }).success).toBe(false);
  });

  it("rejects malformed currency codes", () => {
    expect(MoneySchema.safeParse({ amountMinorUnits: 100, currency: "US" }).success).toBe(false);
  });
});

describe("AnomalySchema", () => {
  it("accepts a well-formed anomaly", () => {
    const result = AnomalySchema.safeParse({
      id: "a1",
      tenantId: "t1",
      costCenterId: "cc1",
      period: "2026-01",
      kind: "spike",
      severity: "high",
      baselineAmount: { amountMinorUnits: 1000, currency: "USD" },
      observedAmount: { amountMinorUnits: 2000, currency: "USD" },
      deltaPercent: 100,
      detectedAt: "2026-01-31T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid reporting period", () => {
    const result = AnomalySchema.safeParse({
      id: "a1",
      tenantId: "t1",
      costCenterId: "cc1",
      period: "2026-13",
      kind: "spike",
      severity: "high",
      baselineAmount: { amountMinorUnits: 1000, currency: "USD" },
      observedAmount: { amountMinorUnits: 2000, currency: "USD" },
      deltaPercent: 100,
      detectedAt: "2026-01-31T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("SavingsProposalSchema", () => {
  it("requires a positive version", () => {
    const base = {
      id: "p1",
      tenantId: "t1",
      anomalyId: "a1",
      title: "Reduce spend",
      description: "desc",
      estimatedSavings: { amountMinorUnits: 500, currency: "USD" },
      status: "draft" as const,
      createdAt: "2026-01-31T00:00:00.000Z",
    };
    expect(SavingsProposalSchema.safeParse({ ...base, version: 1 }).success).toBe(true);
    expect(SavingsProposalSchema.safeParse({ ...base, version: 0 }).success).toBe(false);
  });
});

describe("GetSpendSummaryOutputSchema", () => {
  it("requires the contract envelope fields", () => {
    const result = GetSpendSummaryOutputSchema.safeParse({
      contractVersion: "v1",
      traceId: "trace-1",
      fromPeriod: "2026-01",
      toPeriod: "2026-03",
      totalsByCostCenter: [],
      dataFreshness: "2026-03-31T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing traceId", () => {
    const result = GetSpendSummaryOutputSchema.safeParse({
      contractVersion: "v1",
      fromPeriod: "2026-01",
      toPeriod: "2026-03",
      totalsByCostCenter: [],
      dataFreshness: "2026-03-31T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
