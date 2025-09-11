// web/src/pages/Register.jsx

// ─────────────────────────────────────────────────────────────────────────────
// Purpose: Two-step registration with email verification
// Flow:
//   Step 1 → Send code to email  (/api/auth/register/start)
//   Step 2 → Verify code + set password, then create account
// Notes:
//   - Uses your existing auth styles (auth-page/auth-card/...)
//   - Shows a resend cooldown (60s) and basic error messaging
//   - Keeps cookies (session) via axios.defaults.withCredentials = true
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

export default function Register() {
  // ───────────────────────────────────────────────────────────────────────────
  // Local state (form & UI)
  // - step: which part of the flow the user is on (1 = send code, 2 = complete)
  // - email/code: email to verify & the 6-digit code sent to that email
  // - name/password: account profile & sign-in credential
  // - msg: user-visible feedback message (success/error)
  // - sending/submitting: button loading states
  // - cooldown: seconds until "Resend code" is re-enabled
  // ───────────────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // ───────────────────────────────────────────────────────────────────────────
  // Config
  // - API base: change if your backend runs on a different origin/port
  // ───────────────────────────────────────────────────────────────────────────
  const API = "http://localhost:5050";

  // ───────────────────────────────────────────────────────────────────────────
  // Handler: Step 1 → Send verification code
  // - POST /api/auth/register/start { email }
  // - On success → move to Step 2 and start a 60s resend cooldown
  // ───────────────────────────────────────────────────────────────────────────
  const sendCode = async (e) => {
    e?.preventDefault?.();
    setMsg("");
    setSending(true);
    try {
      await axios.post(`${API}/api/auth/register/start`, { email });
      setStep(2);
      // start cooldown timer (60s)
      setCooldown(60);
      const iv = setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) {
            clearInterval(iv);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setMsg(err.response?.data?.error || "Could not send verification code");
    } finally {
      setSending(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Handler: Step 2 → Complete registration
  // - POST /api/auth/register/complete { email, code, password, name }
  // - On success → show confirmation (you can navigate to /dashboard if desired)
  // ───────────────────────────────────────────────────────────────────────────
  const complete = async (e) => {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/api/auth/register/complete`, {
        email,
        code,
        password,
        name,
      });
      setMsg(`Registered as ${res.data.user.email}. You can now log in.`);
      // Optional redirect:
      // const navigate = useNavigate(); navigate("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render: wrapper & shared header/message
  // - Uses .auth-page / .auth-card for consistent look with Login
  // - Shows a banner when msg is set (error or success)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <main className="auth-page">
      <section className="auth-card">
        {/* ────────────────────────────────────────────────────────────────────
            Page header (title + subcopy)
           ─────────────────────────────────────────────────────────────────── */}
        <header className="auth-head">
          <h1>Register</h1>
          <p>Create your account. We’ll verify your email first.</p>
        </header>

        {/* ────────────────────────────────────────────────────────────────────
            Feedback banner (errors/success)
           ─────────────────────────────────────────────────────────────────── */}
        {msg && (
          <div className="auth-alert" role="alert">
            {msg}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 1: Email only → Send verification code
           ─────────────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <form className="auth-form" onSubmit={sendCode}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button className="btn-primary" type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send verification code"}
            </button>

            {/* Footer: link to login */}
            <footer className="auth-foot">
              <span className="muted">Already have an account?</span>
              <a href="/login" className="link-strong">
                Log in
              </a>
            </footer>
          </form>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 2: Enter code + set name/password → Create account
           ─────────────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <form className="auth-form" onSubmit={complete}>
            {/* Verification code */}
            <div className="field">
              <label htmlFor="code">Verification code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                title="Enter the 6-digit code we sent to your email"
              />
            </div>

            {/* Name (optional) */}
            <div className="field">
              <label htmlFor="name">Name (optional)</label>
              <input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {/* Create account */}
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create account"}
            </button>

            {/* Helper row: resend & change email */}
            <div className="row between" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn-link"
                disabled={cooldown > 0 || sending}
                onClick={sendCode}
                title={
                  cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : "Resend code"
                }
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </button>

              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setStep(1);
                  setMsg("");
                  setCode("");
                }}
              >
                Use a different email
              </button>
            </div>

            {/* Footer: link to login */}
            <footer className="auth-foot">
              <span className="muted">Already verified?</span>
              <a href="/login" className="link-strong">
                Log in
              </a>
            </footer>
          </form>
        )}
      </section>
    </main>
  );
}
