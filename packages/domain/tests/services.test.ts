import { describe, expect, it } from "vitest";
import {
  asCostCenterId,
  asTenantId,
  money,
  type SpendRecord,
} from "../src/entities.js";
import {
  canTransitionProposal,
  detectSpendAnomalies,
  draftSavingsProposal,
  summarizeSpendByCostCenter,
  summarizeSpendTrend,
  totalSpend,
  transitionProposal,
} from "../src/services.js";

const tenantId = asTenantId("tenant-demo");
const computeCostCenterId = asCostCenterId("cc-compute");

function record(period: string, amountMinorUnits: number, id = `${period}-${amountMinorUnits}`): SpendRecord {
  return {
    id: id as SpendRecord["id"],
    tenantId,
    costCenterId: computeCostCenterId,
    period,
    amount: money(amountMinorUnits),
    recordedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("summarizeSpendByCostCenter", () => {
  it("aggregates multiple records in the same period and cost center", () => {
    const records = [record("2026-01", 1000, "a"), record("2026-01", 500, "b")];
    const summary = summarizeSpendByCostCenter(records);
    expect(summary).toHaveLength(1);
    expect(summary[0]?.total.amountMinorUnits).toBe(1500);
  });

  it("returns an empty array for zero spend", () => {
    expect(summarizeSpendByCostCenter([])).toEqual([]);
  });
});

describe("summarizeSpendTrend and totalSpend", () => {
  it("computes a deterministic trend sorted by period", () => {
    const records = [record("2026-02", 200, "b"), record("2026-01", 100, "a")];
    const trend = summarizeSpendTrend(records);
    expect(trend.map((p) => p.period)).toEqual(["2026-01", "2026-02"]);
    expect(totalSpend(records).amountMinorUnits).toBe(300);
  });

  it("returns zero total spend for an empty record set", () => {
    expect(totalSpend([]).amountMinorUnits).toBe(0);
  });
});

describe("detectSpendAnomalies", () => {
  it("flags a spike when spend jumps well above the trailing baseline", () => {
    const records = [
      record("2026-01", 10000),
      record("2026-02", 10500),
      record("2026-03", 9800),
      record("2026-04", 20000), // ~ +97% vs avg(10000,10500,9800)
    ];
    const anomalies = detectSpendAnomalies(tenantId, records, { detectedAt: "2026-05-01T00:00:00.000Z" });
    const spikes = anomalies.filter((a) => a.kind === "spike");
    expect(spikes).toHaveLength(1);
    expect(spikes[0]?.period).toBe("2026-04");
    expect(spikes[0]?.severity).toBe("high");
  });

  it("flags a discount opportunity on a sustained negative adjustment", () => {
    const records = [
      record("2026-01", 10000),
      record("2026-02", 10000),
      record("2026-03", 10000),
      record("2026-04", 7500), // -25%
    ];
    const anomalies = detectSpendAnomalies(tenantId, records, { detectedAt: "2026-05-01T00:00:00.000Z" });
    const discounts = anomalies.filter((a) => a.kind === "discount_opportunity");
    expect(discounts).toHaveLength(1);
    expect(discounts[0]?.deltaPercent).toBeLessThan(0);
  });

  it("flags a data-quality gap for a missing month between observed periods", () => {
    const records = [record("2026-01", 5000), record("2026-03", 5200)];
    const anomalies = detectSpendAnomalies(tenantId, records, { detectedAt: "2026-04-01T00:00:00.000Z" });
    const gaps = anomalies.filter((a) => a.kind === "data_quality_gap");
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.period).toBe("2026-02");
  });

  it("does not flag anomalies with fewer than one baseline period", () => {
    const records = [record("2026-01", 10000)];
    expect(detectSpendAnomalies(tenantId, records)).toEqual([]);
  });

  it("is deterministic: same input produces same output", () => {
    const records = [record("2026-01", 10000), record("2026-02", 10000), record("2026-03", 20000)];
    const first = detectSpendAnomalies(tenantId, records, { detectedAt: "2026-04-01T00:00:00.000Z" });
    const second = detectSpendAnomalies(tenantId, records, { detectedAt: "2026-04-01T00:00:00.000Z" });
    expect(first).toEqual(second);
  });
});

describe("draftSavingsProposal", () => {
  it("estimates savings as a fraction of the observed delta and rounds to an integer", () => {
    const anomaly = detectSpendAnomalies(
      tenantId,
      [record("2026-01", 10000), record("2026-02", 10000), record("2026-03", 10000), record("2026-04", 20000)],
      { detectedAt: "2026-05-01T00:00:00.000Z" },
    )[0]!;
    const proposal = draftSavingsProposal(anomaly, {
      idFactory: () => "proposal-1" as never,
      createdAt: "2026-05-01T00:00:00.000Z",
    });
    expect(Number.isInteger(proposal.estimatedSavings.amountMinorUnits)).toBe(true);
    expect(proposal.status).toBe("draft");
    expect(proposal.version).toBe(1);
  });

  it("rejects drafting a savings action from a data-quality-gap anomaly", () => {
    const anomaly = detectSpendAnomalies(tenantId, [record("2026-01", 5000), record("2026-03", 5200)], {
      detectedAt: "2026-04-01T00:00:00.000Z",
    }).find((a) => a.kind === "data_quality_gap")!;
    expect(() => draftSavingsProposal(anomaly)).toThrow();
  });
});

describe("proposal state transitions", () => {
  it("allows the documented forward path and rejects skipping steps", () => {
    expect(canTransitionProposal("draft", "submitted").allowed).toBe(true);
    expect(canTransitionProposal("draft", "approved").allowed).toBe(false);
    expect(canTransitionProposal("submitted", "approved").allowed).toBe(true);
    expect(canTransitionProposal("approved", "executed").allowed).toBe(true);
    expect(canTransitionProposal("executed", "rolled_back").allowed).toBe(true);
  });

  it("rejects transitions out of terminal states", () => {
    expect(canTransitionProposal("rejected", "approved").allowed).toBe(false);
    expect(canTransitionProposal("rolled_back", "executed").allowed).toBe(false);
  });

  it("bumps version on an applied transition and throws on an invalid one", () => {
    const anomaly = detectSpendAnomalies(
      tenantId,
      [record("2026-01", 10000), record("2026-02", 10000), record("2026-03", 10000), record("2026-04", 20000)],
      { detectedAt: "2026-05-01T00:00:00.000Z" },
    )[0]!;
    const proposal = draftSavingsProposal(anomaly, { createdAt: "2026-05-01T00:00:00.000Z" });
    const submitted = transitionProposal(proposal, "submitted");
    expect(submitted.version).toBe(2);
    expect(() => transitionProposal(submitted, "executed")).toThrow();
  });
});
