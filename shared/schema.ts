import { pgTable, text, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── TENANTS (businesses using the platform) ─────────────────────────────────
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  businessType: text("business_type").notNull(),
  phone: text("phone"),
  assignedNumber: text("assigned_number"),
  status: text("status").notNull().default("onboarding"), // onboarding | active | suspended
  greeting: text("greeting"),
  aiPersona: text("ai_persona"),
  timezone: text("timezone").default("America/Chicago"),
  minutesUsed: real("minutes_used").notNull().default(0),
  minutesCredit: real("minutes_credit").notNull().default(0),
  plan: text("plan").notNull().default("starter"),
  createdAt: text("created_at").notNull(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// ─── INTAKE FIELDS (custom data collected during calls) ───────────────────────
export const intakeFields = pgTable("intake_fields", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  label: text("label").notNull(),
  fieldKey: text("field_key").notNull(),
  fieldType: text("field_type").notNull().default("text"), // text | boolean | enum | date
  required: boolean("required").notNull().default(true),
  options: text("options").array(), // for enum types
  order: integer("order").notNull().default(0),
  aiPrompt: text("ai_prompt"), // what AI asks caller to get this field
});

export const insertIntakeFieldSchema = createInsertSchema(intakeFields).omit({ id: true });
export type InsertIntakeField = z.infer<typeof insertIntakeFieldSchema>;
export type IntakeField = typeof intakeFields.$inferSelect;

// ─── FAQS ─────────────────────────────────────────────────────────────────────
export const faqs = pgTable("faqs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull().default(0),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({ id: true });
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

// ─── ESCALATION RULES ─────────────────────────────────────────────────────────
export const escalationRules = pgTable("escalation_rules", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  trigger: text("trigger").notNull(), // e.g. "emergency", "complaint", "appointment"
  action: text("action").notNull(),   // transfer | sms | email | voicemail
  destination: text("destination"),   // phone/email to route to
  message: text("message"),
});

export const insertEscalationRuleSchema = createInsertSchema(escalationRules).omit({ id: true });
export type InsertEscalationRule = z.infer<typeof insertEscalationRuleSchema>;
export type EscalationRule = typeof escalationRules.$inferSelect;

// ─── CALLS ────────────────────────────────────────────────────────────────────
export const calls = pgTable("calls", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  callerNumber: text("caller_number"),
  callerName: text("caller_name"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  durationMinutes: real("duration_minutes").notNull().default(0),
  status: text("status").notNull().default("in_progress"), // in_progress | completed | escalated | missed
  aiSummary: text("ai_summary"),
  sentiment: text("sentiment"), // positive | neutral | negative | urgent
  transcript: text("transcript"),
  collectedData: jsonb("collected_data"), // { fieldKey: value }
  escalated: boolean("escalated").notNull().default(false),
  recordingUrl: text("recording_url"),
});

export const insertCallSchema = createInsertSchema(calls).omit({ id: true });
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;

// ─── BILLING RECORDS ──────────────────────────────────────────────────────────
export const billingRecords = pgTable("billing_records", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  minutesUsed: real("minutes_used").notNull().default(0),
  amountCharged: real("amount_charged").notNull().default(0),
  creditApplied: real("credit_applied").notNull().default(0),
  creditIssuedNextMonth: real("credit_issued_next_month").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending | paid | failed
});

export const insertBillingRecordSchema = createInsertSchema(billingRecords).omit({ id: true });
export type InsertBillingRecord = z.infer<typeof insertBillingRecordSchema>;
export type BillingRecord = typeof billingRecords.$inferSelect;

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  tenantId: text("tenant_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── SESSIONS ────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // session token
  userId: text("user_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export type Session = typeof sessions.$inferSelect;
