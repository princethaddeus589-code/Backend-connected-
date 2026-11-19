import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { isLoggedIn } from "./api";
import { Reveal, CountUp } from "./motion";
import TemplateView, { Scaled } from "./TemplateView";
import { TEMPLATES } from "./templates";

const audiences = ["Students", "Freelancers", "Consultants", "Designers", "Developers", "Founders", "Photographers", "Job seekers", "Teachers", "Creatives"];
const showcase = ["student", "professional", "creative", "devfolio"].map((id) => TEMPLATES.find((t) => t.id === id));

const features = [
  { t: "Seven ready-made templates", d: "Designs for business, students, creatives, freelancers, photographers and tech. Pick one and make it yours.", wide: true },
  { t: "AI writing help", d: "Not sure what to write? Turn a few notes into a first draft of your bio or project descriptions, then edit it your way." },
  { t: "What you see is what you get", d: "The preview is the real design, so your portfolio looks exactly as it did when you chose the template." },
  { t: "Keep more than one", d: "Make a portfolio for each job, course or client and manage them all from one place.", wide: true },
];

const reasons = [
  ["Show your work, not just a list.", "A portfolio lets people see what you can do. That matters whether you are applying for a first job or a promotion."],
  ["One place for your best work.", "Keep your story, skills and achievements together instead of scattered across files and profiles."],
  ["Look professional at every stage.", "Students, professionals and freelancers all get a clean, confident design without hiring anyone."],
];

const stats = [[7, "ready-made templates"], [4, "AI writing tools"], [3, "steps to a finished portfolio"], [0, "lines of code needed"]];

const steps = [
  ["Create your account", "Sign up with your email. It takes a minute."],
  ["Pick a template and add your details", "Type your information and watch the design fill in live."],
  ["Preview and refine", "Use the AI tools to polish your wording, then save and edit any time."],
];

const faqs = [
  ["Is Portfolia free?", "You can create an account and start building for free."],
  ["Who is it for?", "Anyone who wants to present themselves well: students, professionals, freelancers, founders, creatives and more."],
  ["Do I need design or coding skills?", "No. You choose a template and fill in your details. Portfolia handles the layout."],
  ["How does the AI help?", "It drafts your bio, project descriptions and skills from your notes. You always review and edit the result."],
  ["Where is my portfolio saved?", "For now, portfolios are saved in your browser on the device you use."],
];

function Splash({ leaving }) {
  return (
    <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink text-white transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cobalt font-display text-2xl font-bold">p</span>
        <span className="font-display text-3xl font-bold tracking-tight">Portfolia</span>
      </div>
      <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/15">
        <div className="splash-bar h-full rounded-full bg-cobalt" />
      </div>
      <p className="mt-4 text-sm text-slate-400">Preparing your workspace…</p>
    </div>
  );
}

function HeroShowcase() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % showcase.length), 4000);
    return () => clearInterval(id);
  }, []);
  const t = showcase[i];
  return (
    <div className="page-in relative">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-20px_rgba(11,18,32,0.3)]">
        <div className="flex items-center gap-1.5 border-b border-line bg-mist px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 rounded-md bg-white px-3 py-1 text-xs text-muted">{t.name} template</span>
        </div>
        <div key={t.id} className="page-in pointer-events-none">
          <Scaled crop={0.95}>
            <TemplateView id={t.id} data={t.sample} />
          </Scaled>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-2 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold shadow-lg sm:-left-6">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        Live preview
      </div>
    </div>
  );
}

export default function Landing() {
  const authed = isLoggedIn();
  const primary = authed ? "/dashboard" : "/signup";
  const primaryLabel = authed ? "Open your dashboard" : "Create your portfolio";

  const skip = typeof window !== "undefined" &&
    (sessionStorage.getItem("splash") || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [splash, setSplash] = useState(!skip);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!splash) return;
    const a = setTimeout(() => setLeaving(true), 1300);
    const b = setTimeout(() => {
      setSplash(false);
      sessionStorage.setItem("splash", "1");
    }, 1800);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [splash]);

  return (
    <div className="bg-white text-ink">
      {splash && <Splash leaving={leaving} />}

      <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-body md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {!authed && <Link to="/login" className="text-sm font-semibold hover:text-cobalt">Sign in</Link>}
            <Link to={primary} className="rounded-lg bg-cobalt px-4 py-2 text-sm font-semibold text-white transition hover:bg-cobalt-dark">
              {authed ? "Dashboard" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
        <div>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Turn your work into a portfolio people remember.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-body">
            Whether you are a student, a professional, a freelancer or a founder, Portfolia
            helps you build a polished portfolio in minutes. No code, no design skills.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to={primary} className="rounded-lg bg-cobalt px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cobalt-dark">
              {primaryLabel}
            </Link>
            {!authed && (
              <Link to="/login" className="rounded-lg border border-line px-6 py-3.5 text-sm font-semibold transition hover:bg-mist">
                Sign in
              </Link>
            )}
          </div>
          <p className="mt-4 text-sm text-muted">Free to start.</p>
        </div>
        <div className="min-h-[300px]">{!splash && <HeroShowcase />}</div>
      </section>

      <div className="overflow-hidden border-y border-line bg-mist py-4" aria-hidden>
        <div className="marquee">
          {[...audiences, ...audiences].map((a, i) => (
            <span key={i} className="mx-6 flex items-center gap-12 whitespace-nowrap font-display text-lg font-semibold text-muted">
              {a}
              <span className="h-1.5 w-1.5 rounded-full bg-cobalt" />
            </span>
          ))}
        </div>
      </div>

      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to show your work properly.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.t} delay={i * 90} className={f.wide ? "md:col-span-2" : ""}>
                <div className="h-full rounded-2xl border border-line bg-mist p-7">
                  <h3 className="font-display text-xl font-bold">{f.t}</h3>
                  <p className="mt-3 max-w-md leading-7 text-body">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 md:grid-cols-4">
          {stats.map(([n, label]) => (
            <Reveal key={label}>
              <p className="font-display text-5xl font-bold text-white"><CountUp to={n} /></p>
              <p className="mt-2 text-sm text-slate-300">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Why a portfolio beats a CV.
            </h2>
          </Reveal>
          <div className="divide-y divide-line">
            {reasons.map(([t, d], i) => (
              <Reveal key={t} delay={i * 90}>
                <div className="py-6 first:pt-0 last:pb-0">
                  <h3 className="font-display text-xl font-bold">{t}</h3>
                  <p className="mt-2 max-w-lg leading-7 text-body">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-mist py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              From sign-up to finished in three steps.
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <Reveal key={t} delay={i * 120}>
                <li className="border-t-2 border-cobalt pt-5">
                  <span className="font-display text-sm font-bold text-cobalt">Step {i + 1}</span>
                  <h3 className="mt-2 font-display text-xl font-bold">{t}</h3>
                  <p className="mt-2 leading-7 text-body">{d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered.</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-10 divide-y divide-line border-y border-line">
              {faqs.map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {q}
                    <span className="text-xl text-muted transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 leading-7 text-body">{a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 pb-20 lg:pb-28">
        <Reveal>
          <div className="mx-auto max-w-6xl rounded-3xl bg-ink px-6 py-16 text-center text-white sm:px-12">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Your best work deserves a proper home.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-slate-300">
              Create your portfolio today and see it come together as you type.
            </p>
            <Link to={primary} className="mt-8 inline-block rounded-lg bg-cobalt px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-cobalt-dark">
              {primaryLabel}
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-body">
          <Logo />
          <p>© {new Date().getFullYear()} Portfolia. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/login" className="hover:text-ink">Sign in</Link>
            <Link to="/signup" className="hover:text-ink">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
