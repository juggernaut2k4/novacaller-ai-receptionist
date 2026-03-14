import type { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertTenantSchema, insertIntakeFieldSchema, insertFaqSchema, insertEscalationRuleSchema, insertCallSchema } from "@shared/schema";
import { nanoid } from "nanoid";

// Simple billing calc: $10 per 100 minutes block
function calcBilling(minutesUsed: number, creditBalance: number) {
  const blocks = Math.ceil(minutesUsed / 100);
  const gross = blocks * 10;
  const applied = Math.min(creditBalance, gross);
  const charged = gross - applied;
  const nextMonthCredit = minutesUsed < 100 ? 10 : 0;
  return { gross, applied, charged, nextMonthCredit };
}

// ── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  const session = storage.getSession(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  (req as any).session = session;
  (req as any).userId = session.userId;
  (req as any).tenantId = session.tenantId;
  next();
}

// Ensure the session's tenantId matches the route's :id param
function requireTenantMatch(req: Request, res: Response, next: NextFunction) {
  const sessionTenantId = (req as any).tenantId;
  const routeTenantId = req.params.id;
  if (sessionTenantId !== routeTenantId) {
    return res.status(403).json({ error: "Forbidden — tenant mismatch" });
  }
  next();
}

export function registerRoutes(httpServer: Server, app: Express) {

  // ── AUTH ROUTES ─────────────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, businessName, businessType, businessDescription, phone, assignedNumber } = req.body;

    if (!email || !password || !businessName || !businessType) {
      return res.status(400).json({ error: "Missing required fields: email, password, businessName, businessType" });
    }

    // Check if email exists
    if (storage.getUserByEmail(email)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Create tenant
    const tenant = storage.createTenant({
      name: businessName,
      businessType,
      phone: phone || null,
      assignedNumber: assignedNumber || null,
      status: "onboarding",
      greeting: null,
      aiPersona: null,
      timezone: "America/Chicago",
      plan: "starter",
    });

    // Run onboarding schema generation
    const schemas: Record<string, { fields: any[]; faqs: any[]; greeting: string; persona: string }> = {
      dental: {
        greeting: `Thank you for calling ${businessName}. This is Nova, your AI receptionist. How can I help you today?`,
        persona: "Professional, warm, and reassuring. Speaks clearly. Asks one question at a time. Uses patient-friendly language.",
        fields: [
          { label: "Patient Name", fieldKey: "patient_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your full name please?" },
          { label: "Date of Birth", fieldKey: "dob", fieldType: "date", required: true, order: 1, aiPrompt: "And your date of birth?" },
          { label: "Insurance Provider", fieldKey: "insurance", fieldType: "text", required: false, order: 2, aiPrompt: "Do you have dental insurance? If so, which provider?" },
          { label: "Reason for Visit", fieldKey: "reason", fieldType: "text", required: true, order: 3, aiPrompt: "What's the reason for your visit today?" },
          { label: "Is this a dental emergency?", fieldKey: "is_emergency", fieldType: "boolean", required: true, order: 4, aiPrompt: "Is this a dental emergency?" },
        ],
        faqs: [
          { question: "What are your office hours?", answer: "We're open Monday through Friday, 8am to 5pm, and Saturdays 9am to 2pm." },
          { question: "Do you accept new patients?", answer: "Yes! We're currently welcoming new patients." },
          { question: "Do you accept insurance?", answer: "We accept most major dental insurance plans." },
        ],
      },
      hvac: {
        greeting: `Hi, you've reached ${businessName}. I'm Aria, your AI assistant. Are you calling about a new installation, repair, or maintenance?`,
        persona: "Practical, efficient, friendly. Uses simple language. Prioritizes urgency for emergencies.",
        fields: [
          { label: "Customer Name", fieldKey: "customer_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your name?" },
          { label: "Service Address", fieldKey: "address", fieldType: "text", required: true, order: 1, aiPrompt: "What's the service address?" },
          { label: "Issue Type", fieldKey: "issue_type", fieldType: "enum", required: true, order: 2, options: ["No cooling", "No heating", "Noisy unit", "New installation", "Maintenance"], aiPrompt: "What type of issue are you experiencing?" },
          { label: "Is this an emergency?", fieldKey: "is_emergency", fieldType: "boolean", required: true, order: 3, aiPrompt: "Is this an emergency — like no heat in freezing temperatures?" },
        ],
        faqs: [
          { question: "What areas do you serve?", answer: "We serve the greater metropolitan area and surrounding suburbs." },
          { question: "Do you offer emergency service?", answer: "Yes, we offer 24/7 emergency service for urgent heating and cooling issues." },
          { question: "How do I schedule maintenance?", answer: "I can take your contact details and our team will call back to schedule." },
        ],
      },
      law: {
        greeting: `Thank you for calling ${businessName}. This is Lexis, your AI intake assistant. How can I help you today?`,
        persona: "Professional, measured, confidential. Speaks with authority. Does not provide legal advice.",
        fields: [
          { label: "Full Name", fieldKey: "full_name", fieldType: "text", required: true, order: 0, aiPrompt: "May I have your full name?" },
          { label: "Contact Number", fieldKey: "contact_number", fieldType: "text", required: true, order: 1, aiPrompt: "And the best number to reach you?" },
          { label: "Practice Area Needed", fieldKey: "practice_area", fieldType: "enum", required: true, order: 2, options: ["Family Law", "Personal Injury", "Criminal Defense", "Business Law", "Real Estate", "Other"], aiPrompt: "What type of legal matter can we assist you with?" },
          { label: "Brief Description", fieldKey: "description", fieldType: "text", required: true, order: 3, aiPrompt: "Can you briefly describe your situation?" },
          { label: "Is this time-sensitive?", fieldKey: "urgent", fieldType: "boolean", required: true, order: 4, aiPrompt: "Is this matter time-sensitive or urgent?" },
        ],
        faqs: [
          { question: "Do you offer free consultations?", answer: "We offer a complimentary 30-minute initial consultation." },
          { question: "What areas of law do you practice?", answer: "We practice family law, personal injury, criminal defense, business law, and real estate." },
        ],
      },
      restaurant: {
        greeting: `Hello, thank you for calling ${businessName}! This is Bella, your dining assistant. Are you calling to make a reservation or do you have a question?`,
        persona: "Warm, welcoming, enthusiastic about food. Keeps it quick and friendly.",
        fields: [
          { label: "Guest Name", fieldKey: "guest_name", fieldType: "text", required: true, order: 0, aiPrompt: "Who should I put the reservation under?" },
          { label: "Party Size", fieldKey: "party_size", fieldType: "text", required: true, order: 1, aiPrompt: "How many guests will be joining?" },
          { label: "Preferred Date", fieldKey: "preferred_date", fieldType: "date", required: true, order: 2, aiPrompt: "What date are you looking at?" },
          { label: "Preferred Time", fieldKey: "preferred_time", fieldType: "text", required: true, order: 3, aiPrompt: "And preferred time?" },
          { label: "Special Requests", fieldKey: "special_requests", fieldType: "text", required: false, order: 4, aiPrompt: "Any dietary restrictions or special requests?" },
        ],
        faqs: [
          { question: "What are your hours?", answer: "We're open Tuesday through Sunday, 11:30am to 10pm." },
          { question: "Do you take walk-ins?", answer: "We do accept walk-ins based on availability, but reservations are recommended on weekends." },
        ],
      },
      salon: {
        greeting: `Hi, you've reached ${businessName}! This is Gloss, your booking assistant. Looking to book an appointment?`,
        persona: "Friendly, upbeat, conversational. Keeps the vibe positive and stylish.",
        fields: [
          { label: "Client Name", fieldKey: "client_name", fieldType: "text", required: true, order: 0, aiPrompt: "What's your name?" },
          { label: "Service Requested", fieldKey: "service", fieldType: "enum", required: true, order: 1, options: ["Haircut", "Color", "Blowout", "Highlights", "Treatment", "Nails", "Other"], aiPrompt: "What service are you interested in?" },
          { label: "Stylist Preference", fieldKey: "stylist", fieldType: "text", required: false, order: 2, aiPrompt: "Do you have a preferred stylist?" },
          { label: "Preferred Date/Time", fieldKey: "preferred_slot", fieldType: "text", required: true, order: 3, aiPrompt: "When works best for you?" },
        ],
        faqs: [
          { question: "Do you accept walk-ins?", answer: "We accept walk-ins when available, but appointments are recommended." },
          { question: "What's your cancellation policy?", answer: "We ask for 24-hour notice for cancellations to avoid a fee." },
        ],
      },
      medical: {
        greeting: `Thank you for calling ${businessName}. This is Nova, your AI receptionist. How can I help you today?`,
        persona: "Professional, empathetic, and clear. HIPAA-conscious. Never gives medical advice.",
        fields: [
          { label: "Patient Name", fieldKey: "patient_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your full name?" },
          { label: "Date of Birth", fieldKey: "dob", fieldType: "date", required: true, order: 1, aiPrompt: "And your date of birth?" },
          { label: "Insurance Provider", fieldKey: "insurance", fieldType: "text", required: false, order: 2, aiPrompt: "Do you have insurance? If so, which provider?" },
          { label: "Reason for Visit", fieldKey: "reason", fieldType: "text", required: true, order: 3, aiPrompt: "What's the reason for your visit?" },
          { label: "Is this urgent?", fieldKey: "is_urgent", fieldType: "boolean", required: true, order: 4, aiPrompt: "Is this an urgent matter?" },
        ],
        faqs: [
          { question: "What are your office hours?", answer: "We're open Monday through Friday, 8am to 5pm." },
          { question: "Do you accept new patients?", answer: "Yes, we are currently accepting new patients." },
          { question: "What insurance do you accept?", answer: "We accept most major insurance plans. Please call our office for specific coverage questions." },
        ],
      },
    };

    const schema = schemas[businessType] || {
      greeting: `Thank you for calling ${businessName}. How can I help you today?`,
      persona: "Professional and helpful. Collects caller information and takes messages.",
      fields: [
        { label: "Caller Name", fieldKey: "caller_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your name?" },
        { label: "Reason for Call", fieldKey: "reason", fieldType: "text", required: true, order: 1, aiPrompt: "What's the reason for your call today?" },
        { label: "Best Callback Number", fieldKey: "callback_number", fieldType: "text", required: false, order: 2, aiPrompt: "Is there a good number to reach you at?" },
      ],
      faqs: [],
    };

    // Apply generated schema
    storage.updateTenant(tenant.id, {
      greeting: schema.greeting,
      aiPersona: schema.persona,
      status: "active",
    });

    // Create intake fields
    for (const f of schema.fields) {
      storage.createIntakeField({ ...f, tenantId: tenant.id, options: f.options ?? null });
    }

    // Create FAQs
    schema.faqs.forEach((faq: any, i: number) => {
      storage.createFaq({ ...faq, tenantId: tenant.id, order: i });
    });

    // Create user
    const user = storage.createUser({
      email,
      passwordHash: password, // plain text for demo
      tenantId: tenant.id,
    });

    // Create session
    const session = storage.createSession(user.id, tenant.id);

    // Refetch tenant with updates applied
    const updatedTenant = storage.getTenant(tenant.id);

    res.status(201).json({
      user: { id: user.id, email: user.email, tenantId: user.tenantId },
      tenant: updatedTenant,
      sessionToken: session.id,
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = storage.getUserByEmail(email);
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const session = storage.createSession(user.id, user.tenantId);
    const tenant = storage.getTenant(user.tenantId);

    res.json({
      user: { id: user.id, email: user.email, tenantId: user.tenantId },
      tenant,
      sessionToken: session.id,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      storage.deleteSession(authHeader.slice(7));
    }
    res.json({ ok: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const session = storage.getSession(authHeader.slice(7));
    if (!session) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    const user = storage.getUserByEmail(""); // need to find by ID
    // Find user by session userId
    const allTenants = storage.getAllTenants();
    const tenant = storage.getTenant(session.tenantId);

    // We need to return user info - search through a different mechanism
    // Since we only have getUserByEmail, let's return what we know from the session
    res.json({
      user: { id: session.userId, tenantId: session.tenantId },
      tenant,
    });
  });

  // ── TENANTS ───────────────────────────────────────────────────────────────
  app.get("/api/tenants", (_req, res) => {
    res.json(storage.getAllTenants());
  });

  app.get("/api/tenants/:id", requireAuth, requireTenantMatch, (req, res) => {
    const t = storage.getTenant(req.params.id);
    if (!t) return res.status(404).json({ error: "Not found" });
    res.json(t);
  });

  app.post("/api/tenants", (req, res) => {
    const parsed = insertTenantSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const tenant = storage.createTenant(parsed.data);
    res.status(201).json(tenant);
  });

  app.patch("/api/tenants/:id", requireAuth, requireTenantMatch, (req, res) => {
    const updated = storage.updateTenant(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ── AI ONBOARDING: generate schema from business description ─────────────
  app.post("/api/tenants/:id/generate-schema", requireAuth, requireTenantMatch, (req, res) => {
    const { businessType } = req.body;
    const tenantId = req.params.id;

    const schemas: Record<string, { fields: any[]; faqs: any[]; greeting: string; persona: string }> = {
      dental: {
        greeting: `Thank you for calling ${req.body.businessName || "our dental office"}. This is Nova, your AI receptionist. How can I help you today?`,
        persona: "Professional, warm, and reassuring. Speaks clearly. Asks one question at a time. Uses patient-friendly language.",
        fields: [
          { label: "Patient Name", fieldKey: "patient_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your full name please?" },
          { label: "Date of Birth", fieldKey: "dob", fieldType: "date", required: true, order: 1, aiPrompt: "And your date of birth?" },
          { label: "Insurance Provider", fieldKey: "insurance", fieldType: "text", required: false, order: 2, aiPrompt: "Do you have dental insurance? If so, which provider?" },
          { label: "Reason for Visit", fieldKey: "reason", fieldType: "text", required: true, order: 3, aiPrompt: "What's the reason for your visit today?" },
          { label: "Is this a dental emergency?", fieldKey: "is_emergency", fieldType: "boolean", required: true, order: 4, aiPrompt: "Is this a dental emergency?" },
        ],
        faqs: [
          { question: "What are your office hours?", answer: "We're open Monday through Friday, 8am to 5pm, and Saturdays 9am to 2pm." },
          { question: "Do you accept new patients?", answer: "Yes! We're currently welcoming new patients." },
          { question: "Do you accept insurance?", answer: "We accept most major dental insurance plans." },
        ],
      },
      hvac: {
        greeting: `Hi, you've reached ${req.body.businessName || "our HVAC company"}. I'm Aria, your AI assistant. Are you calling about a new installation, repair, or maintenance?`,
        persona: "Practical, efficient, friendly. Uses simple language. Prioritizes urgency for emergencies.",
        fields: [
          { label: "Customer Name", fieldKey: "customer_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your name?" },
          { label: "Service Address", fieldKey: "address", fieldType: "text", required: true, order: 1, aiPrompt: "What's the service address?" },
          { label: "Issue Type", fieldKey: "issue_type", fieldType: "enum", required: true, order: 2, options: ["No cooling", "No heating", "Noisy unit", "New installation", "Maintenance"], aiPrompt: "What type of issue are you experiencing?" },
          { label: "Is this an emergency?", fieldKey: "is_emergency", fieldType: "boolean", required: true, order: 3, aiPrompt: "Is this an emergency — like no heat in freezing temperatures?" },
        ],
        faqs: [
          { question: "What areas do you serve?", answer: "We serve the greater metropolitan area and surrounding suburbs." },
          { question: "Do you offer emergency service?", answer: "Yes, we offer 24/7 emergency service for urgent heating and cooling issues." },
          { question: "How do I schedule maintenance?", answer: "I can take your contact details and our team will call back to schedule." },
        ],
      },
      law: {
        greeting: `Thank you for calling ${req.body.businessName || "our law office"}. This is Lexis, your AI intake assistant. How can I help you today?`,
        persona: "Professional, measured, confidential. Speaks with authority. Does not provide legal advice.",
        fields: [
          { label: "Full Name", fieldKey: "full_name", fieldType: "text", required: true, order: 0, aiPrompt: "May I have your full name?" },
          { label: "Contact Number", fieldKey: "contact_number", fieldType: "text", required: true, order: 1, aiPrompt: "And the best number to reach you?" },
          { label: "Practice Area Needed", fieldKey: "practice_area", fieldType: "enum", required: true, order: 2, options: ["Family Law", "Personal Injury", "Criminal Defense", "Business Law", "Real Estate", "Other"], aiPrompt: "What type of legal matter can we assist you with?" },
          { label: "Brief Description", fieldKey: "description", fieldType: "text", required: true, order: 3, aiPrompt: "Can you briefly describe your situation?" },
          { label: "Is this time-sensitive?", fieldKey: "urgent", fieldType: "boolean", required: true, order: 4, aiPrompt: "Is this matter time-sensitive or urgent?" },
        ],
        faqs: [
          { question: "Do you offer free consultations?", answer: "We offer a complimentary 30-minute initial consultation." },
          { question: "What areas of law do you practice?", answer: "We practice family law, personal injury, criminal defense, business law, and real estate." },
        ],
      },
      restaurant: {
        greeting: `Hello, thank you for calling ${req.body.businessName || "our restaurant"}! This is Bella, your dining assistant. Are you calling to make a reservation or do you have a question?`,
        persona: "Warm, welcoming, enthusiastic about food. Keeps it quick and friendly.",
        fields: [
          { label: "Guest Name", fieldKey: "guest_name", fieldType: "text", required: true, order: 0, aiPrompt: "Who should I put the reservation under?" },
          { label: "Party Size", fieldKey: "party_size", fieldType: "text", required: true, order: 1, aiPrompt: "How many guests will be joining?" },
          { label: "Preferred Date", fieldKey: "preferred_date", fieldType: "date", required: true, order: 2, aiPrompt: "What date are you looking at?" },
          { label: "Preferred Time", fieldKey: "preferred_time", fieldType: "text", required: true, order: 3, aiPrompt: "And preferred time?" },
          { label: "Special Requests", fieldKey: "special_requests", fieldType: "text", required: false, order: 4, aiPrompt: "Any dietary restrictions or special requests?" },
        ],
        faqs: [
          { question: "What are your hours?", answer: "We're open Tuesday through Sunday, 11:30am to 10pm." },
          { question: "Do you take walk-ins?", answer: "We do accept walk-ins based on availability, but reservations are recommended on weekends." },
        ],
      },
      salon: {
        greeting: `Hi, you've reached ${req.body.businessName || "our salon"}! This is Gloss, your booking assistant. Looking to book an appointment?`,
        persona: "Friendly, upbeat, conversational. Keeps the vibe positive and stylish.",
        fields: [
          { label: "Client Name", fieldKey: "client_name", fieldType: "text", required: true, order: 0, aiPrompt: "What's your name?" },
          { label: "Service Requested", fieldKey: "service", fieldType: "enum", required: true, order: 1, options: ["Haircut", "Color", "Blowout", "Highlights", "Treatment", "Nails", "Other"], aiPrompt: "What service are you interested in?" },
          { label: "Stylist Preference", fieldKey: "stylist", fieldType: "text", required: false, order: 2, aiPrompt: "Do you have a preferred stylist?" },
          { label: "Preferred Date/Time", fieldKey: "preferred_slot", fieldType: "text", required: true, order: 3, aiPrompt: "When works best for you?" },
        ],
        faqs: [
          { question: "Do you accept walk-ins?", answer: "We accept walk-ins when available, but appointments are recommended." },
          { question: "What's your cancellation policy?", answer: "We ask for 24-hour notice for cancellations to avoid a fee." },
        ],
      },
    };

    const schema = schemas[businessType] || {
      greeting: `Thank you for calling ${req.body.businessName || "us"}. How can I help you today?`,
      persona: "Professional and helpful. Collects caller information and takes messages.",
      fields: [
        { label: "Caller Name", fieldKey: "caller_name", fieldType: "text", required: true, order: 0, aiPrompt: "Can I get your name?" },
        { label: "Reason for Call", fieldKey: "reason", fieldType: "text", required: true, order: 1, aiPrompt: "What's the reason for your call today?" },
        { label: "Best Callback Number", fieldKey: "callback_number", fieldType: "text", required: false, order: 2, aiPrompt: "Is there a good number to reach you at?" },
      ],
      faqs: [],
    };

    res.json(schema);
  });

  // ── INTAKE FIELDS ─────────────────────────────────────────────────────────
  app.get("/api/tenants/:id/intake-fields", requireAuth, requireTenantMatch, (req, res) => {
    res.json(storage.getIntakeFields(req.params.id));
  });

  app.post("/api/tenants/:id/intake-fields", requireAuth, requireTenantMatch, (req, res) => {
    const data = { ...req.body, tenantId: req.params.id };
    const parsed = insertIntakeFieldSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(storage.createIntakeField(parsed.data));
  });

  app.patch("/api/intake-fields/:id", requireAuth, (req, res) => {
    const updated = storage.updateIntakeField(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/intake-fields/:id", requireAuth, (req, res) => {
    storage.deleteIntakeField(req.params.id);
    res.status(204).send();
  });

  // ── FAQS ──────────────────────────────────────────────────────────────────
  app.get("/api/tenants/:id/faqs", requireAuth, requireTenantMatch, (req, res) => {
    res.json(storage.getFaqs(req.params.id));
  });

  app.post("/api/tenants/:id/faqs", requireAuth, requireTenantMatch, (req, res) => {
    const data = { ...req.body, tenantId: req.params.id };
    const parsed = insertFaqSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(storage.createFaq(parsed.data));
  });

  app.patch("/api/faqs/:id", requireAuth, (req, res) => {
    const updated = storage.updateFaq(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/faqs/:id", requireAuth, (req, res) => {
    storage.deleteFaq(req.params.id);
    res.status(204).send();
  });

  // ── ESCALATION RULES ──────────────────────────────────────────────────────
  app.get("/api/tenants/:id/escalation-rules", requireAuth, requireTenantMatch, (req, res) => {
    res.json(storage.getEscalationRules(req.params.id));
  });

  app.post("/api/tenants/:id/escalation-rules", requireAuth, requireTenantMatch, (req, res) => {
    const data = { ...req.body, tenantId: req.params.id };
    const parsed = insertEscalationRuleSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(storage.createEscalationRule(parsed.data));
  });

  app.patch("/api/escalation-rules/:id", requireAuth, (req, res) => {
    const updated = storage.updateEscalationRule(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/escalation-rules/:id", requireAuth, (req, res) => {
    storage.deleteEscalationRule(req.params.id);
    res.status(204).send();
  });

  // ── CALLS ─────────────────────────────────────────────────────────────────
  app.get("/api/tenants/:id/calls", requireAuth, requireTenantMatch, (req, res) => {
    res.json(storage.getCalls(req.params.id));
  });

  app.get("/api/calls/:id", requireAuth, (req, res) => {
    const c = storage.getCall(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json(c);
  });

  app.post("/api/calls", requireAuth, (req, res) => {
    const parsed = insertCallSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const call = storage.createCall(parsed.data);
    // Update tenant minute usage
    const tenant = storage.getTenant(call.tenantId);
    if (tenant) {
      storage.updateTenant(tenant.id, {
        minutesUsed: tenant.minutesUsed + call.durationMinutes,
      });
    }
    res.status(201).json(call);
  });

  app.patch("/api/calls/:id", requireAuth, (req, res) => {
    const updated = storage.updateCall(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ── BILLING ───────────────────────────────────────────────────────────────
  app.get("/api/tenants/:id/billing", requireAuth, requireTenantMatch, (req, res) => {
    const tenant = storage.getTenant(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Not found" });
    const { gross, applied, charged, nextMonthCredit } = calcBilling(tenant.minutesUsed, tenant.minutesCredit);
    res.json({
      minutesUsed: tenant.minutesUsed,
      creditBalance: tenant.minutesCredit,
      gross,
      applied,
      charged,
      nextMonthCredit,
      records: storage.getBillingRecords(req.params.id),
    });
  });

  // ── VAPI WEBHOOK ──────────────────────────────────────────────────────────
  app.post("/api/vapi/webhook", (req, res) => {
    // Secret verification
    const expectedSecret = process.env.VAPI_WEBHOOK_SECRET || "aireceptionist_demo_secret_2026";
    const incomingSecret = req.headers["x-vapi-secret"] as string | undefined;
    if (incomingSecret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body;
    const message = body.message || body;
    const eventType = message.type || message.event;
    const call = message.call || body.call;

    // ── ASSISTANT-REQUEST EVENT ──────────────────────────────────────────────
    if (eventType === "assistant-request") {
      const calledNumber = call?.phoneNumber?.number;

      let tenant = null;
      if (calledNumber) {
        tenant = storage.getTenantByPhone(calledNumber);
      }

      if (!tenant) {
        // Fallback default assistant
        return res.json({
          assistant: {
            name: "NovaCaller Default Receptionist",
            firstMessage: "Thank you for calling. How can I help you today?",
            model: {
              provider: "openai",
              model: "gpt-4o-mini",
              systemPrompt: "You are a helpful AI receptionist. Take the caller's name, reason for calling, and a callback number. Be polite and professional.",
              temperature: 0.4,
            },
            voice: {
              provider: "11labs",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
            transcriber: {
              provider: "deepgram",
              model: "nova-2",
              language: "en",
            },
            analysisPlan: {
              summaryPrompt: "Summarize this call in 1-2 sentences.",
              structuredDataPrompt: "Extract caller name, reason, and callback number.",
              structuredDataSchema: {
                type: "object",
                properties: {
                  caller_name: { type: "string" },
                  reason: { type: "string" },
                  callback_number: { type: "string" },
                },
              },
            },
            metadata: {},
          },
        });
      }

      // Build dynamic assistant config from tenant data
      const intakeFields = storage.getIntakeFields(tenant.id);
      const faqList = storage.getFaqs(tenant.id);
      const escalationRules = storage.getEscalationRules(tenant.id);

      // Build structured data schema from intake fields
      const structuredDataSchema: Record<string, any> = { type: "object", properties: {}, required: [] as string[] };
      for (const field of intakeFields.sort((a, b) => a.order - b.order)) {
        const prop: Record<string, any> = { description: field.aiPrompt || field.label };
        if (field.fieldType === "boolean") prop.type = "boolean";
        else if (field.fieldType === "enum" && field.options?.length) {
          prop.type = "string";
          prop.enum = field.options;
        } else prop.type = "string";
        structuredDataSchema.properties[field.fieldKey] = prop;
        if (field.required) (structuredDataSchema.required as string[]).push(field.fieldKey);
      }

      // Build FAQ knowledge block
      const faqText = faqList.length > 0
        ? "\n\n## Frequently Asked Questions\n" +
          faqList.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
        : "";

      // Build escalation instructions
      const escalationText = escalationRules.length > 0
        ? "\n\n## Escalation Rules\n" +
          escalationRules.map(r =>
            `- If the caller mentions "${r.trigger}", ${r.action === "transfer" ? `transfer to ${r.destination}` : `send ${r.action} to ${r.destination}`}.`
          ).join("\n")
        : "";

      // Build intake collection instructions
      const intakeText = intakeFields.length > 0
        ? "\n\n## Information to Collect\nCollect the following from the caller, one question at a time:\n" +
          intakeFields
            .sort((a, b) => a.order - b.order)
            .map(f => `- ${f.label}${f.required ? " (required)" : " (optional)"}: ${f.aiPrompt || f.label}`)
            .join("\n")
        : "";

      const systemPrompt = `You are an AI receptionist for ${tenant.name}, a ${tenant.businessType} business.

## Your Persona
${tenant.aiPersona || "Professional, warm, and helpful. Speak clearly. Ask one question at a time."}
${intakeText}${faqText}${escalationText}

## Important Rules
- Never provide medical, legal, or financial advice.
- Always collect required information before ending the call.
- Be concise — this is a phone call, not a chat.
- End every call by confirming next steps with the caller.`;

      return res.json({
        assistant: {
          name: `${tenant.name} AI Receptionist`,
          firstMessage: tenant.greeting || `Thank you for calling ${tenant.name}. How can I help you today?`,
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            systemPrompt,
            temperature: 0.4,
          },
          voice: {
            provider: "11labs",
            voiceId: "21m00Tcm4TlvDq8ikWAM",
          },
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
          },
          analysisPlan: {
            summaryPrompt: `Summarize this call in 1-2 sentences. Include: who called, what they needed, and what was resolved or left as a follow-up action.`,
            structuredDataPrompt: `Extract the following structured data from the call transcript.`,
            structuredDataSchema,
          },
          metadata: {
            tenantId: tenant.id,
            businessName: tenant.name,
            businessType: tenant.businessType,
          },
        },
      });
    }

    // ── END-OF-CALL-REPORT EVENT ────────────────────────────────────────────
    if (eventType === "end-of-call-report" || eventType === "call-ended") {
      // Resolve tenant from metadata or phone number
      let tenantId = call?.metadata?.tenantId;
      if (!tenantId && call?.phoneNumber?.number) {
        const t = storage.getTenantByPhone(call.phoneNumber.number);
        if (t) tenantId = t.id;
      }

      if (!tenantId) return res.json({ received: true });

      const durationSeconds =
        message.durationSeconds ||
        call?.durationSeconds ||
        (call?.endedAt && call?.startedAt
          ? (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
          : 0);
      const durationMinutes = +(durationSeconds / 60).toFixed(4);

      const summary = message.summary || call?.analysis?.summary || null;

      const rawSentiment = call?.analysis?.sentiment ||
        (summary?.toLowerCase().includes("emergency") ||
         summary?.toLowerCase().includes("urgent") ? "urgent" :
         summary?.toLowerCase().includes("frustrated") ||
         summary?.toLowerCase().includes("complaint") ? "negative" : "neutral");

      const collectedData = message.structuredData || call?.analysis?.structuredData || {};

      const escalationRules = storage.getEscalationRules(tenantId);
      const summaryLower = (summary || "").toLowerCase();
      const escalated = escalationRules.some(r =>
        summaryLower.includes(r.trigger.toLowerCase())
      );

      storage.createCall({
        tenantId,
        callerNumber: call?.customer?.number || call?.phoneNumber || "unknown",
        callerName: call?.customer?.name || null,
        startedAt: call?.startedAt || new Date().toISOString(),
        endedAt: call?.endedAt || new Date().toISOString(),
        durationMinutes,
        status: escalated ? "escalated" : "completed",
        aiSummary: summary,
        sentiment: rawSentiment,
        transcript: message.transcript || call?.transcript || null,
        collectedData,
        escalated,
        recordingUrl: call?.recordingUrl || null,
      });

      const tenant = storage.getTenant(tenantId);
      if (tenant) {
        storage.updateTenant(tenantId, {
          minutesUsed: +(tenant.minutesUsed + durationMinutes).toFixed(4),
        });
      }
    }

    res.json({ received: true });
  });

  // ── SIMULATE INCOMING CALL (demo) ─────────────────────────────────────────
  app.post("/api/tenants/:id/simulate-call", requireAuth, requireTenantMatch, (req, res) => {
    const tenantId = req.params.id;
    const tenant = storage.getTenant(tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const names = ["Michael Torres", "Jennifer Lee", "Carlos Mendez", "Ashley Brown", "Tom Wilson"];
    const summaries = [
      "New patient inquiry. Collected full intake. Appointment request forwarded.",
      "Called to reschedule appointment. Message taken for front desk.",
      "Insurance verification question. Answered from FAQ. No further action.",
      "Routine checkup booking. Intake complete.",
    ];
    const sentiments = ["positive", "neutral", "positive", "positive", "negative"];
    const duration = +(1.2 + Math.random() * 3).toFixed(2);

    const now = new Date();
    const call = storage.createCall({
      tenantId,
      callerNumber: "+1512555" + String(Math.floor(Math.random() * 9000) + 1000),
      callerName: names[Math.floor(Math.random() * names.length)],
      startedAt: new Date(now.getTime() - duration * 60 * 1000).toISOString(),
      endedAt: now.toISOString(),
      durationMinutes: duration,
      status: "completed",
      aiSummary: summaries[Math.floor(Math.random() * summaries.length)],
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      transcript: null,
      collectedData: {},
      escalated: false,
      recordingUrl: null,
    });

    storage.updateTenant(tenantId, {
      minutesUsed: tenant.minutesUsed + duration,
    });

    res.status(201).json(call);
  });

  return httpServer;
}
