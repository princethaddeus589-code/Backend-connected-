import { useDeferredValue, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { KINDS, TEMPLATES, SAMPLES, aiWrite, blank, clearSession, loadAll, saveAll, track } from "./lib";
import { Icon, Thumb } from "./ui";
import { FREE_TEMPLATES, apiPublish, siteLink, useMe } from "./plan";
import ShareModal from "./Share";

const STEPS = ["Style", "About", "Work", "Contact"];
const SWATCH = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#0f3d6e", "#22d3ee"];

export default function Builder() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [d, setD] = useState(() => {
    const found = id && loadAll().find((p) => p.id === id);
    return found || blank(TEMPLATES.find((t) => t.id === sp.get("template")));
  });
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState("edit");
  const [tone, setTone] = useState("Professional");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [sk, setSk] = useState("");
  const me = useMe();
  const [share, setShare] = useState("");
  const [custom, setCustom] = useState(d.customSlug || "");
  const pv = useDeferredValue(d);
  const mobile = typeof window !== "undefined" && window.innerWidth < 900;

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const setC = (k, v) => setD((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));
  const setItem = (list, i, k, v) => setD((p) => ({ ...p, [list]: p[list].map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const addItem = (list, item) => setD((p) => ({ ...p, [list]: [...p[list], item] }));
  const delItem = (list, i) => setD((p) => ({ ...p, [list]: p[list].filter((_, j) => j !== i) }));

  function persist(extra = {}) {
    const all = loadAll();
    const item = { ...d, ...extra, updatedAt: Date.now() };
    const i = all.findIndex((p) => p.id === d.id);
    if (i >= 0) all[i] = item; else all.unshift(item);
    saveAll(all);
    track("portfolio_saved", { template: d.template, kind: d.kind, isNew: i < 0 });
  }

  async function ai(key, tool, input, done) {
    setBusy(key); setErr("");
    try {
      const r = await aiWrite({ tool, tone, input });
      done(r.text);
    } catch (e) {
      if (e.status === 401) { persist(); clearSession(); nav("/login"); return; }
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const kind = KINDS[d.kind];
  const aiBio = () => {
    if (!d.name.trim() && !d.title.trim() && !d.bio.trim()) return setErr("Add your name and headline first.");
    const has = d.bio.trim();
    const input = has ? d.bio : `Name: ${d.name}\nI am a ${kind.label.toLowerCase()}.\nHeadline: ${d.title}\nLocation: ${d.location}\nSkills: ${d.skills.join(", ")}`;
    ai("bio", has ? "polish" : "bio", input, (t) => set("bio", t));
  };
  const aiSkills = () => {
    if (!d.title.trim() && !d.bio.trim()) return setErr("Add your headline or bio first.");
    ai("skills", "skills", `Role: ${d.title} (${kind.label}).\nAbout: ${d.bio}`, (t) => {
      const found = t.split(/[,\n]/).map((s) => s.replace(/^[\s\-*•\d.]+/, "").trim()).filter(Boolean);
      set("skills", [...new Set([...d.skills, ...found])].slice(0, 14));
    });
  };
  const aiProject = (i) => {
    const p = d.projects[i];
    if (!p.title.trim() && !p.text.trim()) return setErr("Add a title or a few notes first.");
    ai("p" + i, "project", `Project: ${p.title}\nNotes: ${p.text}\nMy role: ${d.title}`, (t) => setItem("projects", i, "text", t));
  };

  const addSkill = () => {
    const v = sk.split(",").map((s) => s.trim()).filter(Boolean);
    if (v.length) set("skills", [...new Set([...d.skills, ...v])].slice(0, 14));
    setSk("");
  };

  async function save() {
    if (busy === "save") return;
    if (!d.name.trim()) { setStep(1); setErr("Please add your name before saving."); return; }
    setErr(""); setBusy("save");
    try {
      const r = await apiPublish(d, d.slug || "", custom.trim());
      persist({ slug: r.slug, customSlug: custom.trim() });
      setD((p) => ({ ...p, slug: r.slug }));
      setShare(siteLink(r.slug));
    } catch (e) {
      persist();
      if (e.status === 401) { clearSession(); nav("/login"); return; }
      setErr(`${e.message} Your portfolio is saved on this device.`);
    } finally {
      setBusy("");
    }
  }

  const AiBtn = ({ k, onClick, children }) => (
    <button type="button" className="btn ghost sm" onClick={onClick} disabled={!!busy}><Icon n="spark" s={16} /> {busy === k ? "Writing..." : children}</button>
  );

  return (
    <div className="builder">
      {share && <ShareModal url={share} name={d.name} title="Your portfolio is live" onClose={() => nav("/app/portfolios")} />}
      <div className="page-head">
        <div><h1>{id ? "Edit portfolio" : "Create portfolio"}</h1><p className="muted">Fill in your details. Your website updates live.</p></div>
        <button className="btn" onClick={save}><Icon n="check" s={18} /> Save</button>
      </div>

      <div className="seg show-m">
        <button className={tab === "edit" ? "on" : ""} onClick={() => setTab("edit")}>Edit</button>
        <button className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>Preview</button>
      </div>

      <div className="bgrid">
        <div className={`bform ${tab === "preview" ? "hide-m" : ""}`}>
          <div className="steps">
            {STEPS.map((s, i) => (
              <button key={s} className={`${step === i ? "on" : ""} ${i < step ? "done" : ""}`} onClick={() => setStep(i)}><span>{i < step ? "✓" : i + 1}</span>{s}</button>
            ))}
          </div>
          {err && <p className="alert" role="alert">{err} {err.includes("Premium") && <Link to="/app/upgrade" className="lnk">See Premium</Link>}</p>}

          {step === 0 && (
            <div className="card pad stackf">
              <h3>I am a...</h3>
              <div className="kinds">
                {Object.entries(KINDS).map(([k, v]) => (
                  <button key={k} className={d.kind === k ? "on" : ""} onClick={() => set("kind", k)}><b>{v.label}</b><span>{v.hint}</span></button>
                ))}
              </div>
              <h3>Template</h3>
              <div className="tplrow">
                {TEMPLATES.map((t, i) => (
                  <button key={t.id} className={`tplpick ${d.template === t.id ? "on" : ""}`} onClick={() => setD((p) => ({ ...p, template: t.id, accent: t.accent }))}>
                    <Thumb data={SAMPLES[i]} h={110} />
                    <b>{t.name}{!FREE_TEMPLATES.includes(t.id) && <i className="pro"><Icon n="crown" s={11} /> Pro</i>}</b>
                  </button>
                ))}
              </div>
              <h3>Accent color</h3>
              <div className="swatches">
                {SWATCH.map((c) => (<button key={c} aria-label={c} className={d.accent === c ? "on" : ""} style={{ background: c }} onClick={() => set("accent", c)} />))}
                <input type="color" value={d.accent} onChange={(e) => set("accent", e.target.value)} aria-label="Custom color" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="card pad stackf">
              <h3>About you</h3>
              <label>Full name<input className="in" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" /></label>
              <label>Headline<input className="in" value={d.title} onChange={(e) => set("title", e.target.value)} placeholder={`e.g. ${kind.label} | what you do best`} /></label>
              <div className="two">
                <label>Location<input className="in" value={d.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" /></label>
                <label>Photo link (optional)<input className="in" value={d.photo} onChange={(e) => set("photo", e.target.value)} placeholder="https://..." /></label>
              </div>
              <div className="tone"><span className="muted">AI tone</span>
                <div className="seg">{["Professional", "Friendly", "Confident"].map((t) => (<button key={t} className={tone === t ? "on" : ""} onClick={() => setTone(t)}>{t}</button>))}</div>
              </div>
              <label>Short bio<textarea className="in" rows={5} value={d.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A few sentences about you..." maxLength={600} /></label>
              <div><AiBtn k="bio" onClick={aiBio}>{d.bio.trim() ? "Improve with AI" : "Write with AI"}</AiBtn></div>
              <label>Skills
                <div className="skillbox">
                  {d.skills.map((s) => (<span key={s} className="chip">{s}<button type="button" onClick={() => set("skills", d.skills.filter((x) => x !== s))} aria-label={`Remove ${s}`}>×</button></span>))}
                  <input value={sk} onChange={(e) => setSk(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } }} onBlur={addSkill} placeholder="Type a skill, press Enter" />
                </div>
              </label>
              <div><AiBtn k="skills" onClick={aiSkills}>Suggest skills</AiBtn></div>
            </div>
          )}

          {step === 2 && (
            <div className="stackf">
              <div className="card pad stackf">
                <h3>{kind.work}</h3>
                {d.projects.map((p, i) => (
                  <div key={i} className="item">
                    <div className="item-head"><b>#{i + 1}</b><button type="button" className="x" onClick={() => delItem("projects", i)} aria-label="Remove"><Icon n="x" s={16} /></button></div>
                    <input className="in" value={p.title} onChange={(e) => setItem("projects", i, "title", e.target.value)} placeholder="Title" />
                    <textarea className="in" rows={3} value={p.text} onChange={(e) => setItem("projects", i, "text", e.target.value)} placeholder="What did you do? Rough notes are fine." />
                    <input className="in" value={p.link} onChange={(e) => setItem("projects", i, "link", e.target.value)} placeholder="Link (optional)" />
                    <div><AiBtn k={"p" + i} onClick={() => aiProject(i)}>Describe with AI</AiBtn></div>
                  </div>
                ))}
                {d.projects.length < 6 && <button type="button" className="btn ghost" onClick={() => addItem("projects", { title: "", text: "", link: "" })}><Icon n="plus" s={18} /> Add item</button>}
              </div>

              <div className="card pad stackf">
                <h3>Experience</h3>
                {d.experience.map((p, i) => (
                  <div key={i} className="item">
                    <div className="item-head"><b>#{i + 1}</b><button type="button" className="x" onClick={() => delItem("experience", i)} aria-label="Remove"><Icon n="x" s={16} /></button></div>
                    <div className="two"><input className="in" value={p.role} onChange={(e) => setItem("experience", i, "role", e.target.value)} placeholder="Role" /><input className="in" value={p.org} onChange={(e) => setItem("experience", i, "org", e.target.value)} placeholder="Organisation" /></div>
                    <input className="in" value={p.period} onChange={(e) => setItem("experience", i, "period", e.target.value)} placeholder="Period, e.g. 2021 - Now" />
                    <textarea className="in" rows={2} value={p.text} onChange={(e) => setItem("experience", i, "text", e.target.value)} placeholder="What you achieved" />
                  </div>
                ))}
                {d.experience.length < 5 && <button type="button" className="btn ghost" onClick={() => addItem("experience", { role: "", org: "", period: "", text: "" })}><Icon n="plus" s={18} /> Add experience</button>}
              </div>

              <div className="card pad stackf">
                <h3>Education</h3>
                {d.education.map((p, i) => (
                  <div key={i} className="item">
                    <div className="item-head"><b>#{i + 1}</b><button type="button" className="x" onClick={() => delItem("education", i)} aria-label="Remove"><Icon n="x" s={16} /></button></div>
                    <input className="in" value={p.school} onChange={(e) => setItem("education", i, "school", e.target.value)} placeholder="School or university" />
                    <div className="two"><input className="in" value={p.degree} onChange={(e) => setItem("education", i, "degree", e.target.value)} placeholder="Degree or certificate" /><input className="in" value={p.period} onChange={(e) => setItem("education", i, "period", e.target.value)} placeholder="Years" /></div>
                  </div>
                ))}
                {d.education.length < 4 && <button type="button" className="btn ghost" onClick={() => addItem("education", { school: "", degree: "", period: "" })}><Icon n="plus" s={18} /> Add education</button>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card pad stackf">
              <h3>How can people reach you?</h3>
              {[["email", "Email", "you@example.com"], ["website", "Website", "yoursite.com"], ["linkedin", "LinkedIn", "linkedin.com/in/you"], ["github", "GitHub", "github.com/you"], ["twitter", "X / Twitter", "x.com/you"]].map(([k, l, ph]) => (
                <label key={k}>{l}<input className="in" value={d.contact[k] || ""} onChange={(e) => setC(k, e.target.value)} placeholder={ph} /></label>
              ))}
              <label>
                Custom link {me?.plan !== "premium" && <i className="pro"><Icon n="crown" s={11} /> Premium</i>}
                <input className="in" value={custom} disabled={me?.plan !== "premium"} onChange={(e) => setCustom(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="yourname" />
                <small>{location.host}/p/{custom || "your-link"}</small>
              </label>
              <button className="btn lg full" onClick={save} disabled={busy === "save"}><Icon n="check" s={18} /> {busy === "save" ? "Publishing..." : "Save and get my link"}</button>
            </div>
          )}

          <div className="stepnav">
            <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {step < 3 && <button className="btn" onClick={() => setStep(step + 1)}>Next <Icon n="arrow" s={18} /></button>}
          </div>
        </div>

        <div className={`bprev ${tab === "edit" ? "hide-m" : ""}`}>
          <div className="browser">
            <div className="bar"><i /><i /><i /><span>{(d.name || "yourname").toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourname"}.portfolia.site</span></div>
            <Thumb data={pv} h={mobile ? "62vh" : "calc(100vh - 220px)"} w={mobile ? 420 : 1100} live />
          </div>
        </div>
      </div>
    </div>
  );
}
