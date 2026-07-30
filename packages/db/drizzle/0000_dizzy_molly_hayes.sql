CREATE TABLE "anomalies" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"cost_center_id" text NOT NULL,
	"period" text NOT NULL,
	"kind" text NOT NULL,
	"severity" text NOT NULL,
	"baseline_amount_minor_units" integer NOT NULL,
	"baseline_currency" text NOT NULL,
	"observed_amount_minor_units" integer NOT NULL,
	"observed_currency" text NOT NULL,
	"delta_percent" real NOT NULL,
	"detected_at" timestamp with time zone NOT NULL,
	CONSTRAINT "anomalies_tenant_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"proposal_id" text NOT NULL,
	"approver_id" text NOT NULL,
	"decision" text NOT NULL,
	"bound_proposal_version" integer NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approvals_tenant_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"actor_principal_id" text NOT NULL,
	"action" text NOT NULL,
	"object_type" text NOT NULL,
	"object_id" text NOT NULL,
	"redacted" boolean DEFAULT true NOT NULL,
	"detail" text,
	"trace_id" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_tenant_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"cloud_provider" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cost_centers_tenant_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "durable_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"payload" text NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "durable_tasks_tenant_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "executions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"proposal_id" text NOT NULL,
	"status" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "executions_tenant_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "executions_idempotency_key_unique" UNIQUE("tenant_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"principal_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_tenant_principal_unique" UNIQUE("tenant_id","principal_id")
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"execution_id" text NOT NULL,
	"proposal_id" text NOT NULL,
	"outcome" text NOT NULL,
	"realized_savings_minor_units" integer,
	"realized_savings_currency" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_tenant_id_unique" UNIQUE("tenant_id","id"),
	CONSTRAINT "receipts_execution_unique" UNIQUE("tenant_id","execution_id")
);
--> statement-breakpoint
CREATE TABLE "savings_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"anomaly_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"estimated_savings_minor_units" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "savings_proposals_tenant_id_unique" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "spend_records" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"cost_center_id" text NOT NULL,
	"period" text NOT NULL,
	"amount_minor_units" integer NOT NULL,
	"currency" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "spend_records_tenant_cc_period_unique" UNIQUE("tenant_id","cost_center_id","period")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_proposal_id_savings_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."savings_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "durable_tasks" ADD CONSTRAINT "durable_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_proposal_id_savings_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."savings_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_proposal_id_savings_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."savings_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_proposals" ADD CONSTRAINT "savings_proposals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_proposals" ADD CONSTRAINT "savings_proposals_anomaly_id_anomalies_id_fk" FOREIGN KEY ("anomaly_id") REFERENCES "public"."anomalies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_records" ADD CONSTRAINT "spend_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_records" ADD CONSTRAINT "spend_records_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anomalies_tenant_id_idx" ON "anomalies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "approvals_tenant_id_idx" ON "approvals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_events_tenant_id_idx" ON "audit_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_events_trace_id_idx" ON "audit_events" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "cost_centers_tenant_id_idx" ON "cost_centers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "durable_tasks_tenant_id_idx" ON "durable_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "executions_tenant_id_idx" ON "executions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "memberships_tenant_id_idx" ON "memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "receipts_tenant_id_idx" ON "receipts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "savings_proposals_tenant_id_idx" ON "savings_proposals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "spend_records_tenant_id_idx" ON "spend_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "spend_records_period_idx" ON "spend_records" USING btree ("period");