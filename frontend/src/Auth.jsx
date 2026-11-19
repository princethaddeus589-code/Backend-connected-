import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiSignin, apiSignup, saveSession } from "./lib";
import { Icon, Logo } from "./ui";

export default function Auth({ mode }) {
  const isSignup = mode === "signup";
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (isSignup && !f.name.trim()) return setErr("Please enter your name.");
    if (!f.email.trim() || !f.password) return setErr("Enter your email and password.");
    if (isSignup && f.password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    try {
      if (isSignup) await apiSignup(f);
      const user = await apiSignin({ email: f.email, password: f.password });
      saveSession(user);
      nav("/app", { replace: true });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

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
          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="muted">{isSignup ? "Start building your portfolio in minutes." : "Sign in to continue to your dashboard."}</p>
          {isSignup && (
            <label>Full name<input className="in" value={f.name} onChange={set("name")} placeholder="Amara Okafor" autoComplete="name" /></label>
          )}
          <label>Email<input className="in" type="email" value={f.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" /></label>
          <label>Password<input className="in" type="password" value={f.password} onChange={set("password")} placeholder="At least 6 characters" autoComplete={isSignup ? "new-password" : "current-password"} /></label>
          {err && <p className="alert" role="alert">{err}</p>}
          <button className="btn full lg" disabled={busy}>{busy ? "Please wait..." : isSignup ? "Create account" : "Sign in"}</button>
          <p className="muted center">
            {isSignup ? "Already have an account? " : "New here? "}
            <Link to={isSignup ? "/login" : "/signup"} className="lnk">{isSignup ? "Sign in" : "Create an account"}</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
