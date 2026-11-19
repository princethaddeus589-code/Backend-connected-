import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "./api";

const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-cobalt focus:ring-4 focus:ring-cobalt/15 sm:text-sm";

function Card({ title, text, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {text && <p className="mt-1 text-sm text-body">{text}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem("userName") || "");
  const [message, setMessage] = useState("");
  const email = localStorage.getItem("userEmail") || "";

  function saveProfile(e) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setMessage("Please enter your name.");
      return;
    }
    localStorage.setItem("userName", clean);
    setName(clean);
    setMessage("Profile saved.");
  }

  function clearPortfolios() {
    if (!window.confirm("Delete all portfolios saved on this device? This cannot be undone.")) return;
    localStorage.removeItem("portfolios");
    window.dispatchEvent(new Event("portfolios-change"));
    setMessage("All saved portfolios were deleted.");
  }

  function signOut() {
    clearSession();
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 text-body">Manage your profile and your data.</p>
      </header>

      {message && (
        <p role="status" className="mt-6 rounded-lg bg-cobalt/10 px-4 py-3 text-sm font-medium text-cobalt">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-5">
        <Card title="Profile" text="This name appears in your account menu and on new portfolios.">
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Display name</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setMessage("");
                }}
                maxLength={60}
                className={input}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input value={email} readOnly className={`${input} bg-mist text-muted`} />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
            >
              Save changes
            </button>
          </form>
        </Card>

        <Card title="Your data" text="Portfolios are saved in this browser on this device only.">
          <button
            onClick={clearPortfolios}
            className="rounded-lg border border-line px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Delete all saved portfolios
          </button>
        </Card>

        <Card title="Session">
          <button
            onClick={signOut}
            className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign out
          </button>
        </Card>
      </div>
    </div>
  );
}
