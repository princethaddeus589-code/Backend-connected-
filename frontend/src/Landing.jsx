import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KINDS, getUser } from "./lib";
import { Icon, Logo, Reveal } from "./ui";

const WORDS = ["students", "teachers", "founders", "developers", "freelancers", "creatives"];

// Little "website" cards that drift behind the hero
const CARDS = [
  { n: "Amara Okafor", r: "Student", mb: "#efe6d3", mf: "#161513", ma: "#ff5b2e", a: "3/4.2" },
  { n: "Daniel Mensah", r: "Developer", mb: "#0f0f10", mf: "#f2eee5", ma: "#d6ff3c", a: "3/3.5" },
  { n: "Grace Adeyemi", r: "Teacher", mb: "#d6ff3c", mf: "#111110", ma: "#111110", a: "3/4.6" },
  { n: "Michael Bello", r: "Founder", mb: "#2342ff", mf: "#ffffff", ma: "#ffd166", a: "3/3.8" },
  { n: "Zainab Musa", r: "Designer", mb: "#ffc9b5", mf: "#2a1308", ma: "#2a1308", a: "3/4.4" },
  { n: "Tunde Alade", r: "Photographer", mb: "#14342b", mf: "#f2eee5", ma: "#e9c46a", a: "3/3.6" },
  { n: "Chioma Eze", r: "Nutritionist", mb: "#d4c6ff", mf: "#1d1340", ma: "#1d1340", a: "3/4.3" },
  { n: "Ibrahim Sule", r: "Architect", mb: "#e7e0d0", mf: "#111110", ma: "#8a6d3b", a: "3/3.7" },
  { n: "Fatima Bello", r: "Lawyer", mb: "#1b1b1d", mf: "#ffffff", ma: "#ff5b2e", a: "3/4.5" },
  { n: "Kemi Ojo", r: "Chef", mb: "#ff6b4a", mf: "#1a0905", ma: "#1a0905", a: "3/3.5" },
  { n: "Samuel Obi", r: "Engineer", mb: "#bfe3ff", mf: "#0a2540", ma: "#0a2540", a: "3/4.1" },
  { n: "Ada Nwosu", r: "Writer", mb: "#4a5a2b", mf: "#f6f1e3", ma: "#f1d27a", a: "3/3.9" },
];
const COLS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [2, 6, 10, 1], [5, 9, 3, 7]];
const DUR = [44, 56, 50, 62, 48];

function Mini({ c }) {
  return (
    <div className="mini" style={{ aspectRatio: c.a }}>
      <div className="mi" style={{ "--mb": c.mb, "--mf": c.mf, "--ma": c.ma }}>
        <div className="m-nav"><i /><i /><i /></div>
        <div className="m-av">{c.n[0]}</div>
        <b>{c.n}</b>
        <span>{c.r}</span>
        <div className="m-lines"><i /><i /></div>
        <div className="m-chips"><u /><u /><u /></div>
      </div>
    </div>
  );
}

function Rot() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);
  return <em key={i} className="rot">{WORDS[i]}</em>;
}

export default function Landing() {
  const user = getUser();
  const [splash] = useState(() => {
    try { if (sessionStorage.getItem("pf_splash")) return false; sessionStorage.setItem("pf_splash", "1"); } catch { return false; }
    return true;
  });
  const [gone, setGone] = useState(!splash);
  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => setGone(true), 3200);
    return () => clearTimeout(t);
  }, [splash]);

  return (
    <div className="landing" style={{ "--st": splash ? "2.05s" : "0s" }}>
      {!gone && (
        <div className="splash" aria-hidden="true">
          <div className="sp-word">
            {"PORTFOLIA".split("").map((ch, i) => (<span key={i} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>{ch}</span>))}
          </div>
          <div className="sp-line" />
        </div>
      )}

      <header className="hero-s">
        <div className="topmark rise" style={{ "--d": "0s" }}>
          <Logo />
          {!user && <Link to="/login" className="toplink">Sign in</Link>}
        </div>

        <div className="stage rise" style={{ "--d": ".1s" }}>
          <div className="cols">
            {COLS.map((ids, ci) => (
              <div key={ci} className="col" style={{ "--d": `${DUR[ci]}s` }}>
                {[...ids, ...ids].map((id, k) => (<Mini key={k} c={CARDS[id]} />))}
              </div>
            ))}
          </div>
        </div>

        <div className="hero-copy">
          <h1 className="hl">
            <span className="w"><span style={{ "--d": ".15s" }}>A portfolio for</span></span>
            <span className="w"><span style={{ "--d": ".3s" }}><Rot /></span></span>
          </h1>
          <p className="sub rise" style={{ "--d": ".45s" }}>Answer a few questions, let AI write the words, and share a live website in minutes.</p>
          <div className="cta-row rise" style={{ "--d": ".6s" }}>
            {user ? (
              <Link to="/app" className="btn lg">Open dashboard <Icon n="arrow" s={18} /></Link>
            ) : (
              <>
                <Link to="/signup" className="btn lg">Get started</Link>
                <Link to="/login" className="btn ghost lg">Sign in</Link>
              </>
            )}
          </div>
          <a href="#more" className="more rise" style={{ "--d": ".8s" }}>How it works <Icon n="down" s={16} /></a>
        </div>
      </header>

      <section id="more" className="sec">
        <Reveal className="sec-head"><span className="eyebrow">Built for everyone</span><h2>One builder, every kind of professional.</h2></Reveal>
        <div className="grid3">
          {Object.entries(KINDS).map(([k, v], i) => (
            <Reveal key={k} d={i * 60}>
              <div className="card feat"><span className="num">0{i + 1}</span><h3>{v.label}s</h3><p className="muted">{v.hint}.</p></div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sec">
        <Reveal className="sec-head"><span className="eyebrow">How it works</span><h2>From blank page to live site in three steps.</h2></Reveal>
        <div className="steps-l">
          {[["Tell us about you", "Pick your profile type, then add your details, work and contacts."], ["Let AI write", "Generate your bio, describe projects and suggest skills in one tap."], ["Share it", "Copy a link, or download a full website file and host it anywhere."]].map(([t, p], i) => (
            <Reveal key={t} d={i * 90}><div className="rowx"><span>{i + 1}</span><div><h3>{t}</h3><p className="muted">{p}</p></div></div></Reveal>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="split">
          <Reveal>
            <span className="eyebrow">AI writing assistant</span>
            <h2>Stuck on what to write? Let AI draft it.</h2>
            <ul className="ticks"><li><Icon n="check" s={18} /> Never invents employers or numbers</li><li><Icon n="check" s={18} /> Edit everything before you publish</li><li><Icon n="check" s={18} /> Professional, friendly or confident tone</li></ul>
          </Reveal>
          <Reveal d={120}>
            <div className="card chat">
              <div className="bubble you">I'm a final-year business student. I led a campus marketing team and want a sales role.</div>
              <div className="bubble ai"><b><Icon n="spark" s={14} /> Portfolia AI</b>I'm a final-year business student with hands-on leadership experience, having led my campus marketing team. I'm eager to bring energy and communication skills to a graduate sales role.</div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <Reveal>
          <div className="band">
            <h2>Ready to be found?</h2>
            <p>Build your portfolio today and give people a reason to remember you.</p>
            <Link to={user ? "/app/create" : "/signup"} className="btn light lg">{user ? "Create a portfolio" : "Get started"} <Icon n="arrow" s={18} /></Link>
          </div>
        </Reveal>
      </section>

      <footer className="lfoot"><Logo /><span className="muted">© {new Date().getFullYear()} Portfolia</span></footer>
    </div>
  );
}
