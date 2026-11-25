import { useState } from "react";
import { getUser } from "./lib";
import { Icon } from "./ui";
import { apiRequestPremium, useMe } from "./plan";

const NEXT_STEPS = "Pricing will be announced soon. When you request Premium, we will note your interest and notify you here as soon as it is available for your account.";

const FREE = ["2 published portfolio links", "4 professional templates", "AI writer: 10 requests per hour", "Download your site as HTML"];
const PRO = ["Up to 100 published portfolio links", "All 8 templates, including new ones", "AI writer: 60 requests per hour", "Your own custom link, like /p/yourname", "No \"Built with Portfolia\" label", "Priority support"];

export default function Upgrade() {
  const me = useMe(true);
  const user = getUser() || {};
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const premium = me?.plan === "premium";

  async function request() {
    setBusy(true); setErr(""); setMsg("");
    try { setMsg((await apiRequestPremium()).message); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>{premium ? "You are Premium" : "Go Premium"}</h1>
          <p className="muted">
            {premium ? (me.premiumUntil ? `Your plan is active until ${new Date(me.premiumUntil).toLocaleDateString()}.` : "Your plan is active with no end date.") : "More templates, more links and more AI, with your own custom link."}
          </p>
        </div>
      </div>

      <div className="plans">
        <div className="card plan">
          <h3>Free</h3>
          <b className="price">Free</b>
          <ul>{FREE.map((x) => (<li key={x}><Icon n="check" s={16} /> {x}</li>))}</ul>
          {!premium && <span className="tag">Your plan</span>}
        </div>
        <div className="card plan pro">
          <span className="ribbon"><Icon n="crown" s={13} /> Premium</span>
          <h3>Premium</h3>
          <b className="price">Pricing soon</b>
          <ul>{PRO.map((x) => (<li key={x}><Icon n="check" s={16} /> {x}</li>))}</ul>
          {premium ? <span className="tag">Active</span> : (
            <button className="btn full" onClick={request} disabled={busy}><Icon n="crown" s={18} /> {busy ? "Sending..." : "Request Premium"}</button>
          )}
        </div>
      </div>

      {msg && <p className="notice" role="status">{msg}</p>}
      {err && <p className="alert" role="alert">{err}</p>}
      {!premium && <p className="muted note">{NEXT_STEPS} We will notify <b>{user.email}</b>.</p>}
    </div>
  );
}
