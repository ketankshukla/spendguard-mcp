import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  anomalies,
  costCenters,
  savingsProposals,
  spendRecords,
  tenants,
} from "../src/schema";

describe("schema tenancy invariants", () => {
  it("gives every tenant-owned table a tenant_id column", () => {
    for (const table of [costCenters, spendRecords, anomalies, savingsProposals]) {
      const config = getTableConfig(table);
      const columnNames = config.columns.map((c) => c.name);
      expect(columnNames).toContain("tenant_id");
    }
  });

  it("does not require tenant_id on the tenants table itself", () => {
    const config = getTableConfig(tenants);
    expect(config.columns.map((c) => c.name)).toContain("id");
  });

  it("enforces a compound unique constraint scoped to the tenant on spend_records", () => {
    const config = getTableConfig(spendRecords);
    const uniqueColumnSets = config.uniqueConstraints.map((u) => u.columns.map((c) => c.name));
    expect(uniqueColumnSets.some((cols) => cols.includes("tenant_id"))).toBe(true);
  });
});
