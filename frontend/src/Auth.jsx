import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiForgotReset, apiForgotStart, apiSignin, apiSignupStart, apiSignupVerify, saveSession } from "./lib";
import { Icon, Logo } from "./ui";
import Social from "./Social";

const COPY = {
  login: ["Welcome back", "Sign in to continue to your dashboard."],
  signup: ["Create your account", "Start building your portfolio in minutes."],
  forgot: ["Reset your password", "Enter your email and we'll send you a 6-digit code."],
};

export default function Auth({ mode }) {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", code: "" });
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const email = f.email.trim().toLowerCase();

  useEffect(() => { setStep(1); setErr(""); setInfo(""); setWait(0); setF((x) => ({ ...x, code: "", password: "" })); }, [mode]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const finish = (user) => { saveSession(user); nav("/app", { replace: true }); };

  async function submit(e) {
    e.preventDefault();
    setErr(""); setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        if (!email || !f.password) return setErr("Enter your email and password.");
        finish(await apiSignin({ email, password: f.password }));
      } else if (mode === "signup") {
        if (step === 1) {
          if (!f.name.trim()) return setErr("Please enter your name.");
          if (!email) return setErr("Enter your email.");
          if (f.password.length < 6) return setErr("Password must be at least 6 characters.");
          await apiSignupStart({ name: f.name.trim(), email, password: f.password });
          setStep(2); setWait(60); setInfo(`We sent a 6-digit code to ${email}.`);
        } else {
          if (f.code.length !== 6) return setErr("Enter the 6-digit code.");
          await apiSignupVerify({ name: f.name.trim(), email, password: f.password, code: f.code });
          finish(await apiSignin({ email, password: f.password }));
        }
      } else if (step === 1) {
        if (!email) return setErr("Enter your email.");
        await apiForgotStart({ email });
        setStep(2); setWait(60); setInfo(`If ${email} has an account, a 6-digit code is on its way.`);
      } else {
        if (f.code.length !== 6) return setErr("Enter the 6-digit code.");
        if (f.password.length < 6) return setErr("New password must be at least 6 characters.");
        await apiForgotReset({ email, code: f.code, password: f.password });
        finish(await apiSignin({ email, password: f.password }));
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setErr(""); setInfo(""); setBusy(true);
    try {
      if (mode === "signup") await apiSignupStart({ name: f.name.trim(), email, password: f.password });
      else await apiForgotStart({ email });
      setWait(60); setInfo("A new code is on its way.");
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  const [title, sub] = step === 2 ? ["Check your email", info || "Enter the 6-digit code we sent you."] : COPY[mode];
  const cta = mode === "login" ? "Sign in" : mode === "signup" ? (step === 1 ? "Continue" : "Verify and create account") : step === 1 ? "Send code" : "Reset password";

  return (
    <div className="auth">
      <aside className="auth-side">
        <Logo />
        <div>
          <h2>Your story deserves a beautiful website.</h2>
          <ul>
            <li><Icon n="check" s={18} /> Professional templates</li>
            <li><Icon n="check" s={18} /> AI that writes for you</li>
            <li><Icon n="check" s={18} /> Share a link or download your site</li>
          </ul>
        </div>
        <small>Free to start. No design skills needed.</small>
      </aside>
      <main className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-logo"><Logo /></div>
          <h1>{title}</h1>
          <p className="muted">{sub}</p>

          {step === 1 && mode !== "forgot" && <Social onUser={finish} onError={setErr} />}

          {mode === "signup" && step === 1 && (
            <label>Full name<input className="in" value={f.name} onChange={set("name")} placeholder="Amara Okafor" autoComplete="name" /></label>
          )}
          {step === 1 && (
            <label>Email<input className="in" type="email" value={f.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" /></label>
          )}
          {step === 1 && mode !== "forgot" && (
            <label>
              Password
              <input className="in" type="password" value={f.password} onChange={set("password")} placeholder="At least 6 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </label>
          )}
          {mode === "login" && <Link to="/forgot" className="lnk forgot">Forgot password?</Link>}

          {step === 2 && (
            <>
              <label>
                6-digit code
                <input className="in code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, "") })} placeholder="000000" autoFocus />
              </label>
              {mode === "forgot" && (
                <label>New password<input className="in" type="password" value={f.password} onChange={set("password")} placeholder="At least 6 characters" autoComplete="new-password" /></label>
              )}
            </>
          )}

          {err && <p className="alert" role="alert">{err}</p>}
          <button className="btn full lg" disabled={busy}>{busy ? "Please wait..." : cta}</button>

          {step === 2 && (
            <div className="row2">
              <button type="button" className="lnk linkbtn" disabled={wait > 0 || busy} onClick={resend}>{wait > 0 ? `Resend code in ${wait}s` : "Resend code"}</button>
              <button type="button" className="lnk linkbtn" onClick={() => { setStep(1); setErr(""); setInfo(""); }}>Use a different email</button>
            </div>
          )}

          <p className="muted center">
            {mode === "login" && <>New here? <Link to="/signup" className="lnk">Create an account</Link></>}
            {mode === "signup" && <>Already have an account? <Link to="/login" className="lnk">Sign in</Link></>}
            {mode === "forgot" && <Link to="/login" className="lnk">Back to sign in</Link>}
          </p>
        </form>
      </main>
    </div>
  );
}
