import { useCallback, useEffect, useState } from "react";
import { adminGet, adminPost } from "./lib";
import { adminNotifDelete, adminNotifList, adminNotify, adminSetPlan } from "./plan";
import { Icon } from "./ui";

const LABEL = {
  signup: "Signed up", signin: "Signed in", signin_failed: "Failed sign-in", ai_write: "AI request",
  portfolio_saved: "Portfolio saved", portfolio_deleted: "Portfolio deleted", portfolio_shared: "Link copied",
  portfolio_downloaded: "Site downloaded", portfolio_published: "Portfolio published", premium_requested: "Premium requested",
  admin_gave_premium: "Premium given", admin_removed_premium: "Premium removed", admin_notification: "Notification sent",
  admin_disabled_user: "User disabled", admin_enabled_user: "User enabled",
  password_reset_requested: "Reset code sent", password_reset: "Password reset",
};
const TONE = { signup: "ok", signin: "", signin_failed: "bad", ai_write: "ai", portfolio_saved: "ok", portfolio_published: "ok", portfolio_deleted: "bad", admin_disabled_user: "bad", premium_requested: "ai", admin_gave_premium: "ok" };
const FILTERS = ["", "signup", "signin", "signin_failed", "ai_write", "portfolio_published", "premium_requested"];
const KIND = { update: "Update", template: "New template", feature: "New feature", premium: "Premium", info: "Info" };
const AUD = { all: "Everyone", premium: "Premium users", admin: "Admins only" };

const when = (t) => {
  if (!t) return "never";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  if (m < 43200) return `${Math.floor(m / 1440)} d ago`;
  return new Date(t).toLocaleDateString();
};

function detail(e) {
  const m = e.meta || {};
  if (e.type === "ai_write") return `${m.tool || ""} · ${m.ok ? "worked" : "failed (" + (m.status || "?") + ")"}${m.model ? " · " + m.model : ""}`;
  if (e.type === "signin_failed") return m.reason || "";
  if (e.type.startsWith("portfolio")) return [m.template, m.kind, m.isNew === true ? "new" : ""].filter(Boolean).join(" · ");
  if (m.target) return m.target + (m.days ? ` · ${m.days} days` : "");
  return "";
}

function EventRow({ e }) {
  return (
    <li className="ev">
      <span className={`dot ${TONE[e.type] || ""}`} />
      <div><b>{LABEL[e.type] || e.type}</b><small>{e.email || "visitor"}{detail(e) ? " · " + detail(e) : ""}</small></div>
      <time>{when(e.ts)}</time>
    </li>
  );
}

function Bars({ series }) {
  const max = Math.max(1, ...series.map((s) => s.signins + s.signups + s.ai + s.portfolios));
  return (
    <div className="bars">
      {series.map((s) => {
        const total = s.signins + s.signups + s.ai + s.portfolios;
        return (
          <div key={s.day} className="bcol" title={`${s.day}: ${s.signups} sign-ups, ${s.signins} sign-ins, ${s.ai} AI, ${s.portfolios} portfolios`}>
            <div className="bstack" style={{ height: `${(total / max) * 100}%` }}>
              <i style={{ flex: s.signups, background: "#10b981" }} />
              <i style={{ flex: s.signins, background: "#6366f1" }} />
              <i style={{ flex: s.ai, background: "#d946ef" }} />
              <i style={{ flex: s.portfolios, background: "#f59e0b" }} />
            </div>
            <span>{s.day.slice(3)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [ov, setOv] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", kind: "update", audience: "all" });
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true); setErr("");
    try {
      if (tab === "overview") setOv(await adminGet("/overview"));
      if (tab === "users") setUsers((await adminGet("/users")).users);
      if (tab === "activity") setEvents((await adminGet("/events?limit=200" + (filter ? "&type=" + filter : ""))).events);
      if (tab === "notifications") setNotifs((await adminNotifList()).items);
    } catch (e) {
      setErr(e.status === 403 ? "This account is not an admin. Add your email to ADMIN_EMAILS on the backend." : e.message);
    } finally {
      setBusy(false);
    }
  }, [tab, filter]);
  useEffect(() => { load(); }, [load]);

  async function toggle(u) {
    if (!window.confirm(`${u.disabled ? "Enable" : "Disable"} ${u.email}?`)) return;
    try {
      await adminPost("/users/disable", { uid: u.uid, disabled: !u.disabled });
      setUsers((list) => list.map((x) => (x.uid === u.uid ? { ...x, disabled: !u.disabled } : x)));
    } catch (e) { setErr(e.message); }
  }

  async function setPlan(u) {
    setErr(""); setOk("");
    try {
      if (u.plan === "premium") {
        if (!window.confirm(`Remove Premium from ${u.email}?`)) return;
        await adminSetPlan(u.uid, "free", 0);
        setUsers((l) => l.map((x) => (x.uid === u.uid ? { ...x, plan: "free", premiumUntil: 0 } : x)));
      } else {
        const days = window.prompt(`Days of Premium for ${u.email}\n(0 = no end date)`, "30");
        if (days === null) return;
        const d = Math.max(0, parseInt(days, 10) || 0);
        const r = await adminSetPlan(u.uid, "premium", d);
        setUsers((l) => l.map((x) => (x.uid === u.uid ? { ...x, plan: "premium", premiumUntil: r.premiumUntil } : x)));
        setOk(`${u.email} is now Premium.`);
      }
    } catch (e) { setErr(e.message); }
  }

  async function send(e) {
    e.preventDefault();
    setErr(""); setOk("");
    if (!form.title.trim()) return setErr("Add a title.");
    setBusy(true);
    try {
      await adminNotify(form);
      setOk("Notification sent.");
      setForm({ ...form, title: "", body: "" });
      setNotifs((await adminNotifList()).items);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  async function removeNotif(n) {
    if (!window.confirm("Delete this notification for everyone?")) return;
    try { await adminNotifDelete(n.id); setNotifs((l) => l.filter((x) => x.id !== n.id)); } catch (e) { setErr(e.message); }
  }

  const shown = users.filter((u) => (u.email + u.name).toLowerCase().includes(q.toLowerCase()));
  const s = ov?.stats, t = ov?.totals;

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Admin dashboard</h1><p className="muted">Everything happening in your app.</p></div>
        <button className="btn ghost sm" onClick={load} disabled={busy}><Icon n="refresh" s={16} /> {busy ? "Loading" : "Refresh"}</button>
      </div>
      <div className="seg">{["overview", "users", "activity", "notifications"].map((x) => (<button key={x} className={tab === x ? "on" : ""} onClick={() => { setTab(x); setOk(""); }}>{x[0].toUpperCase() + x.slice(1)}</button>))}</div>
      {err && <p className="alert" role="alert">{err}</p>}
      {ok && <p className="notice" role="status">{ok}</p>}

      {tab === "overview" && ov && (
        <>
          {ov.dbError && <p className="alert">Activity tracking is off. Reason: {ov.dbError}</p>}
          <div className="grid4 astats">
            <div className="card stat"><span>Total users</span><b>{s.totalUsers}</b></div>
            <div className="card stat"><span>New (7 days)</span><b>{s.newUsers7d}</b></div>
            <div className="card stat"><span>Active (24h)</span><b>{s.active24h}</b></div>
            <div className="card stat"><span>Disabled</span><b>{s.disabledUsers}</b></div>
            <div className="card stat"><span>Sign-ins</span><b>{t.signins}</b></div>
            <div className="card stat"><span>Failed sign-ins</span><b className={t.failedSignins ? "bad" : ""}>{t.failedSignins}</b></div>
            <div className="card stat"><span>Portfolios saved</span><b>{t.portfoliosSaved}</b></div>
            <div className="card stat"><span>Links / downloads</span><b>{t.portfoliosShared} / {t.downloads}</b></div>
            <div className="card stat"><span>AI requests</span><b>{t.aiRequests}</b></div>
            <div className="card stat"><span>AI failures</span><b className={t.aiFailures ? "bad" : "ok"}>{t.aiFailures}</b></div>
          </div>
          <div className="card pad">
            <h3>Last 14 days</h3>
            <Bars series={ov.series} />
            <div className="legend"><span><i style={{ background: "#10b981" }} />Sign-ups</span><span><i style={{ background: "#6366f1" }} />Sign-ins</span><span><i style={{ background: "#d946ef" }} />AI</span><span><i style={{ background: "#f59e0b" }} />Portfolios</span></div>
            <small>Based on the latest {ov.sample} events.</small>
          </div>
          <div className="split2">
            <div className="card pad">
              <h3>AI tool usage</h3>
              {Object.keys(ov.aiTools).length === 0 ? <p className="muted">No AI requests yet.</p> : Object.entries(ov.aiTools).map(([k, v]) => (
                <div key={k} className="hbar"><span>{k}</span><div><i style={{ width: `${(v / t.aiRequests) * 100}%` }} /></div><b>{v}</b></div>
              ))}
            </div>
            <div className="card pad">
              <h3>Recent activity</h3>
              {ov.recent.length === 0 ? <p className="muted">Nothing yet.</p> : <ul className="evs">{ov.recent.slice(0, 10).map((e) => <EventRow key={e.id} e={e} />)}</ul>}
            </div>
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="card pad">
          <input className="in" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <small>{shown.length} of {users.length} users · {users.filter((u) => u.plan === "premium").length} premium</small>
          <ul className="evs">
            {shown.map((u) => (
              <li key={u.uid} className="ev user">
                <span className="avatar">{(u.name || u.email || "?").charAt(0).toUpperCase()}</span>
                <div>
                  <b>{u.name || "No name"} {u.admin && <em className="tag">admin</em>}{u.plan === "premium" && <em className="tag pro"><Icon n="crown" s={11} /> premium</em>}{u.disabled && <em className="tag bad">disabled</em>}</b>
                  <small>{u.email} · joined {when(u.created)} · last seen {when(u.lastSignIn)}{u.plan === "premium" && u.premiumUntil ? ` · premium until ${new Date(u.premiumUntil).toLocaleDateString()}` : ""}</small>
                </div>
                <div className="uacts">
                  <button className="btn ghost sm" onClick={() => setPlan(u)}>{u.plan === "premium" ? "Remove Premium" : "Give Premium"}</button>
                  {!u.admin && <button className={`btn ghost sm ${u.disabled ? "" : "danger-t"}`} onClick={() => toggle(u)}>{u.disabled ? "Enable" : "Disable"}</button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "activity" && (
        <div className="card pad">
          <div className="filters">{FILTERS.map((f) => (<button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f ? LABEL[f] : "All"}</button>))}</div>
          {events.length === 0 && !busy ? <p className="muted">No activity yet.</p> : <ul className="evs">{events.map((e) => <EventRow key={e.id} e={e} />)}</ul>}
        </div>
      )}

      {tab === "notifications" && (
        <div className="split2">
          <form className="card pad" onSubmit={send}>
            <h3>Send a notification</h3>
            <label>Title<input className="in" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={80} placeholder="4 new templates are here" /></label>
            <label>Message<textarea className="in" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={400} placeholder="Open Create and pick Noir, Bloom, Terminal or Studio." /></label>
            <div className="two">
              <label>Type<select className="in" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{Object.entries(KIND).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></label>
              <label>Send to<select className="in" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{Object.entries(AUD).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></label>
            </div>
            <button className="btn" disabled={busy}><Icon n="bell" s={18} /> Send</button>
          </form>
          <div className="card pad">
            <h3>Recent notifications</h3>
            {notifs.length === 0 ? <p className="muted">Nothing sent yet.</p> : (
              <ul className="evs">
                {notifs.map((n) => (
                  <li key={n.id} className="ev">
                    <span className="dot ai" />
                    <div><b>{n.title}</b><small>{KIND[n.kind] || "Info"} · {AUD[n.audience] || n.audience} · {when(n.ts)}{n.body ? " · " + n.body : ""}</small></div>
                    <button className="x" onClick={() => removeNotif(n)} aria-label="Delete"><Icon n="trash" s={16} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
