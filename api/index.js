// Import express
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import session from "express-session";
import "dotenv/config";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// minimal CORS so 3000 can call 5050
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // 👈 important
  })
);

app.use(
  session({
    name: "speexify.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true in production behind HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// helpers
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

app.get("/", (req, res) => {
  res.send("Hello from Speexify API 🚀");
});

app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from the backend 👋" });
});

app.get("/api/packages", async (req, res) => {
  try {
    const packages = await prisma.package.findMany();
    res.json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

app.get("/api/protected/hello", requireAuth, (req, res) => {
  res.json({ message: `Hello, ${req.session.user.email}` });
});

app.get("/api/admin/users", requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { id: "asc" },
    });
    res.json(users);
  } catch (err) {
    next(err); // let your error middleware handle it
  }
});

// FAKE LOGIN (no DB yet): sets a session
app.post("/api/auth/test-login", (req, res) => {
  // in real flow you'll check email/password
  req.session.user = { id: 1, role: "learner", name: "Test User" };
  res.json({ ok: true, user: req.session.user });
});

// WHO AM I: reads session
app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

// LOGOUT: destroys session
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("speexify.sid");
    res.json({ ok: true });
  });
});

// REGISTER: create user and start a session
app.post("/api/auth/register", async (req, res) => {
  try {
    let { email, password, name } = req.body;
    email = email.toLowerCase().trim();
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: name || null, hashedPassword, role: "learner" },
      select: { id: true, email: true, name: true, role: true },
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
    email = email.toLowerCase().trim();
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // keep only safe fields in session
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    req.session.user = sessionUser;
    res.json({ user: sessionUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

app.get("/api/sessions", async (req, res) => {
  // must be logged in
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

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

// GET /api/users  (optionally filter by ?role=learner)
app.get("/api/users", async (req, res) => {
  if (!req.session?.user)
    return res.status(401).json({ error: "Not logged in" });

  const where = req.query.role ? { role: String(req.query.role) } : undefined;

  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, role: true },
    orderBy: { email: "asc" },
  });

  res.json(users);
});

// POST /api/sessions  (admin only)
app.post("/api/sessions", async (req, res) => {
  if (!req.session?.user)
    return res.status(401).json({ error: "Not logged in" });
  if (req.session.user.role !== "admin")
    return res.status(403).json({ error: "Admins only" });

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

  // Minimal validation
  if (!userId || !title || !date || !startTime) {
    return res
      .status(400)
      .json({ error: "userId, title, date, startTime are required" });
  }

  // Combine date + startTime into a JS Date (local -> ISO)
  // date = "2025-09-24", startTime = "10:00"
  const startAt = new Date(`${date}T${startTime}:00`);
  if (Number.isNaN(startAt.getTime())) {
    return res.status(400).json({ error: "Invalid date/time" });
  }

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

// GET /api/me/summary  -> next session + counts for the logged-in user
app.get("/api/me/summary", async (req, res) => {
  if (!req.session?.user)
    return res.status(401).json({ error: "Not logged in" });

  const now = new Date();
  const isAdmin = req.session.user.role === "admin";
  const whereMine = isAdmin ? {} : { userId: req.session.user.id };

  try {
    // Next upcoming session (startAt in the future)
    const nextSession = await prisma.session.findFirst({
      where: {
        ...whereMine,
        startAt: { gt: now },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        meetingUrl: true,
      },
    });

    // Counts
    const upcomingCount = await prisma.session.count({
      where: {
        ...whereMine,
        startAt: { gt: now },
      },
    });

    const completedCount = await prisma.session.count({
      where: {
        ...whereMine,
        // consider completed if endAt in past (or startAt in past when no endAt)
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

const PORT = 5050;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
