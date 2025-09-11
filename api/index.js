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

// Require a logged-in user (protect routes)
function requireAuth(req, res, next) {
  if (!req.session.user)
    return res.status(401).json({ error: "Not authenticated" });
  next();
}

// Require an admin user (protect admin routes)
function requireAdmin(req, res, next) {
  if (!req.session.user)
    return res.status(401).json({ error: "Not authenticated" });
  if (req.session.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  next();
}

// Small utilities for the verification flow
const nowMs = () => Date.now();
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

// Toggle (default: verification required)
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
/*  - If user exists (by email): sign them in                                  */
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
    // payload contains: sub (googleId), email, email_verified, name, picture, ...
    const googleId = payload?.sub;
    const email = String(payload?.email || "")
      .toLowerCase()
      .trim();
    const emailVerified = !!payload?.email_verified;
    const name = payload?.name || null;

    if (!email || !emailVerified) {
      return res.status(400).json({ error: "Email not verified with Google" });
    }

    // Look up by email (keep it simple for this baby step)
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // First time: create a learner with a random hashed password
      const hashedPassword = await randomHashedPassword();
      user = await prisma.user.create({
        data: {
          email,
          name,
          hashedPassword,
          role: "learner",
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          timezone: true,
        },
      });
    } else {
      // If user exists, make sure we return the usual shape
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

    // Start your normal session
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

    // If user doesn't exist, return ok anyway (privacy)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ ok: true });

    // Cooldown check
    const prev = await prisma.passwordResetCode.findUnique({
      where: { email },
    });
    if (prev) {
      const last = new Date(prev.updatedAt).getTime();
      const elapsed = Date.now() - last;
      if (elapsed < 60_000) {
        // Still return ok (don’t leak), but front-end will throttle on its own
        return res.json({ ok: true });
      }
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
    // Still return ok to avoid account enumeration
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
    await prisma.user.update({
      where: { email },
      data: { hashedPassword },
    });

    await prisma.passwordResetCode.delete({ where: { email } });

    // Optional: log them in right away
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

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      timezone: user.timezone ?? null,
    };
    req.session.user = sessionUser;
    res.json({ user: sessionUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// WHO AM I (session peek)
app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session.user || null });
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

// START: send a code if email is not taken (cooldown 60s, expiry 10 min)
app.post("/api/auth/register/start", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .toLowerCase()
      .trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    // not allowed if the user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    // 60s resend cooldown using updatedAt
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

    // Upsert (do not set email in update path)
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
    console.error(
      "register/start error:",
      err.code || err.name || "",
      err.message || "",
      err.meta || ""
    );
    return res.status(500).json({ error: "Failed to start registration" });
  }
});

// COMPLETE: verify code and create the user; starts a session
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

    // Create user (hash password)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: name || null, hashedPassword, role: "learner" },
      select: { id: true, email: true, name: true, role: true, timezone: true },
    });

    // Clean up the code row
    await prisma.verificationCode.delete({ where: { email } });

    // Start a session (keeps behavior consistent)
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
/* ========================================================================== */

app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.session.user.id },
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
      where: { id: req.session.user.id },
      data: { name: name?.trim() || null, timezone: timezone || null },
      select: { id: true, email: true, name: true, role: true, timezone: true },
    });

    req.session.user = {
      ...req.session.user,
      name: updated.name,
      timezone: updated.timezone,
    };
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* ========================================================================== */
/*                                 ADMIN: USERS                               */
/* ========================================================================== */

app.get("/api/admin/users", requireAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        timezone: true,
        createdAt: true,
      },
      orderBy: { id: "asc" },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/* ========================================================================== */
/*                             SESSIONS (LESSONS)                              */
/* ========================================================================== */

// List sessions for current user (admins see all)
app.get("/api/sessions", requireAuth, async (req, res) => {
  const isAdmin = req.session.user.role === "admin";
  const where = isAdmin ? {} : { userId: req.session.user.id };
  try {
    const sessions = await prisma.session.findMany({
      where,
      orderBy: { startAt: "asc" },
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

// Admin: list all sessions (with learner info)
app.get("/api/admin/sessions", requireAdmin, async (_req, res) => {
  const sessions = await prisma.session.findMany({
    orderBy: { startAt: "desc" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  res.json(sessions);
});

// Admin: create session
app.post("/api/sessions", requireAdmin, async (req, res) => {
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
      },
    });
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Admin: update session
app.patch("/api/sessions/:id", requireAdmin, async (req, res) => {
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
app.delete("/api/sessions/:id", requireAdmin, async (req, res) => {
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
/* ========================================================================== */

app.get("/api/me/summary", requireAuth, async (req, res) => {
  const now = new Date();
  const isAdmin = req.session.user.role === "admin";
  const whereMine = isAdmin ? {} : { userId: req.session.user.id };

  try {
    const nextSession = await prisma.session.findFirst({
      where: { ...whereMine, startAt: { gt: now } },
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
      where: { ...whereMine, startAt: { gt: now } },
    });

    const completedCount = await prisma.session.count({
      where: {
        ...whereMine,
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

// Change password (logged-in user)
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
      where: { id: req.session.user.id },
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
