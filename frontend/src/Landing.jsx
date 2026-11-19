import { Link } from "react-router-dom";
import Logo from "./Logo";
import { isLoggedIn } from "./api";

const features = [
  {
    title: "Start from a template",
    text: "Pick a layout made for your field, then make it yours. No code and no design degree needed.",
    wide: true,
  },
  {
    title: "Everything in one place",
    text: "Add your projects, skills and experience once, and edit them whenever things change.",
  },
  {
    title: "Keep more than one",
    text: "Make a portfolio for each role or audience and manage them all from one dashboard.",
  },
  {
    title: "Publish when it's ready",
    text: "Save drafts while you work, then publish when you are happy with how it looks.",
    wide: true,
  },
];

const reasons = [
  ["A CV lists. A portfolio shows.", "Let people see the quality of your work instead of reading about it."],
  ["One link for every application.", "Send a single page that carries your best work, your story and your contact details."],
  ["You control the story.", "Choose what to feature and how it is presented, and update it as you grow."],
];

const steps = [
  ["Create your account", "Sign up with your email. It takes a minute."],
  ["Choose a template and add your work", "Fill in your details, projects and skills."],
  ["Publish and share", "Go live when you are ready and send the link anywhere."],
];

const faqs = [
  ["Is Portfolia free?", "You can create an account and start building for free."],
  ["Do I need to know how to code?", "No. You fill in your details and choose a template. Portfolia handles the layout."],
  ["Can I make more than one portfolio?", "Yes. Create separate portfolios for different roles or audiences and manage them from your dashboard."],
  ["Who is it for?", "Designers, developers, writers, photographers, students and freelancers: anyone who wants to show their work."],
];

function PreviewTile({ className, delay }) {
  return (
    <div
      className={`build-in aspect-[4/3] rounded-lg ${className}`}
      style={{ "--d": delay }}
    />
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-20px_rgba(11,18,32,0.25)]">
        <div className="flex items-center gap-1.5 border-b border-line bg-mist px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 rounded-md bg-white px-3 py-1 text-xs text-muted">
            Portfolio preview
          </span>
        </div>
        <div className="p-6 sm:p-8">
          <div className="build-in flex items-center gap-4" style={{ "--d": "0.2s" }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cobalt font-display text-xl font-bold text-white">
              AO
            </div>
            <div>
              <p className="font-display text-xl font-bold leading-tight">Amara Okafor</p>
              <p className="text-sm text-body">Product designer, Lagos</p>
            </div>
          </div>
          <p className="build-in mt-5 max-w-sm text-sm leading-6 text-body" style={{ "--d": "0.5s" }}>
            I design simple, useful products for fintech and health teams.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <PreviewTile className="bg-cobalt" delay="0.8s" />
            <PreviewTile className="bg-ink" delay="1s" />
            <PreviewTile className="bg-sky-200" delay="1.2s" />
          </div>
          <div className="build-in mt-5 flex flex-wrap gap-2" style={{ "--d": "1.5s" }}>
            {["Research", "Prototyping", "Design systems"].map((s) => (
              <span key={s} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-body">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div
        className="build-in absolute -bottom-4 -left-2 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold shadow-lg sm:-left-6"
        style={{ "--d": "1.9s" }}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        Published
      </div>
    </div>
  );
}

export default function Landing() {
  const authed = isLoggedIn();
  const primary = authed ? "/dashboard" : "/signup";
  const primaryLabel = authed ? "Open your dashboard" : "Create your portfolio";

  return (
    <div className="bg-white text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-body md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {!authed && (
              <Link to="/login" className="text-sm font-semibold text-ink hover:text-cobalt">
                Sign in
              </Link>
            )}
            <Link
              to={primary}
              className="rounded-lg bg-cobalt px-4 py-2 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
            >
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
            Portfolia helps designers, developers, writers and students build a
            clean, professional portfolio from a template. No code, no design
            degree.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to={primary}
              className="rounded-lg bg-cobalt px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cobalt-dark"
            >
              {primaryLabel}
            </Link>
            {!authed && (
              <Link
                to="/login"
                className="rounded-lg border border-line px-6 py-3.5 text-sm font-semibold transition hover:bg-mist"
              >
                Sign in
              </Link>
            )}
          </div>
          <p className="mt-4 text-sm text-muted">Free to start.</p>
        </div>
        <HeroPreview />
      </section>

      <section id="features" className="bg-mist py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to show your work properly.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border border-line bg-white p-7 ${
                  f.wide ? "md:col-span-2" : ""
                }`}
              >
                <h3 className="font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-3 max-w-md leading-7 text-body">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-white lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1fr_1.3fr]">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Why a portfolio beats a CV.
          </h2>
          <div className="divide-y divide-white/10">
            {reasons.map(([t, d]) => (
              <div key={t} className="py-6 first:pt-0 last:pb-0">
                <h3 className="font-display text-xl font-bold">{t}</h3>
                <p className="mt-2 max-w-lg leading-7 text-slate-300">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From sign-up to live in three steps.
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <li key={t} className="border-t-2 border-cobalt pt-5">
                <span className="font-display text-sm font-bold text-cobalt">
                  Step {i + 1}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold">{t}</h3>
                <p className="mt-2 leading-7 text-body">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="bg-mist py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered.
          </h2>
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
        </div>
      </section>

      <section className="px-5 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl rounded-3xl bg-ink px-6 py-16 text-center text-white sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Your best work deserves a proper home.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-slate-300">
            Create your portfolio today and have something to share by tonight.
          </p>
          <Link
            to={primary}
            className="mt-8 inline-block rounded-lg bg-cobalt px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
          >
            {primaryLabel}
          </Link>
        </div>
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
