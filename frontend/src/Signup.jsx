import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiSignup, apiSignin, saveSession } from "./api";
import AuthLayout, { fieldClass } from "./AuthLayout";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiSignup({ name: name.trim(), email: email.trim(), password });

      // Sign in automatically after registration
      try {
        const session = await apiSignin({ email: email.trim(), password });
        saveSession(session);
      } catch {
        navigate("/login", { replace: true });
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        ["Failed to fetch", "Load failed"].includes(err.message)
          ? "Cannot reach the server. Check your connection and try again."
          : err.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes a minute. Then pick a template and start building."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cobalt hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Morgan"
            autoComplete="name"
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
              className={`${fieldClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 text-sm font-medium text-muted hover:text-ink"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
