// web/src/pages/ForgotPassword.jsx
import { useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

const API = "http://localhost:5050";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const start = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await axios.post(`${API}/api/auth/password/reset/start`, { email });
      setStep(2);
      setCooldown(60);
      const iv = setInterval(() => {
        setCooldown((s) => (s <= 1 ? (clearInterval(iv), 0) : s - 1));
      }, 1000);
    } catch {
      // backend always returns {ok:true}; show generic message
    } finally {
      setBusy(false);
    }
  };

  const complete = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await axios.post(`${API}/api/auth/password/reset/complete`, {
        email,
        code,
        newPassword,
      });
      setMsg("Password reset. You’re now signed in.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Could not reset password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-head">
          <h1>Reset your password</h1>
          <p>We’ll send a 6-digit code to your email.</p>
        </header>

        {msg && <div className="auth-alert">{msg}</div>}

        {step === 1 && (
          <form className="auth-form" onSubmit={start}>
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
            <button className="btn-primary" disabled={busy}>
              {busy ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={complete}>
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
              />
            </div>

            <div className="field">
              <label htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                type="password"
                minLength={8}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn-primary" disabled={busy}>
              {busy ? "Updating…" : "Reset password"}
            </button>

            <div className="row between" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn-link"
                onClick={start}
                disabled={busy || cooldown > 0}
                title={cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </button>
              <a className="btn-link" href="/login">
                Back to login
              </a>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
