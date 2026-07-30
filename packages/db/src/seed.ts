import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as schema from "./schema";

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Idempotent demo seed: loads scenario-packs/seed/demo-corp.json and upserts
 * the tenant, cost centers, and spend records. Safe to run repeatedly —
 * `onConflictDoUpdate` on the primary key means no duplicate rows are ever
 * created for Demo Corp.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and set it first.");
  }

  const fixturePath = path.resolve(__dirname, "../../../scenario-packs/seed/demo-corp.json");
  const fixture = JSON.parse(readFileSync(fixturePath, "utf-8")) as DemoCorpFixture;

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  console.log(`Seeding tenant "${fixture.tenant.name}" ...`);

  await db
    .insert(schema.tenants)
    .values({ id: fixture.tenant.id, name: fixture.tenant.name })
    .onConflictDoUpdate({ target: schema.tenants.id, set: { name: fixture.tenant.name } });

  for (const cc of fixture.costCenters) {
    await db
      .insert(schema.costCenters)
      .values({ id: cc.id, tenantId: cc.tenantId, name: cc.name, cloudProvider: cc.cloudProvider })
      .onConflictDoUpdate({
        target: schema.costCenters.id,
        set: { name: cc.name, cloudProvider: cc.cloudProvider },
      });
  }

  for (const sr of fixture.spendRecords) {
    await db
      .insert(schema.spendRecords)
      .values({
        id: sr.id,
        tenantId: sr.tenantId,
        costCenterId: sr.costCenterId,
        period: sr.period,
        amountMinorUnits: sr.amount.amountMinorUnits,
        currency: sr.amount.currency,
        recordedAt: new Date(sr.recordedAt),
      })
      .onConflictDoUpdate({
        target: schema.spendRecords.id,
        set: {
          amountMinorUnits: sr.amount.amountMinorUnits,
          currency: sr.amount.currency,
          recordedAt: new Date(sr.recordedAt),
        },
      });
  }

  console.log(
    `Seeded ${fixture.costCenters.length} cost centers and ${fixture.spendRecords.length} spend records.`,
  );

  await client.end();
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
