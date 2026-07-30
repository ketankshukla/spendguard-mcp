import { and, eq, gte, lte } from "drizzle-orm";
import type { SpendRecord } from "@spendguard/domain";
import { asCostCenterId, asSpendRecordId, asTenantId } from "@spendguard/domain";
import type { Database } from "../client";
import { spendRecords } from "../schema";

export interface ListSpendRecordsOptions {
  readonly fromPeriod?: string;
  readonly toPeriod?: string;
  readonly costCenterId?: string;
}

/** Always scoped to a single tenant — never returns another tenant's spend records. */
export async function listSpendRecords(
  db: Database,
  tenantId: string,
  options: ListSpendRecordsOptions = {},
): Promise<SpendRecord[]> {
  const conditions = [eq(spendRecords.tenantId, tenantId)];
  if (options.fromPeriod) conditions.push(gte(spendRecords.period, options.fromPeriod));
  if (options.toPeriod) conditions.push(lte(spendRecords.period, options.toPeriod));
  if (options.costCenterId) conditions.push(eq(spendRecords.costCenterId, options.costCenterId));

  const rows = await db
    .select()
    .from(spendRecords)
    .where(and(...conditions));

  return rows.map((row) => ({
    id: asSpendRecordId(row.id),
    tenantId: asTenantId(row.tenantId),
    costCenterId: asCostCenterId(row.costCenterId),
    period: row.period,
    amount: { amountMinorUnits: row.amountMinorUnits, currency: row.currency },
    recordedAt: row.recordedAt.toISOString(),
  }));
}
