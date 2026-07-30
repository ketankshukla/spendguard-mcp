import { eq } from "drizzle-orm";
import type { Tenant } from "@spendguard/domain";
import { asTenantId } from "@spendguard/domain";
import type { Database } from "../client";
import { tenants } from "../schema";

export async function getTenant(db: Database, tenantId: string): Promise<Tenant | null> {
  const rows = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return { id: asTenantId(row.id), name: row.name };
}
