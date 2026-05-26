// Optional Express server for exports and super-admin account provisioning.
// Run from the project root: node src/app/lib/server.js
import fs from "node:fs";
import path from "node:path";
import express from "express";
import pdfkit from "pdfkit";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [rawKey, ...rest] = trimmed.split("=");
    const key = rawKey.trim();
    if (process.env[key]) {
      continue;
    }

    process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const allowedOrigins = (process.env.ADMIN_CORS_ORIGINS ?? "http://127.0.0.1:5173,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const rateLimitBuckets = new Map();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: "5mb" }));

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? req.ip ?? null;
}

function rateLimit({ windowMs, max, scope }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${scope}:${getClientIp(req) ?? "unknown"}`;
    const bucket = rateLimitBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({ error: "Trop de tentatives. Reessayez dans quelques instants." });
      return;
    }

    next();
  };
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSuperAdminEmails() {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function writeAuditLog(admin, req, {
  actor,
  action,
  targetUserId = null,
  targetEmail = null,
  targetCompanyId = null,
  metadata = {},
}) {
  try {
    const { error } = await admin
      .from("admin_audit_logs")
      .insert({
        actor_user_id: actor.id,
        actor_email: actor.email,
        action,
        target_user_id: targetUserId,
        target_email: targetEmail,
        target_company_id: targetCompanyId,
        ip_address: getClientIp(req),
        user_agent: req.headers["user-agent"] ?? null,
        metadata,
      });

    if (error && error.code !== "42P01") {
      console.warn("Audit log skipped:", error.message);
    }
  } catch (error) {
    if (error?.code !== "42P01") {
      console.warn("Audit log skipped:", error instanceof Error ? error.message : error);
    }
  }
}

app.get("/api/admin/health", (_req, res) => {
  res.json({
    supabaseAdminConfigured: Boolean(getSupabaseAdmin()),
    superAdminEmailsConfigured: getSuperAdminEmails().length > 0,
  });
});

app.use("/api/admin", rateLimit({
  windowMs: Number(process.env.ADMIN_RATE_LIMIT_WINDOW_MS ?? 60_000),
  max: Number(process.env.ADMIN_RATE_LIMIT_MAX ?? 60),
  scope: "admin",
}));

app.use("/api/export", rateLimit({
  windowMs: Number(process.env.EXPORT_RATE_LIMIT_WINDOW_MS ?? 60_000),
  max: Number(process.env.EXPORT_RATE_LIMIT_MAX ?? 20),
  scope: "export",
}));

function validatePassword(password) {
  if (typeof password !== "string") {
    return "Le mot de passe est requis.";
  }
  if (password.length < 12) {
    return "Le mot de passe doit contenir au moins 12 caracteres.";
  }
  if (!/[a-z]/.test(password)) {
    return "Le mot de passe doit contenir une minuscule.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir une majuscule.";
  }
  if (!/\d/.test(password)) {
    return "Le mot de passe doit contenir un chiffre.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Le mot de passe doit contenir un caractere special.";
  }
  return null;
}

async function requireSuperAdmin(req, res) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(500).json({ error: "Supabase admin non configure. Verifiez SUPABASE_SERVICE_ROLE_KEY." });
    return null;
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "Session manquante." });
    return null;
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user?.email) {
    res.status(401).json({ error: "Session invalide." });
    return null;
  }

  const allowedEmails = getSuperAdminEmails();
  if (allowedEmails.length === 0 || !allowedEmails.includes(data.user.email.toLowerCase())) {
    res.status(403).json({ error: "Acces super-admin refuse." });
    return null;
  }

  return { admin, user: data.user };
}

async function getAdminAccount(admin, user) {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, company_id, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  let company = null;
  if (profile?.company_id) {
    const { data: companyData } = await admin
      .from("companies")
      .select("id, name, currency")
      .eq("id", profile.company_id)
      .maybeSingle();
    company = companyData;
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
    bannedUntil: user.banned_until,
    isBlocked: Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now()),
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
    companyId: profile?.company_id ?? user.user_metadata?.company_id ?? null,
    companyName: company?.name ?? null,
    currency: company?.currency ?? null,
    mustChangePassword: Boolean(profile?.must_change_password ?? user.user_metadata?.must_change_password),
  };
}

async function listAdminAccounts(admin) {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw error;
  }

  const users = data.users ?? [];
  const userIds = users.map((user) => user.id);
  const { data: profiles, error: profilesError } = userIds.length
    ? await admin
      .from("profiles")
      .select("id, full_name, company_id, must_change_password")
      .in("id", userIds)
    : { data: [], error: null };

  if (profilesError) {
    throw profilesError;
  }

  const companyIds = [...new Set((profiles ?? []).map((profile) => profile.company_id).filter(Boolean))];
  const { data: companies, error: companiesError } = companyIds.length
    ? await admin
      .from("companies")
      .select("id, name, currency")
      .in("id", companyIds)
    : { data: [], error: null };

  if (companiesError) {
    throw companiesError;
  }

  const profilesByUser = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const companiesById = new Map((companies ?? []).map((company) => [company.id, company]));

  return users.map((user) => {
    const profile = profilesByUser.get(user.id);
    const company = profile?.company_id ? companiesById.get(profile.company_id) : null;

    return {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      bannedUntil: user.banned_until,
      isBlocked: Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now()),
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
      companyId: profile?.company_id ?? user.user_metadata?.company_id ?? null,
      companyName: company?.name ?? null,
      currency: company?.currency ?? null,
      mustChangePassword: Boolean(profile?.must_change_password ?? user.user_metadata?.must_change_password),
    };
  });
}

app.get("/api/admin/accounts", async (req, res) => {
  const context = await requireSuperAdmin(req, res);
  if (!context) {
    return;
  }

  try {
    const accounts = await listAdminAccounts(context.admin);
    res.json({ accounts });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Chargement impossible.",
    });
  }
});

app.post("/api/admin/accounts", async (req, res) => {
  const context = await requireSuperAdmin(req, res);
  if (!context) {
    return;
  }

  const { admin, user: actor } = context;
  const {
    companyName,
    currency = "CHF",
    fullName,
    email,
    password,
    emailConfirm = true,
  } = req.body ?? {};

  if (!companyName?.trim() || !fullName?.trim() || !email?.trim()) {
    res.status(400).json({ error: "Entreprise, nom et email sont requis." });
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  let companyId = null;
  let userId = null;

  try {
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({
        name: companyName.trim(),
        currency: String(currency || "CHF").trim().toUpperCase(),
      })
      .select("id, name, currency")
      .single();

    if (companyError) {
      throw companyError;
    }

    companyId = company.id;

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: Boolean(emailConfirm),
      user_metadata: {
        full_name: fullName.trim(),
        company_id: companyId,
        must_change_password: true,
      },
    });

    if (authError) {
      throw authError;
    }

    userId = authData.user.id;

    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: userId,
        company_id: companyId,
        full_name: fullName.trim(),
        must_change_password: true,
      }, { onConflict: "id" });

    if (profileError) {
      throw profileError;
    }

    res.status(201).json({
      company,
      user: {
        id: userId,
        email: authData.user.email,
      },
    });

    await writeAuditLog(admin, req, {
      actor,
      action: "account.create",
      targetUserId: userId,
      targetEmail: authData.user.email,
      targetCompanyId: company.id,
      metadata: {
        companyName: company.name,
        currency: company.currency,
        emailConfirmed: Boolean(emailConfirm),
        mustChangePassword: true,
      },
    });
  } catch (error) {
    if (userId) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    }
    if (companyId) {
      await admin.from("companies").delete().eq("id", companyId).catch(() => undefined);
    }

    await writeAuditLog(admin, req, {
      actor,
      action: "account.create_failed",
      targetEmail: typeof email === "string" ? email.trim() : null,
      targetCompanyId: companyId,
      metadata: {
        reason: error instanceof Error ? error.message : "Creation impossible.",
      },
    });

    res.status(400).json({
      error: error instanceof Error ? error.message : "Creation impossible.",
    });
  }
});

app.patch("/api/admin/accounts/:userId/block", async (req, res) => {
  const context = await requireSuperAdmin(req, res);
  if (!context) {
    return;
  }

  const { admin, user } = context;
  const { userId } = req.params;
  const blocked = Boolean(req.body?.blocked);

  if (userId === user.id) {
    res.status(400).json({ error: "Impossible de bloquer votre propre compte SA." });
    return;
  }

  try {
    const { data, error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: blocked ? "876000h" : "none",
    });

    if (error) {
      throw error;
    }

    const account = await getAdminAccount(admin, data.user);
    await writeAuditLog(admin, req, {
      actor: user,
      action: blocked ? "account.block" : "account.unblock",
      targetUserId: account.id,
      targetEmail: account.email,
      targetCompanyId: account.companyId,
    });

    res.json({ account });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Modification impossible.",
    });
  }
});

app.patch("/api/admin/accounts/:userId/password", async (req, res) => {
  const context = await requireSuperAdmin(req, res);
  if (!context) {
    return;
  }

  const { admin, user: actor } = context;
  const { userId } = req.params;
  const { password } = req.body ?? {};
  const passwordError = validatePassword(password);

  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  try {
    const { data: existing, error: getError } = await admin.auth.admin.getUserById(userId);
    if (getError) {
      throw getError;
    }

    const { data, error } = await admin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: {
        ...(existing.user.user_metadata ?? {}),
        must_change_password: true,
      },
    });

    if (error) {
      throw error;
    }

    await admin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", userId)
      .throwOnError();

    const account = await getAdminAccount(admin, data.user);
    await writeAuditLog(admin, req, {
      actor,
      action: "account.password_reset",
      targetUserId: account.id,
      targetEmail: account.email,
      targetCompanyId: account.companyId,
      metadata: {
        mustChangePassword: true,
      },
    });

    res.json({ account });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Reset impossible.",
    });
  }
});

app.delete("/api/admin/accounts/:userId", async (req, res) => {
  const context = await requireSuperAdmin(req, res);
  if (!context) {
    return;
  }

  const { admin, user } = context;
  const { userId } = req.params;

  if (userId === user.id) {
    res.status(400).json({ error: "Impossible de supprimer votre propre compte SA." });
    return;
  }

  try {
    const { data: existing } = await admin.auth.admin.getUserById(userId);
    const targetEmail = existing?.user?.email ?? null;
    const targetCompanyId = existing?.user?.user_metadata?.company_id ?? null;

    const { error } = await admin.auth.admin.deleteUser(userId, true);
    if (error) {
      throw error;
    }

    await admin.from("profiles").delete().eq("id", userId).throwOnError();
    await writeAuditLog(admin, req, {
      actor: user,
      action: "account.delete",
      targetUserId: userId,
      targetEmail,
      targetCompanyId,
      metadata: {
        scope: "auth_user_and_profile_only",
      },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Suppression impossible.",
    });
  }
});

app.post("/api/export", async (req, res) => {
  const { format, title = "Dashboard", metrics, monthlyChartData, expensesByCategory, transactions } = req.body;

  try {
    let buffer, contentType, ext;

    switch (format) {
      case "pdf": {
        buffer = await buildPDF({ title, metrics, monthlyChartData, transactions });
        contentType = "application/pdf";
        ext = "pdf";
        break;
      }
      case "csv": {
        const rows = buildCSVRows({ metrics, monthlyChartData, expensesByCategory, transactions });
        buffer = Buffer.from("\uFEFF" + rows.map((r) => r.join(";")).join("\n"), "utf-8");
        contentType = "text/csv;charset=utf-8";
        ext = "csv";
        break;
      }
      default:
        return res.status(400).json({ error: "Format invalide. Utiliser pdf ou csv." });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${title}.${ext}"`);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Export failed", detail: err.message });
  }
});

function buildCSVRows({ metrics, monthlyChartData, expensesByCategory, transactions }) {
  return [
    ["Metrique", "Valeur"],
    ["Cash disponible (CHF)", metrics.cash],
    ["Revenus mensuels (CHF)", metrics.monthlyRevenue],
    ["Depenses mensuelles (CHF)", metrics.monthlyExpenses],
    ["Cashflow net (CHF)", metrics.netCashflow],
    ["Burn rate (CHF)", metrics.burnRate],
    ["Runway (mois)", metrics.runway],
    ["MRR (CHF)", metrics.mrr],
    ["Clients actifs", metrics.activeCustomers],
    [],
    ["--- Evolution mensuelle ---"],
    ["Mois", "Revenus", "Depenses"],
    ...monthlyChartData.map((m) => [m.month, m.revenue, m.expenses]),
    [],
    ["--- Depenses par categorie ---"],
    ["Categorie", "Montant"],
    ...expensesByCategory.map((e) => [e.name, e.value]),
    [],
    ["--- Transactions ---"],
    ["Date", "Libelle", "Categorie", "Type", "Montant", "Statut"],
    ...transactions.map((t) => [t.date, t.label, t.category, t.type, t.amount, t.payment_status]),
  ];
}

function buildPDF({ title, metrics, monthlyChartData, transactions }) {
  return new Promise((resolve, reject) => {
    const doc = new pdfkit({ margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("KPIs");
    doc.fontSize(10)
      .text(`Cash disponible : CHF ${metrics.cash?.toLocaleString("fr-CH")}`)
      .text(`Revenus mensuels : CHF ${metrics.monthlyRevenue?.toLocaleString("fr-CH")}`)
      .text(`Depenses mensuelles : CHF ${metrics.monthlyExpenses?.toLocaleString("fr-CH")}`)
      .text(`Cashflow net : CHF ${metrics.netCashflow?.toLocaleString("fr-CH")}`)
      .text(`Burn rate : CHF ${metrics.burnRate?.toLocaleString("fr-CH")}`)
      .text(`Runway : ${metrics.runway?.toFixed(1)} mois`)
      .text(`MRR : CHF ${metrics.mrr?.toLocaleString("fr-CH")}`)
      .text(`Clients actifs : ${metrics.activeCustomers}`);

    doc.moveDown().fontSize(14).text("Evolution mensuelle");
    doc.fontSize(10);
    monthlyChartData.forEach((m) => {
      doc.text(`${m.month} - Revenus: ${m.revenue?.toLocaleString("fr-CH")} | Depenses: ${m.expenses?.toLocaleString("fr-CH")}`);
    });

    doc.moveDown().fontSize(14).text("Transactions recentes");
    doc.fontSize(10);
    transactions.slice(0, 20).forEach((t) => {
      doc.text(`${t.date} | ${t.label} | ${t.category} | CHF ${t.amount?.toLocaleString("fr-CH")}`);
    });

    doc.end();
  });
}

app.listen(PORT, () => console.log(`Admin/export server running on http://localhost:${PORT}`));
