import { eq } from "drizzle-orm";
import type { CostCenter } from "@spendguard/domain";
import { asCostCenterId, asTenantId } from "@spendguard/domain";
import type { Database } from "../client";
import { costCenters } from "../schema";

/** Always scoped to a single tenant — never returns another tenant's cost centers. */
export async function listCostCenters(db: Database, tenantId: string): Promise<CostCenter[]> {
  const rows = await db.select().from(costCenters).where(eq(costCenters.tenantId, tenantId));
  return rows.map((row) => ({
    id: asCostCenterId(row.id),
    tenantId: asTenantId(row.tenantId),
    name: row.name,
    cloudProvider: row.cloudProvider,
  }));
}
