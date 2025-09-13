// api/index.js

// ─────────────────────────────────────────────────────────────────────────────
// Core: Express app, CORS, sessions, dotenv, axios, mail
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import cors from "cors";
import session from "express-session";
import "dotenv/config";
import axios from "axios";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

// ─────────────────────────────────────────────────────────────────────────────
// Auth & DB: bcrypt for password hashing, Prisma for DB, crypto for code hashing
// ─────────────────────────────────────────────────────────────────────────────
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const app = express();
const prisma = new PrismaClient();
axios.defaults.withCredentials = true;

/* ========================================================================== */
/*                             MAILER (shared)                                 */
/*  Build one Nodemailer transporter at startup. Fallback logs emails in dev.  */
/* ========================================================================== */
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Speexify <no-reply@speexify.local>";

const hasSMTP =
  !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

let transporter = null;
if (hasSMTP) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g. smtp.sendgrid.net
    port: Number(process.env.SMTP_PORT || 587), // 587 (STARTTLS)
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  // Optional: verify connection once at boot
  transporter
    .verify()
    .then(() => console.log("📧 SMTP transporter ready"))
    .catch((err) => {
      console.warn(
        "⚠️  SMTP verify failed. Falling back to console email.",
        err?.message || err
      );
      transporter = null; // ensure we fall back to console logs
    });
}

/** Send an email (uses transporter if available; else logs to console in dev) */
async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log(`\n[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }
  await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
}

/* ========================================================================== */
/*                               MIDDLEWARE                                   */
/* ========================================================================== */

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000", // ← adjust to your web app origin
    credentials: true,
  })
);

if (!process.env.SESSION_SECRET) {
  console.warn(
    "⚠️  SESSION_SECRET is not set. Using an insecure fallback for dev."
  );
}

app.use(
  session({
    name: "speexify.sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true in production (HTTPS)
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

/* ========================================================================== */
/*                                  HELPERS                                   */
/* ========================================================================== */

// Small utilities for the verification / codes flow
const genCode = () => String(Math.floor(100000 + Math.random() * 900000)); // 6-digit numeric
const hashCode = (raw) =>
  crypto.createHash("sha256").update(String(raw)).digest("hex");

// Google OAuth verifier (uses GOOGLE_CLIENT_ID from .env)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// For OAuth accounts we don't need a user-chosen password.
// We'll store a random bcrypt hash to satisfy NOT NULL schema.
async function randomHashedPassword() {
  const rand = crypto.randomBytes(32).toString("hex");
  return await bcrypt.hash(rand, 10);
}

// Cents → number of dollars (float) for quick display (admin only UIs)
function centsToDollars(cents) {
  return typeof cents === "number" ? Math.round(cents) / 100 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW (Step 2): unified “public user” projection + audit helper (used later)
// ─────────────────────────────────────────────────────────────────────────────
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  timezone: true,
  isDisabled: true,
  rateHourlyCents: true,
  ratePerSessionCents: true,
};

/** Minimal audit helper (no-op if Audit model not added yet). */
async function audit(actorId, action, entity, entityId, meta = {}) {
  try {
    await prisma.audit.create({
      data: { actorId, action, entity, entityId, meta },
    });
  } catch {
    /* ignore if table not present yet */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW (Step 2): tightened auth guards with “view-as” support
// - Fetch current user from DB (so role/disable updates apply immediately)
// - Block disabled accounts
// - Expose req.user (the real logged-in user) and req.viewUserId (impersonation)
// ─────────────────────────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const sessionUser = req.session.user;
  if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: publicUserSelect,
    });

    if (!dbUser || dbUser.isDisabled) {
      req.session.destroy(() => {});
      return res.status(403).json({ error: "Account disabled" });
    }

    req.user = dbUser; // the admin (or normal) user actually logged in
    req.viewUserId = req.session.asUserId || dbUser.id; // who we’re “viewing as”
    next();
  } catch (e) {
    console.error("requireAuth error:", e);
    return res.status(500).json({ error: "Auth check failed" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  next();
}

/* ========================================================================== */
/*                              HEALTH / HELLO                                */
/* ========================================================================== */

app.get("/", (_req, res) => res.send("Hello from Speexify API 🚀"));
app.get("/api/message", (_req, res) =>
  res.json({ message: "Hello from the backend 👋" })
);

/* ========================================================================== */
/*                             PUBLIC: PACKAGES                                */
/* ========================================================================== */

app.get("/api/packages", async (_req, res) => {
  try {
    const packages = await prisma.package.findMany();
    res.json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

/* ========================================================================== */
/*                       AUTH: EMAIL/PASSWORD (LEGACY)                        */
/*  NOTE: We now *guard* the old one-step register endpoint.                   */
/*        By default, it is DISABLED and returns 410 Gone.                     */
/*        Set ALLOW_LEGACY_REGISTER=true in .env to temporarily re-enable.     */
/* ========================================================================== */

const ALLOW_LEGACY_REGISTER =
  String(process.env.ALLOW_LEGACY_REGISTER || "").toLowerCase() === "true";

if (ALLOW_LEGACY_REGISTER) {
  // ── Legacy register (optional, not recommended) ───────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      let { email, password, name } = req.body;
      email = (email || "").toLowerCase().trim();
      if (!email || !password)
        return res
          .status(400)
          .json({ error: "Email and password are required" });

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing)
        return res.status(409).json({ error: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, name: name || null, hashedPassword, role: "learner" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          timezone: true,
        },
      });

      req.session.asUserId = null; // clear view-as
      req.session.user = user; // start session
      res.json({ user });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Failed to register" });
    }
  });
} else {
  // ── Hard stop: force the new verified flow ────────────────────────────────
  app.post("/api/auth/register", (_req, res) => {
    return res.status(410).json({
      error:
        "Registration requires email verification. Use /api/auth/register/start then /api/auth/register/complete.",
    });
  });
}

/* ========================================================================== */
/*                           GOOGLE OAUTH (ID TOKEN)                           */
/*  POST /api/auth/google  { credential }                                      */
/*  - Verify Google ID token (aud=GOOGLE_CLIENT_ID)                            */
/*  - If user exists (by email): sign them in (block if disabled)              */
/*  - Else: create user with random hashed password                            */
/* ========================================================================== */
app.post("/api/auth/google", async (req, res) => {
  try {
    const idToken = String(req.body?.credential || "");
    if (!idToken) return res.status(400).json({ error: "Missing credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || "")
      .toLowerCase()
      .trim();
    const emailVerified = !!payload?.email_verified;
    const name = payload?.name || null;

    if (!email || !emailVerified) {
      return res.status(400).json({ error: "Email not verified with Google" });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user?.isDisabled) {
      return res.status(403).json({ error: "Account disabled" });
    }

    if (!user) {
      const hashedPassword = await randomHashedPassword();
      user = await prisma.user.create({
        data: { email, name, hashedPassword, role: "learner" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          timezone: true,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          timezone: true,
        },
      });
    }

    req.session.asUserId = null; // clear view-as
    req.session.user = user;
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("google auth error:", err?.message || err);
    return res.status(401).json({ error: "Invalid Google credential" });
  }
});

/* ========================================================================== */
/*                          PASSWORD RESET (2-step)                            */
/*  Step 1: /api/auth/password/reset/start     → send 6-digit code            */
/*  Step 2: /api/auth/password/reset/complete  → verify & set new password    */
/* ========================================================================== */

// START: always respond {ok:true} (don’t leak whether an email exists)
app.post("/api/auth/password/reset/start", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .toLowerCase()
      .trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.json({ ok: true });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ ok: true });

    const prev = await prisma.passwordResetCode.findUnique({
      where: { email },
    });
    if (prev) {
      const last = new Date(prev.updatedAt).getTime();
      const elapsed = Date.now() - last;
      if (elapsed < 60_000) return res.json({ ok: true }); // silent throttle
    }

    const code = genCode();
    const data = {
      email,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + 10 * 60_000),
      attempts: 0,
    };

    await prisma.passwordResetCode.upsert({
      where: { email },
      update: {
        codeHash: data.codeHash,
        expiresAt: data.expiresAt,
        attempts: 0,
      },
      create: data,
    });

    await sendEmail(
      email,
      "Your Speexify password reset code",
      `<p>Use this code to reset your password:</p>
       <p style="font-size:20px;font-weight:700;letter-spacing:2px">${code}</p>
       <p>This code expires in 10 minutes.</p>`
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("password/reset/start error:", err);
    return res.json({ ok: true });
  }
});

// COMPLETE: verify code & set new password
app.post("/api/auth/password/reset/complete", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .toLowerCase()
      .trim();
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ error: "Valid email is required" });
    if (!/^\d{6}$/.test(code))
      return res.status(400).json({ error: "A 6-digit code is required" });
    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid code" }); // generic

    const pr = await prisma.passwordResetCode.findUnique({ where: { email } });
    if (!pr) return res.status(400).json({ error: "Invalid or expired code" });

    if (new Date() > pr.expiresAt) {
      await prisma.passwordResetCode.delete({ where: { email } });
      return res
        .status(400)
        .json({ error: "Code expired. Request a new one." });
    }
    if (pr.attempts >= 5) {
      await prisma.passwordResetCode.delete({ where: { email } });
      return res
        .status(429)
        .json({ error: "Too many attempts. Try again later." });
    }

    const ok = pr.codeHash === hashCode(code);
    if (!ok) {
      await prisma.passwordResetCode.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({ error: "Invalid code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { hashedPassword } });
    await prisma.passwordResetCode.delete({ where: { email } });

    req.session.asUserId = null;
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      timezone: user.timezone ?? null,
    };

    return res.json({ ok: true });
  } catch (err) {
    console.error("password/reset/complete error:", err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

/* ========================================================================== */
/*                                   LOGIN                                    */
/* ========================================================================== */

app.post("/api/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = (email || "").toLowerCase().trim();
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.isDisabled)
      return res.status(403).json({ error: "Account disabled" });

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      timezone: user.timezone ?? null,
    };
    req.session.asUserId = null; // clear view-as
    req.session.user = sessionUser;
    res.json({ user: sessionUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// NEW (Step 2): WHO AM I (supports impersonation state)
// WHO AM I (session peek) — compatible shape { user: ... }
app.get("/api/auth/me", async (req, res) => {
  // no session → always { user: null }
  if (!req.session.user) return res.json({ user: null });

  const adminUser = await prisma.user.findUnique({
    where: { id: req.session.user.id },
    select: publicUserSelect,
  });

  // disabled / missing → clear and return { user: null }
  if (!adminUser || adminUser.isDisabled) {
    req.session.destroy(() => {});
    return res.json({ user: null });
  }

  // if impersonating, return viewed user + extra flags (but still under `user`)
  if (req.session.asUserId) {
    const asUser = await prisma.user.findUnique({
      where: { id: req.session.asUserId },
      select: publicUserSelect,
    });
    return res.json({
      user: asUser ? { ...asUser, _impersonating: true } : null,
      admin: adminUser, // optional, for banners like “viewing as”
    });
  }

  // normal case
  return res.json({ user: adminUser });
});

// LOGOUT
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("speexify.sid");
    res.json({ ok: true });
  });
});

/* ========================================================================== */
/*                   NEW AUTH: EMAIL VERIFICATION (RECOMMENDED)               */
/*  Step 1: /api/auth/register/start     → send 6-digit code                  */
/*  Step 2: /api/auth/register/complete  → verify code & create account       */
/*  Requires Prisma model: VerificationCode.                                  */
/* ========================================================================== */

app.post("/api/auth/register/start", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .toLowerCase()
      .trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const prev = await prisma.verificationCode.findUnique({ where: { email } });
    if (prev) {
      const last = new Date(prev.updatedAt).getTime();
      const elapsed = Date.now() - last;
      if (elapsed < 60_000) {
        const wait = Math.ceil((60_000 - elapsed) / 1000);
        return res
          .status(429)
          .json({ error: `Please wait ${wait}s before resending` });
      }
    }

    const code = genCode();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60_000);

    await prisma.verificationCode.upsert({
      where: { email },
      update: { codeHash, expiresAt, attempts: 0 },
      create: { email, codeHash, expiresAt, attempts: 0 },
    });

    await sendEmail(
      email,
      "Your Speexify verification code",
      `<p>Your verification code is:</p>
       <p style="font-size:20px;font-weight:700;letter-spacing:2px">${code}</p>
       <p>This code expires in 10 minutes.</p>`
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("register/start error:", err);
    return res.status(500).json({ error: "Failed to start registration" });
  }
});

app.post("/api/auth/register/complete", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .toLowerCase()
      .trim();
    const code = String(req.body?.code || "").trim();
    const password = String(req.body?.password || "");
    const name = String(req.body?.name || "");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "A 6-digit code is required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
      return res.status(409).json({ error: "Email is already registered" });

    const v = await prisma.verificationCode.findUnique({ where: { email } });
    if (!v)
      return res
        .status(400)
        .json({ error: "No verification code found for this email" });

    if (new Date() > v.expiresAt) {
      await prisma.verificationCode.delete({ where: { email } });
      return res.status(400).json({ error: "Verification code has expired" });
    }

    if (v.attempts >= 5) {
      await prisma.verificationCode.delete({ where: { email } });
      return res
        .status(429)
        .json({ error: "Too many attempts. Request a new code." });
    }

    const isMatch = v.codeHash === hashCode(code);
    if (!isMatch) {
      await prisma.verificationCode.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({ error: "Invalid verification code" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: name || null, hashedPassword, role: "learner" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        timezone: true,
        isDisabled: true,
      },
    });

    await prisma.verificationCode.delete({ where: { email } });

    req.session.asUserId = null;
    req.session.user = user;

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("register/complete error:", err);
    return res.status(500).json({ error: "Failed to complete registration" });
  }
});

/* ========================================================================== */
/*                              PROFILE (Step 2)                               */
/*  User profile read/update for name/timezone; keeps session in sync.         */
/*  NOTE (Step 2): read/write uses req.viewUserId → works with "view-as".      */
/* ========================================================================== */

app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.viewUserId }, // ← view-as aware
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(me);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

app.patch("/api/me", requireAuth, async (req, res) => {
  try {
    const { name, timezone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.viewUserId }, // ← view-as aware
      data: { name: name?.trim() || null, timezone: timezone || null },
      select: { id: true, email: true, name: true, role: true, timezone: true },
    });

    if (req.viewUserId === req.user.id) {
      req.session.user = {
        ...req.session.user,
        name: updated.name,
        timezone: updated.timezone,
      };
    }

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* ========================================================================== */
/*                                 ADMIN: USERS (Step 3)                      */
/*  Endpoints for:                                                            */
/*   - List users with search                                                 */
/*   - Create user                                                            */
/*   - Change role / enable-disable                                           */
/*   - Send reset-password code                                               */
/*   - Impersonate (start/stop) with audit                                    */
/* ========================================================================== */

app.get(
  "/api/admin/users",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { q = "", role = "" } = req.query;
      const where = {};
      if (q) {
        where.OR = [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ];
      }
      if (role) where.role = String(role);

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          timezone: true,
          isDisabled: true,
          createdAt: true,
        },
        orderBy: { id: "asc" },
      });
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

// CREATE user (admin invite)
app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    let { email, name = "", role = "learner", timezone = null } = req.body;
    email = String(email || "")
      .toLowerCase()
      .trim();
    if (!email) return res.status(400).json({ error: "email required" });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "User already exists" });

    // Create with a random password; they’ll reset via email.
    const rand = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(rand, 10);

    const user = await prisma.user.create({
      data: { email, name: name || null, role, timezone, hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        timezone: true,
        isDisabled: true,
      },
    });

    // Immediately send a reset code so they can set their password
    const code = genCode();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60_000);

    await prisma.passwordResetCode.upsert({
      where: { email },
      update: { codeHash, expiresAt, attempts: 0 },
      create: { email, codeHash, expiresAt, attempts: 0 },
    });

    await sendEmail(
      email,
      "Welcome to Speexify — set your password",
      `<p>Hi${name ? " " + name : ""},</p>
       <p>Your setup code is:</p>
       <p style="font-size:20px;font-weight:700;letter-spacing:2px">${code}</p>
       <p>Use it on the “Forgot password” page within 10 minutes.</p>`
    );

    await audit(req.user.id, "user_create", "User", user.id, { email, role });

    res.status(201).json({ user });
  } catch (err) {
    console.error("admin.createUser error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PATCH user: role / enable-disable / name / timezone
app.patch(
  "/api/admin/users/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { role, isDisabled, name, timezone } = req.body;

      const before = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, isDisabled: true },
      });
      if (!before) return res.status(404).json({ error: "Not found" });

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(role ? { role } : {}),
          ...(typeof isDisabled === "boolean" ? { isDisabled } : {}),
          ...(name !== undefined ? { name } : {}),
          ...(timezone !== undefined ? { timezone } : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          timezone: true,
          isDisabled: true,
        },
      });

      if (role && role !== before.role) {
        await audit(req.user.id, "role_change", "User", id, {
          from: before.role,
          to: role,
        });
      }
      if (typeof isDisabled === "boolean" && isDisabled !== before.isDisabled) {
        await audit(
          req.user.id,
          isDisabled ? "user_disable" : "user_enable",
          "User",
          id
        );
      }

      res.json(user);
    } catch (err) {
      console.error("admin.patchUser error:", err);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// Send password-reset code to a user (admin-triggered)
app.post(
  "/api/admin/users/:id/reset-password",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return res.status(404).json({ error: "Not found" });

      const code = genCode();
      const codeHash = hashCode(code);
      const expiresAt = new Date(Date.now() + 10 * 60_000);

      await prisma.passwordResetCode.upsert({
        where: { email: user.email },
        update: { codeHash, expiresAt, attempts: 0 },
        create: { email: user.email, codeHash, expiresAt, attempts: 0 },
      });

      await sendEmail(
        user.email,
        "Reset your Speexify password",
        `<p>Hi ${user.name || ""}</p>
       <p>Your reset code is:</p>
       <p style="font-size:20px;font-weight:700;letter-spacing:2px">${code}</p>
       <p>Use it on the “Forgot password” page within 10 minutes.</p>`
      );

      await audit(req.user.id, "password_reset_send", "User", id);
      res.json({ ok: true });
    } catch (err) {
      console.error("admin.resetPassword error:", err);
      res.status(500).json({ error: "Failed to send reset" });
    }
  }
);

// IMPERSONATE (start/stop)
app.post(
  "/api/admin/impersonate/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const targetId = Number(req.params.id);
      if (targetId === req.user.id)
        return res.status(400).json({ error: "Cannot impersonate yourself" });

      const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, isDisabled: true },
      });
      if (!target || target.isDisabled)
        return res.status(404).json({ error: "Target not available" });

      req.session.asUserId = targetId; // mark “view as”
      await audit(req.user.id, "impersonate_start", "User", targetId);
      res.json({ ok: true });
    } catch (err) {
      console.error("admin.impersonateStart error:", err);
      res.status(500).json({ error: "Failed to impersonate" });
    }
  }
);

app.post(
  "/api/admin/impersonate/stop",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      if (req.session.asUserId) {
        await audit(
          req.user.id,
          "impersonate_stop",
          "User",
          req.session.asUserId
        );
      }
      req.session.asUserId = null;
      res.json({ ok: true });
    } catch (err) {
      console.error("admin.impersonateStop error:", err);
      res.status(500).json({ error: "Failed to stop impersonation" });
    }
  }
);

// PATCH teacher rates (cents). Body: { rateHourlyCents?, ratePerSessionCents? }
app.patch(
  "/api/admin/teachers/:id/rates",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const { rateHourlyCents, ratePerSessionCents } = req.body;

    const teacher = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!teacher) return res.status(404).json({ error: "Not found" });
    if (teacher.role !== "teacher")
      return res.status(400).json({ error: "User is not a teacher" });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(rateHourlyCents !== undefined
          ? { rateHourlyCents: Number(rateHourlyCents) || 0 }
          : {}),
        ...(ratePerSessionCents !== undefined
          ? { ratePerSessionCents: Number(ratePerSessionCents) || 0 }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        rateHourlyCents: true,
        ratePerSessionCents: true,
      },
    });

    await audit(req.user.id, "teacher_rates_update", "User", id, {
      rateHourlyCents: updated.rateHourlyCents,
      ratePerSessionCents: updated.ratePerSessionCents,
    });

    res.json(updated);
  }
);

/* ========================================================================== */
/*                             SESSIONS (LESSONS)                              */
/* ========================================================================== */

// List sessions for the *viewed* user (admin can “view as”)
app.get("/api/sessions", requireAuth, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.viewUserId }, // ← view-as aware
      include: {
        teacher: { select: { id: true, name: true, email: true } }, // 👈 include teacher
      },
      orderBy: { startAt: "asc" },
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

// Teacher: sessions assigned to me (view-as aware)
app.get("/api/teacher/sessions", requireAuth, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { teacherId: req.viewUserId },
      include: {
        user: { select: { id: true, email: true, name: true } }, // learner
      },
      orderBy: { startAt: "asc" },
    });
    res.json(sessions);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load teacher sessions" });
  }
});

/* ========================================================================== */
/*                          TEACHER SUMMARY (next)                            */
/*  GET /api/teacher/summary                                                  */
/*  Returns the next upcoming session this teacher will teach, plus counts.   */
/* ========================================================================== */
app.get("/api/teacher/summary", requireAuth, async (req, res) => {
  const now = new Date();
  try {
    const nextTeach = await prisma.session.findFirst({
      where: { teacherId: req.viewUserId, startAt: { gt: now } },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        meetingUrl: true,
        user: { select: { id: true, name: true, email: true } }, // learner
      },
    });

    const upcomingTeachCount = await prisma.session.count({
      where: { teacherId: req.viewUserId, startAt: { gt: now } },
    });

    const taughtCount = await prisma.session.count({
      where: {
        teacherId: req.viewUserId,
        OR: [
          { endAt: { lt: now } },
          { AND: [{ endAt: null }, { startAt: { lt: now } }] },
        ],
      },
    });

    res.json({ nextTeach, upcomingTeachCount, taughtCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load teacher summary" });
  }
});

// Admin: list all sessions (with learner info + filters)
// Admin: list all sessions (with learner + teacher info)
// GET /api/admin/sessions?q=&userId=&teacherId=&from=&to=&limit=&offset=
app.get("/api/admin/sessions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      q = "",
      userId = "",
      teacherId = "",
      from = "", // YYYY-MM-DD
      to = "", // YYYY-MM-DD
      limit = "50",
      offset = "0",
    } = req.query;

    const where = {};

    if (userId) where.userId = Number(userId);
    if (teacherId) where.teacherId = Number(teacherId);

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { teacher: { email: { contains: q, mode: "insensitive" } } },
        { teacher: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1); // inclusive end date
        where.startAt.lt = end;
      }
    }

    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = Math.max(parseInt(offset, 10) || 0, 0);

    const [items, total] = await prisma.$transaction([
      prisma.session.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
          teacher: { select: { id: true, email: true, name: true } },
        },
        orderBy: { startAt: "desc" },
        take,
        skip,
      }),
      prisma.session.count({ where }),
    ]);

    res.json({
      items,
      total,
      limit: take,
      offset: skip,
      hasMore: skip + items.length < total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

// Admin: teacher workload summary
// GET /api/admin/teachers/workload?from=&to=&teacherId=
app.get(
  "/api/admin/teachers/workload",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { from = "", to = "", teacherId = "" } = req.query;

    const where = {};
    if (teacherId) where.teacherId = Number(teacherId);
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1);
        where.startAt.lt = end;
      }
    }

    const rows = await prisma.session.findMany({
      where: { ...where, teacherId: { not: null } },
      include: {
        teacher: {
          select: {
            id: true,
            email: true,
            name: true,
            rateHourlyCents: true,
            ratePerSessionCents: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
    });

    // group in JS (simpler than Prisma groupBy preview)
    const map = new Map(); // teacherId -> { teacher, sessions, minutes }
    for (const s of rows) {
      const t = s.teacher;
      const key = t.id;
      const end = s.endAt ? new Date(s.endAt) : null;
      const start = new Date(s.startAt);
      const minutes = end ? Math.max(0, Math.round((end - start) / 60000)) : 60; // default 60 if missing
      if (!map.has(key)) map.set(key, { teacher: t, sessions: 0, minutes: 0 });
      const agg = map.get(key);
      agg.sessions += 1;
      agg.minutes += minutes;
    }

    const result = Array.from(map.values()).map(
      ({ teacher, sessions, minutes }) => {
        const hourly = teacher.rateHourlyCents || 0;
        const perSess = teacher.ratePerSessionCents || 0;
        const hourlyCost = (minutes / 60) * hourly;
        const perSessCost = sessions * perSess;
        const method = hourly ? "hourly" : perSess ? "per_session" : "none";
        const applied =
          method === "hourly"
            ? hourlyCost
            : method === "per_session"
            ? perSessCost
            : 0;
        return {
          teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
          sessions,
          minutes,
          hours: +(minutes / 60).toFixed(2),
          rateHourlyCents: hourly,
          ratePerSessionCents: perSess,
          payrollHourlyUSD: centsToDollars(hourlyCost),
          payrollPerSessionUSD: centsToDollars(perSessCost),
          payrollAppliedUSD: centsToDollars(applied),
          method,
        };
      }
    );

    res.json(result);
  }
);

// Admin: create session
app.post("/api/sessions", requireAuth, requireAdmin, async (req, res) => {
  const {
    userId,
    title,
    date,
    startTime,
    duration,
    endTime,
    meetingUrl,
    notes,
  } = req.body;

  if (!userId || !title || !date || !startTime) {
    return res
      .status(400)
      .json({ error: "userId, title, date, startTime are required" });
  }

  const startAt = new Date(`${date}T${startTime}:00`);
  if (Number.isNaN(startAt.getTime()))
    return res.status(400).json({ error: "Invalid date/time" });

  let endAt = null;
  if (endTime) {
    const e = new Date(`${date}T${endTime}:00`);
    if (Number.isNaN(e.getTime()))
      return res.status(400).json({ error: "Invalid endTime" });
    endAt = e;
  } else if (duration) {
    endAt = new Date(startAt.getTime() + Number(duration) * 60 * 1000);
  }

  try {
    const session = await prisma.session.create({
      data: {
        title,
        startAt,
        endAt,
        meetingUrl: meetingUrl || null,
        notes: notes || null,
        user: { connect: { id: Number(userId) } },
        ...(req.body.teacherId
          ? { teacher: { connect: { id: Number(req.body.teacherId) } } }
          : {}),
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        teacher: { select: { id: true, email: true, name: true } },
      },
    });
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Admin: update session
app.patch("/api/sessions/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const {
    title,
    date,
    startTime,
    endTime,
    duration,
    meetingUrl,
    notes,
    userId,
  } = req.body;
  const data = {};

  if (title !== undefined) data.title = title;
  if (meetingUrl !== undefined) data.meetingUrl = meetingUrl || null;
  if (notes !== undefined) data.notes = notes || null;
  if (userId) data.user = { connect: { id: Number(userId) } };

  // teacherId can be set, changed, or cleared
  if (req.body.teacherId !== undefined) {
    const t = Number(req.body.teacherId);
    if (t) data.teacher = { connect: { id: t } };
    else data.teacher = { disconnect: true }; // when "" or 0 is sent
  }

  if (date && startTime) {
    const startAt = new Date(`${date}T${startTime}:00`);
    if (Number.isNaN(startAt.getTime()))
      return res.status(400).json({ error: "Invalid date/time" });
    data.startAt = startAt;

    if (endTime) {
      const e = new Date(`${date}T${endTime}:00`);
      if (Number.isNaN(e.getTime()))
        return res.status(400).json({ error: "Invalid endTime" });
      data.endAt = e;
    } else if (duration) {
      data.endAt = new Date(startAt.getTime() + Number(duration) * 60 * 1000);
    } else {
      data.endAt = null;
    }
  }

  try {
    const updated = await prisma.session.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// Admin: delete session
app.delete("/api/sessions/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.session.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

/* ========================================================================== */
/*                              LEARNER SUMMARY                                */
/*  NOTE (Step 2): uses req.viewUserId so it works while “viewing as”.         */
/* ========================================================================== */

app.get("/api/me/summary", requireAuth, async (req, res) => {
  const now = new Date();

  try {
    const nextSession = await prisma.session.findFirst({
      where: { userId: req.viewUserId, startAt: { gt: now } }, // ← view-as aware
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        meetingUrl: true,
      },
    });

    const upcomingCount = await prisma.session.count({
      where: { userId: req.viewUserId, startAt: { gt: now } },
    });

    const completedCount = await prisma.session.count({
      where: {
        userId: req.viewUserId,
        OR: [
          { endAt: { lt: now } },
          { AND: [{ endAt: null }, { startAt: { lt: now } }] },
        ],
      },
    });

    res.json({ nextSession, upcomingCount, completedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

/* ========================================================================== */
/*                                  USERS                                     */
/* ========================================================================== */

app.get("/api/users", requireAuth, async (req, res) => {
  const where = req.query.role ? { role: String(req.query.role) } : undefined;
  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, role: true, timezone: true },
    orderBy: { email: "asc" },
  });
  res.json(users);
});

// Teachers list (active + disabled, filterable by ?active=1)
// GET /api/teachers?active=1
app.get("/api/teachers", requireAuth, async (req, res) => {
  const onlyActive = String(req.query.active || "") === "1";
  const where = { role: "teacher" };
  if (onlyActive) where.isDisabled = false;

  const teachers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      isDisabled: true,
      rateHourlyCents: true,
      ratePerSessionCents: true,
    },
    orderBy: [{ isDisabled: "asc" }, { email: "asc" }],
  });
  res.json(teachers);
});

// Change password (logged-in user ONLY; not affected by view-as)
app.post("/api/me/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords are required" });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }, // ← always your own password
      select: { id: true, hashedPassword: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!ok)
      return res.status(401).json({ error: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

/* ========================================================================== */
/*                                  SERVER                                    */
/* ========================================================================== */

const PORT = 5050;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
