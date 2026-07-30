/**
 * Drizzle schema for SpendGuard AI. Every tenant-owned table carries an
 * explicit `tenant_id` column and a compound uniqueness constraint scoped to
 * the tenant, so a cross-tenant lookup can never silently match another
 * tenant's row.
 */

import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    principalId: text("principal_id").notNull(),
    role: text("role", { enum: ["viewer", "analyst", "approver", "admin"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("memberships_tenant_principal_unique").on(table.tenantId, table.principalId),
    index("memberships_tenant_id_idx").on(table.tenantId),
  ],
);

export const costCenters = pgTable(
  "cost_centers",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    cloudProvider: text("cloud_provider", { enum: ["aws", "gcp", "azure", "simulated"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("cost_centers_tenant_id_unique").on(table.tenantId, table.id),
    index("cost_centers_tenant_id_idx").on(table.tenantId),
  ],
);

export const spendRecords = pgTable(
  "spend_records",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    costCenterId: text("cost_center_id")
      .notNull()
      .references(() => costCenters.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    amountMinorUnits: integer("amount_minor_units").notNull(),
    currency: text("currency").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("spend_records_tenant_cc_period_unique").on(table.tenantId, table.costCenterId, table.period),
    index("spend_records_tenant_id_idx").on(table.tenantId),
    index("spend_records_period_idx").on(table.period),
  ],
);

export const anomalies = pgTable(
  "anomalies",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    costCenterId: text("cost_center_id")
      .notNull()
      .references(() => costCenters.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    kind: text("kind", { enum: ["spike", "discount_opportunity", "data_quality_gap"] }).notNull(),
    severity: text("severity", { enum: ["low", "medium", "high"] }).notNull(),
    baselineAmountMinorUnits: integer("baseline_amount_minor_units").notNull(),
    baselineCurrency: text("baseline_currency").notNull(),
    observedAmountMinorUnits: integer("observed_amount_minor_units").notNull(),
    observedCurrency: text("observed_currency").notNull(),
    deltaPercent: real("delta_percent").notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("anomalies_tenant_id_unique").on(table.tenantId, table.id),
    index("anomalies_tenant_id_idx").on(table.tenantId),
  ],
);

export const savingsProposals = pgTable(
  "savings_proposals",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    anomalyId: text("anomaly_id")
      .notNull()
      .references(() => anomalies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    estimatedSavingsMinorUnits: integer("estimated_savings_minor_units").notNull(),
    currency: text("currency").notNull(),
    status: text("status", {
      enum: ["draft", "submitted", "approved", "rejected", "executed", "rolled_back"],
    }).notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("savings_proposals_tenant_id_unique").on(table.tenantId, table.id),
    index("savings_proposals_tenant_id_idx").on(table.tenantId),
  ],
);

export const approvals = pgTable(
  "approvals",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => savingsProposals.id, { onDelete: "cascade" }),
    approverId: text("approver_id").notNull(),
    decision: text("decision", { enum: ["approved", "rejected"] }).notNull(),
    boundProposalVersion: integer("bound_proposal_version").notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("approvals_tenant_id_unique").on(table.tenantId, table.id),
    index("approvals_tenant_id_idx").on(table.tenantId),
  ],
);

export const executions = pgTable(
  "executions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => savingsProposals.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "in_progress", "succeeded", "failed", "unknown"] }).notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("executions_tenant_id_unique").on(table.tenantId, table.id),
    unique("executions_idempotency_key_unique").on(table.tenantId, table.idempotencyKey),
    index("executions_tenant_id_idx").on(table.tenantId),
  ],
);

export const receipts = pgTable(
  "receipts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    executionId: text("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => savingsProposals.id, { onDelete: "cascade" }),
    outcome: text("outcome", { enum: ["success", "failure"] }).notNull(),
    realizedSavingsMinorUnits: integer("realized_savings_minor_units"),
    realizedSavingsCurrency: text("realized_savings_currency"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("receipts_tenant_id_unique").on(table.tenantId, table.id),
    unique("receipts_execution_unique").on(table.tenantId, table.executionId),
    index("receipts_tenant_id_idx").on(table.tenantId),
  ],
);

export const durableTasks = pgTable(
  "durable_tasks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    status: text("status", { enum: ["pending", "in_progress", "succeeded", "failed"] }).notNull(),
    payload: text("payload").notNull(),
    attempt: integer("attempt").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("durable_tasks_tenant_id_unique").on(table.tenantId, table.id),
    index("durable_tasks_tenant_id_idx").on(table.tenantId),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actorPrincipalId: text("actor_principal_id").notNull(),
    action: text("action").notNull(),
    objectType: text("object_type").notNull(),
    objectId: text("object_id").notNull(),
    redacted: boolean("redacted").notNull().default(true),
    detail: text("detail"),
    traceId: text("trace_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("audit_events_tenant_id_unique").on(table.tenantId, table.id),
    index("audit_events_tenant_id_idx").on(table.tenantId),
    index("audit_events_trace_id_idx").on(table.traceId),
  ],
);
