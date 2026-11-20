import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KINDS, SAMPLES, TEMPLATES, aiWrite, applyTheme, buildHtml, clearSession, getUser, loadAll, saveAll, shareUrl, track, updateName } from "./lib";
import { Icon, Thumb } from "./ui";

const ago = (t) => {
  if (!t) return "";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  return `${Math.floor(m / 1440)} d ago`;
};
const tplName = (id) => TEMPLATES.find((t) => t.id === id)?.name || "Aurora";

function download(p) {
  const b = new Blob([buildHtml(p)], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = (p.name || "portfolio").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".html";
  a.click();
  URL.revokeObjectURL(a.href);
}

function Empty() {
  return (
    <div className="card empty">
      <span className="fic"><Icon n="layout" /></span>
      <h3>No portfolios yet</h3>
      <p className="muted">Create your first one. It only takes a few minutes.</p>
      <Link to="/app/create" className="btn"><Icon n="plus" s={18} /> Create portfolio</Link>
    </div>
  );
}

// ---------------- Dashboard ----------------
export function Dashboard() {
  const user = getUser() || {};
  const [list] = useState(loadAll);
  const h = new Date().getHours();
  const hi = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const last = list.reduce((m, p) => Math.max(m, p.updatedAt || 0), 0);
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>{hi}, {(user.name || "there").split(" ")[0]} 👋</h1>
          <p className="muted">Here's what's happening with your portfolios.</p>
        </div>
        <Link to="/app/create" className="btn hide-m"><Icon n="plus" s={18} /> New portfolio</Link>
      </div>

      <div className="grid3 stats">
        <div className="card stat"><span>Portfolios</span><b>{list.length}</b></div>
        <div className="card stat"><span>Last edited</span><b className="sm">{last ? ago(last) : "-"}</b></div>
        <div className="card stat"><span>AI writer</span><b className="sm ok">Ready</b></div>
      </div>

      <div className="grid3">
        <Link to="/app/create" className="card action"><span className="fic"><Icon n="plus" /></span><b>Create portfolio</b><span className="muted">Start from a template</span></Link>
        <Link to="/app/ai" className="card action"><span className="fic"><Icon n="spark" /></span><b>AI writer</b><span className="muted">Bio, projects, skills</span></Link>
        <Link to="/app/portfolios" className="card action"><span className="fic"><Icon n="folder" /></span><b>My portfolios</b><span className="muted">Share and download</span></Link>
      </div>

      <section>
        <div className="sec-row"><h2>Recent portfolios</h2>{list.length > 0 && <Link to="/app/portfolios" className="lnk">View all</Link>}</div>
        {list.length === 0 ? <Empty /> : (
          <div className="grid3">
            {list.slice(0, 3).map((p) => (
              <Link key={p.id} to={`/app/edit/${p.id}`} className="card pcard">
                <Thumb data={p} h={190} />
                <div className="pinfo"><b>{p.name || "Untitled"}</b><span className="muted">{tplName(p.template)} · {ago(p.updatedAt)}</span></div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="sec-row"><h2>Start from a template</h2></div>
        <div className="grid4">
          {TEMPLATES.map((t, i) => (
            <Link key={t.id} to={`/app/create?template=${t.id}`} className="card pcard">
              <Thumb data={SAMPLES[i]} h={170} />
              <div className="pinfo"><b>{t.name}</b><span className="muted">{t.note}</span></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------- My portfolios ----------------
export function Portfolios() {
  const [list, setList] = useState(loadAll);
  const [copied, setCopied] = useState("");
  function remove(p) {
    if (!window.confirm(`Delete "${p.name || "Untitled"}"? This cannot be undone.`)) return;
    const next = list.filter((x) => x.id !== p.id);
    saveAll(next);
    setList(next);
  }
  async function copy(p) {
    try {
      await navigator.clipboard.writeText(shareUrl(p));
      setCopied(p.id);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      window.prompt("Copy your link:", shareUrl(p));
    }
  }
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>My portfolios</h1><p className="muted">Edit, share or download your websites.</p></div>
        <Link to="/app/create" className="btn"><Icon n="plus" s={18} /> New</Link>
      </div>
      {list.length === 0 ? <Empty /> : (
        <div className="grid3">
          {list.map((p) => (
            <div key={p.id} className="card pcard">
              <Thumb data={p} h={200} />
              <div className="pinfo"><b>{p.name || "Untitled"}</b><span className="muted">{p.title || KINDS[p.kind]?.label} · {tplName(p.template)} · {ago(p.updatedAt)}</span></div>
              <div className="acts">
                <Link to={`/app/edit/${p.id}`} className="btn ghost sm"><Icon n="edit" s={16} /> Edit</Link>
                <a href={shareUrl(p)} target="_blank" rel="noopener" className="btn ghost sm"><Icon n="eye" s={16} /> View</a>
                <button className="btn ghost sm" onClick={() => copy(p)}><Icon n={copied === p.id ? "check" : "link"} s={16} /> {copied === p.id ? "Copied" : "Link"}</button>
                <button className="btn ghost sm" onClick={() => download(p)}><Icon n="down" s={16} /> HTML</button>
                <button className="btn ghost sm danger-t" onClick={() => remove(p)} aria-label="Delete"><Icon n="trash" s={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="muted note">Portfolios are saved on this device. Use <b>Link</b> to share a live copy, or <b>HTML</b> to download a website file you can host anywhere.</p>
    </div>
  );
}

// ---------------- AI tools ----------------
const TOOLS = [
  { id: "bio", title: "Write my bio", text: "A short, polished introduction.", ph: "Example: I'm a final-year business student. I led a campus marketing team and I'm looking for a graduate sales role." },
  { id: "project", title: "Describe a project", text: "Turn rough notes into a clear description.", ph: "Example: Organised a charity fundraiser with 200 guests. Raised $5,000. Managed 12 volunteers." },
  { id: "skills", title: "Suggest skills", text: "Skills that fit your role.", ph: "Example: I work as an office manager and handle scheduling, budgets and supplier contracts." },
  { id: "polish", title: "Polish my text", text: "Fix the wording and tone.", ph: "Paste any text you want improved." },
];

export function AiTools() {
  const nav = useNavigate();
  const [tool, setTool] = useState("bio");
  const [tone, setTone] = useState("Professional");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const cur = TOOLS.find((t) => t.id === tool);

  async function run(e) {
    e.preventDefault();
    if (!text.trim()) return setErr("Tell the AI a little about yourself first.");
    setBusy(true); setErr(""); setOut("");
    try {
      setOut((await aiWrite({ tool, tone, input: text })).text);
    } catch (ex) {
      if (ex.status === 401) { clearSession(); nav("/login"); return; }
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setErr("Select the text and copy it manually."); }
  }

  return (
    <div className="stack">
      <div className="page-head"><div><h1>AI writer</h1><p className="muted">Share a few notes and get a first draft. Always read and edit it so it sounds like you.</p></div></div>
      <div className="grid4 tools">
        {TOOLS.map((t) => (
          <button key={t.id} className={`card toolbtn ${tool === t.id ? "on" : ""}`} onClick={() => { setTool(t.id); setOut(""); setErr(""); }}>
            <b>{t.title}</b><span className="muted">{t.text}</span>
          </button>
        ))}
      </div>
      <div className="split2">
        <form className="card pad" onSubmit={run}>
          <label>Your notes<textarea className="in" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={cur.ph} maxLength={2000} /></label>
          <div className="seg">{["Professional", "Friendly", "Confident"].map((t) => (<button type="button" key={t} className={tone === t ? "on" : ""} onClick={() => setTone(t)}>{t}</button>))}</div>
          {err && <p className="alert" role="alert">{err}</p>}
          <button className="btn full lg" disabled={busy}><Icon n="spark" s={18} /> {busy ? "Writing..." : "Generate"}</button>
        </form>
        <div className="card pad result">
          {busy ? <div className="shimmer"><i /><i /><i /></div> : out ? (
            <><p className="out">{out}</p><button className="btn ghost sm" onClick={copy}><Icon n={copied ? "check" : "copy"} s={16} /> {copied ? "Copied" : "Copy"}</button></>
          ) : <p className="muted">Your draft will appear here.</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------- Settings ----------------
export function Settings() {
  const nav = useNavigate();
  const user = getUser() || {};
  const [name, setName] = useState(user.name || "");
  const [msg, setMsg] = useState("");
  const [theme, setThemeS] = useState(localStorage.getItem("pf_theme") || "system");
  const [motion, setMotionS] = useState(localStorage.getItem("pf_motion") !== "off");

  function save(e) {
    e.preventDefault();
    if (!name.trim()) return setMsg("Please enter your name.");
    updateName(name.trim());
    setMsg("Profile saved.");
  }
  const pickTheme = (t) => { localStorage.setItem("pf_theme", t); setThemeS(t); applyTheme(); };
  const toggleMotion = () => { const on = !motion; localStorage.setItem("pf_motion", on ? "on" : "off"); setMotionS(on); applyTheme(); };
  function wipe() {
    if (!window.confirm("Delete all portfolios saved on this device? This cannot be undone.")) return;
    saveAll([]);
    setMsg("All saved portfolios were deleted.");
  }
  function signOut() { clearSession(); nav("/", { replace: true }); }

  return (
    <div className="stack narrow">
      <div className="page-head"><div><h1>Settings</h1><p className="muted">Manage your profile, look and data.</p></div></div>
      {msg && <p className="notice" role="status">{msg}</p>}

      <form className="card pad" onSubmit={save}>
        <h3>Profile</h3>
        <label>Display name<input className="in" value={name} onChange={(e) => { setName(e.target.value); setMsg(""); }} maxLength={60} /></label>
        <label>Email<input className="in" value={user.email || ""} readOnly /></label>
        <button className="btn">Save changes</button>
      </form>

      <div className="card pad">
        <h3>Appearance</h3>
        <div className="seg">{["light", "dark", "system"].map((t) => (<button key={t} className={theme === t ? "on" : ""} onClick={() => pickTheme(t)}>{t[0].toUpperCase() + t.slice(1)}</button>))}</div>
        <div className="switch-row">
          <div><b>Animations</b><small className="muted">Smooth transitions and effects</small></div>
          <button role="switch" aria-checked={motion} className={`switch ${motion ? "on" : ""}`} onClick={toggleMotion}><i /></button>
        </div>
      </div>

      <div className="card pad">
        <h3>Your data</h3>
        <p className="muted">Portfolios are saved in this browser on this device.</p>
        <button className="btn ghost danger-t" onClick={wipe}><Icon n="trash" s={18} /> Delete all portfolios</button>
      </div>

      <div className="card pad">
        <h3>Session</h3>
        <button className="btn dark" onClick={signOut}><Icon n="out" s={18} /> Sign out</button>
      </div>
    </div>
  );
}
