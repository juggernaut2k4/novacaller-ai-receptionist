import { nanoid } from "nanoid";
import {
  Tenant, InsertTenant,
  IntakeField, InsertIntakeField,
  Faq, InsertFaq,
  EscalationRule, InsertEscalationRule,
  Call, InsertCall,
  BillingRecord, InsertBillingRecord,
  User, InsertUser, Session,
} from "@shared/schema";

export interface IStorage {
  // Tenants
  getTenant(id: string): Tenant | undefined;
  getAllTenants(): Tenant[];
  createTenant(data: InsertTenant): Tenant;
  updateTenant(id: string, data: Partial<Tenant>): Tenant | undefined;

  // Intake Fields
  getIntakeFields(tenantId: string): IntakeField[];
  createIntakeField(data: InsertIntakeField): IntakeField;
  updateIntakeField(id: string, data: Partial<IntakeField>): IntakeField | undefined;
  deleteIntakeField(id: string): void;

  // FAQs
  getFaqs(tenantId: string): Faq[];
  createFaq(data: InsertFaq): Faq;
  updateFaq(id: string, data: Partial<Faq>): Faq | undefined;
  deleteFaq(id: string): void;

  // Escalation Rules
  getEscalationRules(tenantId: string): EscalationRule[];
  createEscalationRule(data: InsertEscalationRule): EscalationRule;
  updateEscalationRule(id: string, data: Partial<EscalationRule>): EscalationRule | undefined;
  deleteEscalationRule(id: string): void;

  // Calls
  getCall(id: string): Call | undefined;
  getCalls(tenantId: string): Call[];
  createCall(data: InsertCall): Call;
  updateCall(id: string, data: Partial<Call>): Call | undefined;

  // Billing
  getBillingRecords(tenantId: string): BillingRecord[];
  createBillingRecord(data: InsertBillingRecord): BillingRecord;
  calculateBilling(tenantId: string): { charge: number; credit: number; nextMonthCredit: number };

  // Users
  getUserByEmail(email: string): User | undefined;
  createUser(data: InsertUser): User;

  // Sessions
  createSession(userId: string, tenantId: string): Session;
  getSession(token: string): Session | undefined;
  deleteSession(token: string): void;

  // Tenant lookup by phone
  getTenantByPhone(phone: string): Tenant | undefined;
}

function generateId() { return nanoid(12); }
function now() { return new Date().toISOString(); }

// ─── SEED DATA ───────────────────────────────────────────────────────────────
const DEMO_TENANT_ID = "demo-dental-01";
const DEMO_TENANT_ID2 = "demo-hvac-02";

function buildSeedData(): {
  tenants: Map<string, Tenant>;
  intakeFields: Map<string, IntakeField>;
  faqs: Map<string, Faq>;
  escalationRules: Map<string, EscalationRule>;
  calls: Map<string, Call>;
  billing: Map<string, BillingRecord>;
  users: Map<string, User>;
  sessions: Map<string, Session>;
} {
  const tenants = new Map<string, Tenant>();
  const intakeFields = new Map<string, IntakeField>();
  const faqs = new Map<string, Faq>();
  const escalationRules = new Map<string, EscalationRule>();
  const calls = new Map<string, Call>();
  const billing = new Map<string, BillingRecord>();
  const users = new Map<string, User>();
  const sessions = new Map<string, Session>();

  // Demo Tenant 1: Dental
  tenants.set(DEMO_TENANT_ID, {
    id: DEMO_TENANT_ID,
    name: "Sunrise Dental",
    businessType: "dental",
    phone: "+15125550100",
    assignedNumber: "+18882223344",
    status: "active",
    greeting: "Thank you for calling Sunrise Dental. This is Nova, your AI receptionist. How can I help you today?",
    aiPersona: "Professional, warm, and reassuring. Speaks clearly. Asks one question at a time.",
    timezone: "America/Chicago",
    minutesUsed: 147,
    minutesCredit: 0,
    plan: "starter",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Demo Tenant 2: HVAC
  tenants.set(DEMO_TENANT_ID2, {
    id: DEMO_TENANT_ID2,
    name: "CoolBreeze HVAC",
    businessType: "hvac",
    phone: "+15125550200",
    assignedNumber: "+18882225566",
    status: "active",
    greeting: "Hi, you've reached CoolBreeze HVAC. I'm Aria, your AI assistant. Are you calling about a new installation, repair, or maintenance?",
    aiPersona: "Practical, efficient, friendly. Uses simple language. Prioritizes urgency for emergencies.",
    timezone: "America/Chicago",
    minutesUsed: 83,
    minutesCredit: 0,
    plan: "starter",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Intake fields for dental
  const dentalFields = [
    { label: "Patient Name", fieldKey: "patient_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your full name please?" },
    { label: "Date of Birth", fieldKey: "dob", fieldType: "date", required: true, order: 1, aiPrompt: "And your date of birth?" },
    { label: "Insurance Provider", fieldKey: "insurance", fieldType: "text", required: false, order: 2, aiPrompt: "Do you have dental insurance? If so, which provider?" },
    { label: "Reason for Visit", fieldKey: "reason", fieldType: "text", required: true, order: 3, aiPrompt: "What's the reason for your visit today?" },
    { label: "Is this a dental emergency?", fieldKey: "is_emergency", fieldType: "boolean", required: true, order: 4, aiPrompt: "Is this a dental emergency or can it wait for a scheduled appointment?" },
  ];
  dentalFields.forEach(f => {
    const id = generateId();
    intakeFields.set(id, { id, tenantId: DEMO_TENANT_ID, options: null, ...f });
  });

  // FAQs for dental
  const dentalFaqs = [
    { question: "What are your office hours?", answer: "We're open Monday through Friday, 8am to 5pm, and Saturdays from 9am to 2pm." },
    { question: "Do you accept new patients?", answer: "Yes! We're currently accepting new patients. I can schedule you for a new patient exam." },
    { question: "Do you accept insurance?", answer: "We accept most major dental insurance plans including Delta Dental, Cigna, and Aetna." },
    { question: "How do I reschedule my appointment?", answer: "I can take a message for the front desk to call you back, or you can call us during office hours." },
  ];
  dentalFaqs.forEach((f, i) => {
    const id = generateId();
    faqs.set(id, { id, tenantId: DEMO_TENANT_ID, order: i, ...f });
  });

  // Escalation rule for dental
  const escId = generateId();
  escalationRules.set(escId, {
    id: escId,
    tenantId: DEMO_TENANT_ID,
    trigger: "dental emergency",
    action: "transfer",
    destination: "+15125550100",
    message: "Caller has a dental emergency. Transferring now.",
  });

  // HVAC intake fields
  const hvacFields = [
    { label: "Customer Name", fieldKey: "customer_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your name?" },
    { label: "Service Address", fieldKey: "address", fieldType: "text", required: true, order: 1, aiPrompt: "What's the service address?" },
    { label: "Issue Type", fieldKey: "issue_type", fieldType: "enum", required: true, order: 2, options: ["No cooling", "No heating", "Noisy unit", "New installation", "Maintenance"], aiPrompt: "What type of issue are you experiencing?" },
    { label: "System Age (years)", fieldKey: "system_age", fieldType: "text", required: false, order: 3, aiPrompt: "Approximately how old is your HVAC system?" },
    { label: "Is it an emergency?", fieldKey: "is_emergency", fieldType: "boolean", required: true, order: 4, aiPrompt: "Is this an emergency situation, such as no heat in extreme cold or no cooling in extreme heat?" },
  ];
  hvacFields.forEach(f => {
    const id = generateId();
    intakeFields.set(id, { id, tenantId: DEMO_TENANT_ID2, options: f.options ?? null, ...f });
  });

  // Seeded calls for dental
  const callSamples = [
    { callerName: "Maria Johnson", durationMinutes: 2.3, status: "completed", sentiment: "positive", aiSummary: "Patient called to schedule a cleaning. Collected insurance info (Delta Dental). Preferred morning slots. Message left for front desk.", minutesAgo: 15 },
    { callerName: "Robert Chen", durationMinutes: 3.8, status: "escalated", sentiment: "urgent", aiSummary: "Dental emergency — broken tooth with significant pain. Escalated to on-call line immediately.", minutesAgo: 45 },
    { callerName: "Unknown Caller", durationMinutes: 1.1, status: "completed", sentiment: "neutral", aiSummary: "Caller asked about office hours and insurance. Provided answers from FAQ. No further action needed.", minutesAgo: 120 },
    { callerName: "Sarah Williams", durationMinutes: 2.7, status: "completed", sentiment: "positive", aiSummary: "New patient inquiry. Collected contact info and reason for visit. Appointment request forwarded to front desk.", minutesAgo: 200 },
    { callerName: "James Park", durationMinutes: 4.2, status: "completed", sentiment: "negative", aiSummary: "Patient frustrated about wait times for next available appointment. Took complaint message for office manager.", minutesAgo: 300 },
    { callerName: "Linda Torres", durationMinutes: 1.8, status: "completed", sentiment: "positive", aiSummary: "Called to confirm tomorrow's 10am appointment. Confirmed successfully.", minutesAgo: 400 },
    { callerName: "David Kim", durationMinutes: 2.1, status: "completed", sentiment: "neutral", aiSummary: "Rescheduling request. Current appointment: Tuesday 2pm. Needs afternoon slot. Message forwarded.", minutesAgo: 600 },
    { callerName: "Emily Ross", durationMinutes: 3.1, status: "completed", sentiment: "positive", aiSummary: "Pediatric dental inquiry for 7-year-old. Collected child's name, DOB, and insurance info. Appointment pending.", minutesAgo: 900 },
    { callerName: "Marcus Hall", durationMinutes: 1.5, status: "missed", sentiment: "neutral", aiSummary: "Caller hung up before intake completed. No data collected.", minutesAgo: 1200 },
    { callerName: "Amy Nguyen", durationMinutes: 2.9, status: "completed", sentiment: "positive", aiSummary: "Routine 6-month cleaning booking. New patient, referred by Dr. Patel. Intake complete.", minutesAgo: 1440 },
  ];

  callSamples.forEach(c => {
    const id = generateId();
    const startTs = new Date(Date.now() - c.minutesAgo * 60 * 1000).toISOString();
    const endTs = new Date(Date.now() - c.minutesAgo * 60 * 1000 + c.durationMinutes * 60 * 1000).toISOString();
    calls.set(id, {
      id,
      tenantId: DEMO_TENANT_ID,
      callerNumber: "+1512555" + String(Math.floor(Math.random() * 9000) + 1000),
      callerName: c.callerName,
      startedAt: startTs,
      endedAt: endTs,
      durationMinutes: c.durationMinutes,
      status: c.status,
      aiSummary: c.aiSummary,
      sentiment: c.sentiment,
      transcript: null,
      collectedData: {},
      escalated: c.status === "escalated",
      recordingUrl: null,
    });
  });

  // Demo user
  const demoUserId = "demo-user-01";
  users.set(demoUserId, {
    id: demoUserId,
    email: "demo@novacaller.com",
    passwordHash: "demo123",
    tenantId: DEMO_TENANT_ID,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return { tenants, intakeFields, faqs, escalationRules, calls, billing, users, sessions };
}

// ─── IN-MEMORY STORAGE ────────────────────────────────────────────────────────
export class MemStorage implements IStorage {
  private tenants: Map<string, Tenant>;
  private intakeFields: Map<string, IntakeField>;
  private faqs: Map<string, Faq>;
  private escalationRules: Map<string, EscalationRule>;
  private calls: Map<string, Call>;
  private billing: Map<string, BillingRecord>;
  private users: Map<string, User>;
  private sessions: Map<string, Session>;

  constructor() {
    const seed = buildSeedData();
    this.tenants = seed.tenants;
    this.intakeFields = seed.intakeFields;
    this.faqs = seed.faqs;
    this.escalationRules = seed.escalationRules;
    this.calls = seed.calls;
    this.billing = seed.billing;
    this.users = seed.users;
    this.sessions = seed.sessions;
  }

  // Tenants
  getTenant(id: string) { return this.tenants.get(id); }
  getAllTenants() { return Array.from(this.tenants.values()); }
  createTenant(data: InsertTenant): Tenant {
    const t: Tenant = { ...data, id: generateId(), createdAt: now(), minutesUsed: 0, minutesCredit: 0 };
    this.tenants.set(t.id, t);
    return t;
  }
  updateTenant(id: string, data: Partial<Tenant>) {
    const t = this.tenants.get(id);
    if (!t) return undefined;
    const updated = { ...t, ...data };
    this.tenants.set(id, updated);
    return updated;
  }

  // Intake Fields
  getIntakeFields(tenantId: string) {
    return Array.from(this.intakeFields.values())
      .filter(f => f.tenantId === tenantId)
      .sort((a, b) => a.order - b.order);
  }
  createIntakeField(data: InsertIntakeField): IntakeField {
    const f: IntakeField = { ...data, id: generateId() };
    this.intakeFields.set(f.id, f);
    return f;
  }
  updateIntakeField(id: string, data: Partial<IntakeField>) {
    const f = this.intakeFields.get(id);
    if (!f) return undefined;
    const updated = { ...f, ...data };
    this.intakeFields.set(id, updated);
    return updated;
  }
  deleteIntakeField(id: string) { this.intakeFields.delete(id); }

  // FAQs
  getFaqs(tenantId: string) {
    return Array.from(this.faqs.values())
      .filter(f => f.tenantId === tenantId)
      .sort((a, b) => a.order - b.order);
  }
  createFaq(data: InsertFaq): Faq {
    const f: Faq = { ...data, id: generateId() };
    this.faqs.set(f.id, f);
    return f;
  }
  updateFaq(id: string, data: Partial<Faq>) {
    const f = this.faqs.get(id);
    if (!f) return undefined;
    const updated = { ...f, ...data };
    this.faqs.set(id, updated);
    return updated;
  }
  deleteFaq(id: string) { this.faqs.delete(id); }

  // Escalation Rules
  getEscalationRules(tenantId: string) {
    return Array.from(this.escalationRules.values()).filter(r => r.tenantId === tenantId);
  }
  createEscalationRule(data: InsertEscalationRule): EscalationRule {
    const r: EscalationRule = { ...data, id: generateId() };
    this.escalationRules.set(r.id, r);
    return r;
  }
  updateEscalationRule(id: string, data: Partial<EscalationRule>) {
    const r = this.escalationRules.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...data };
    this.escalationRules.set(id, updated);
    return updated;
  }
  deleteEscalationRule(id: string) { this.escalationRules.delete(id); }

  // Calls
  getCall(id: string) { return this.calls.get(id); }
  getCalls(tenantId: string) {
    return Array.from(this.calls.values())
      .filter(c => c.tenantId === tenantId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
  createCall(data: InsertCall): Call {
    const c: Call = { ...data, id: generateId() };
    this.calls.set(c.id, c);
    return c;
  }
  updateCall(id: string, data: Partial<Call>) {
    const c = this.calls.get(id);
    if (!c) return undefined;
    const updated = { ...c, ...data };
    this.calls.set(id, updated);
    return updated;
  }

  // Billing
  getBillingRecords(tenantId: string) {
    return Array.from(this.billing.values()).filter(b => b.tenantId === tenantId);
  }
  createBillingRecord(data: InsertBillingRecord): BillingRecord {
    const b: BillingRecord = { ...data, id: generateId() };
    this.billing.set(b.id, b);
    return b;
  }
  calculateBilling(tenantId: string) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return { charge: 0, credit: 0, nextMonthCredit: 0 };
    const mins = tenant.minutesUsed;
    const blocks = Math.ceil(mins / 100);
    const charge = blocks * 10;
    const nextMonthCredit = mins < 100 ? 10 : 0;
    const credit = tenant.minutesCredit;
    return { charge, credit, nextMonthCredit };
  }

  // Users
  getUserByEmail(email: string) {
    return Array.from(this.users.values()).find(u => u.email === email);
  }
  createUser(data: InsertUser): User {
    const u: User = { ...data, id: generateId(), createdAt: now() };
    this.users.set(u.id, u);
    return u;
  }

  // Sessions
  createSession(userId: string, tenantId: string): Session {
    const token = generateId() + generateId(); // 24 chars
    const s: Session = {
      id: token,
      userId,
      tenantId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    this.sessions.set(token, s);
    return s;
  }
  getSession(token: string) {
    const s = this.sessions.get(token);
    if (!s) return undefined;
    if (new Date(s.expiresAt) < new Date()) {
      this.sessions.delete(token);
      return undefined;
    }
    return s;
  }
  deleteSession(token: string) { this.sessions.delete(token); }

  // Tenant lookup by phone
  getTenantByPhone(phone: string) {
    return Array.from(this.tenants.values()).find(t => t.assignedNumber === phone);
  }
}

export const storage = new MemStorage();
