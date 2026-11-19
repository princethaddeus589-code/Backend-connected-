import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KINDS, SAMPLES, TEMPLATES, getUser } from "./lib";
import { Icon, Logo, Reveal, Thumb } from "./ui";

const WORDS = ["students", "teachers", "founders", "developers", "freelancers", "creatives"];
const KIND_ICON = { student: "user", teacher: "edit", business: "globe", developer: "bolt", freelancer: "folder", creative: "spark" };

function Rot() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return <span key={i} className="rot">{WORDS[i]}</span>;
}

export default function Landing() {
  const user = getUser();
  return (
    <div className="landing">
      <header className="lnav">
        <Logo />
        <nav className="lnav-links">
          <a href="#who">Who it's for</a>
          <a href="#how">How it works</a>
          <a href="#ai">AI writer</a>
          <a href="#templates">Templates</a>
        </nav>
        <div className="lnav-cta">
          {user ? (
            <Link to="/app" className="btn sm">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn ghost sm">Sign in</Link>
              <Link to="/signup" className="btn sm">Get started</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero2">
        <div className="orb o1" /><div className="orb o2" />
        <div className="hero2-text">
          <span className="pill">New · AI-powered portfolio builder</span>
          <h1>A professional website for <Rot /></h1>
          <p>Answer a few questions, let AI write the words, pick a template, and share your portfolio with the world. No code. No design skills.</p>
          <div className="row">
            <Link to={user ? "/app/create" : "/signup"} className="btn lg">Create my portfolio <Icon n="arrow" s={18} /></Link>
            <a href="#templates" className="btn ghost lg">See templates</a>
          </div>
          <div className="trust"><span>✓ Free to start</span><span>✓ Ready in minutes</span><span>✓ Share or download</span></div>
        </div>
        <div className="mock">
          <div className="browser">
            <div className="bar"><i /><i /><i /><span>yourname.portfolia.site</span></div>
            <Thumb data={SAMPLES[1]} h={330} w={1000} />
          </div>
          <div className="fl f1"><Icon n="spark" s={16} /> AI wrote your bio</div>
          <div className="fl f2"><Icon n="check" s={16} /> Portfolio published</div>
        </div>
      </section>

      <section id="who" className="sec">
        <Reveal className="sec-head"><span className="eyebrow">Built for everyone</span><h2>One builder. Every kind of professional.</h2><p className="muted">Pick who you are and Portfolia shapes your sections, wording and AI suggestions to fit.</p></Reveal>
        <div className="grid3">
          {Object.entries(KINDS).map(([k, v], i) => (
            <Reveal key={k} d={i * 70}>
              <div className="card feat"><span className="fic"><Icon n={KIND_ICON[k]} /></span><h3>{v.label}s</h3><p className="muted">{v.hint}.</p></div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="sec alt">
        <Reveal className="sec-head"><span className="eyebrow">How it works</span><h2>From blank page to live site in 3 steps</h2></Reveal>
        <div className="grid3">
          {[["1", "Tell us about you", "Choose your profile type and fill in your details, work and contacts."], ["2", "Let AI write", "Generate your bio, describe your projects and suggest skills in one tap."], ["3", "Share it", "Copy a link, or download a complete website file and host it anywhere."]].map(([n, t, p], i) => (
            <Reveal key={n} d={i * 100}><div className="card step"><span className="num">{n}</span><h3>{t}</h3><p className="muted">{p}</p></div></Reveal>
          ))}
        </div>
      </section>

      <section id="ai" className="sec">
        <div className="split">
          <Reveal>
            <span className="eyebrow">AI writing assistant</span>
            <h2>Stuck on what to write? Let AI draft it.</h2>
            <p className="muted lead">Share a few rough notes and get a polished bio, clear project descriptions and the right skills, in the tone you choose: professional, friendly or confident.</p>
            <ul className="ticks"><li><Icon n="check" s={18} /> Never invents employers or numbers</li><li><Icon n="check" s={18} /> Edit everything before you publish</li><li><Icon n="check" s={18} /> Built right into the portfolio builder</li></ul>
          </Reveal>
          <Reveal d={120}>
            <div className="card chat">
              <div className="bubble you">I'm a final-year business student. I led a campus marketing team and want a sales role.</div>
              <div className="bubble ai"><b><Icon n="spark" s={14} /> Portfolia AI</b>I'm a final-year business student with hands-on leadership experience, having led my campus marketing team. I'm eager to bring my energy and communication skills to a graduate sales role.</div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="templates" className="sec alt">
        <Reveal className="sec-head"><span className="eyebrow">Templates</span><h2>Designs that look professional from day one</h2><p className="muted">Switch templates any time. Your content stays the same.</p></Reveal>
        <div className="grid4">
          {TEMPLATES.map((t, i) => (
            <Reveal key={t.id} d={i * 80}>
              <Link to={user ? `/app/create?template=${t.id}` : "/signup"} className="card tpl">
                <Thumb data={SAMPLES[i]} h={230} />
                <div className="tpl-info"><b>{t.name}</b><span className="muted">{t.note}</span></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sec">
        <Reveal>
          <div className="band">
            <h2>Ready to be found?</h2>
            <p>Build your portfolio today and give people a reason to remember you.</p>
            <Link to={user ? "/app/create" : "/signup"} className="btn light lg">Start for free <Icon n="arrow" s={18} /></Link>
          </div>
        </Reveal>
      </section>

      <footer className="lfoot">
        <Logo />
        <span className="muted">© {new Date().getFullYear()} Portfolia. Build your story.</span>
      </footer>
    </div>
  );
}
