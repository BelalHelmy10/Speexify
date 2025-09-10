// Core
import express from "express";
import cors from "cors";
import session from "express-session";
import "dotenv/config";
import axios from "axios";

// Auth & DB
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

axios.defaults.withCredentials = true;

/* ---------- Middleware ---------- */

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
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

/* ---------- Helpers ---------- */
function requireAuth(req, res, next) {
  if (!req.session.user)
    return res.status(401).json({ error: "Not authenticated" });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user)
    return res.status(401).json({ error: "Not authenticated" });
  if (req.session.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  next();
}

/* ---------- Health / Hello ---------- */
app.get("/", (_req, res) => res.send("Hello from Speexify API 🚀"));
app.get("/api/message", (_req, res) =>
  res.json({ message: "Hello from the backend 👋" })
);

/* ---------- Public: Packages ---------- */
app.get("/api/packages", async (_req, res) => {
  try {
    const packages = await prisma.package.findMany();
    res.json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

/* ---------- Auth (email/password) ---------- */

// REGISTER: create user and start a session
app.post("/api/auth/register", async (req, res) => {
  try {
    let { email, password, name } = req.body;
    email = (email || "").toLowerCase().trim();
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: name || null, hashedPassword, role: "learner" },
      select: { id: true, email: true, name: true, role: true, timezone: true },
    });

    req.session.user = user; // start session
    res.json({ user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Failed to register" });
  }
});

// LOGIN: verify password and start a session
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

// WHO AM I (legacy)
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

/* ---------- NEW: Profile (Step 2) ---------- */

// GET current user profile (fresh from DB)
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

// PATCH current user profile (name, timezone)
app.patch("/api/me", requireAuth, async (req, res) => {
  try {
    const { name, timezone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.session.user.id },
      data: {
        name: name?.trim() || null,
        timezone: timezone || null,
      },
      select: { id: true, email: true, name: true, role: true, timezone: true },
    });

    // Keep session in sync with latest name/timezone
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

/* ---------- Admin: users ---------- */
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

/* ---------- Sessions (per user or admin) ---------- */

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

/* ---------- Learner summary ---------- */
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

/* ---------- Users (generic) ---------- */
app.get("/api/users", requireAuth, async (req, res) => {
  const where = req.query.role ? { role: String(req.query.role) } : undefined;
  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, role: true, timezone: true },
    orderBy: { email: "asc" },
  });
  res.json(users);
});

// POST /api/me/password  (logged-in user)
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

    // Load the full user (including hashedPassword)
    const user = await prisma.user.findUnique({
      where: { id: req.session.user.id },
      select: { id: true, hashedPassword: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify current password
    const ok = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!ok)
      return res.status(401).json({ error: "Current password is incorrect" });

    // Update hash
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

/* ---------- Server ---------- */
const PORT = 5050;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
