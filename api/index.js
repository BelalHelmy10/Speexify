// Import express
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
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
    credentials: true,
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

const PORT = 5050;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
