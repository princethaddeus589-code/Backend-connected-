import { Link } from "react-router-dom";
import TemplateView, { Scaled } from "./TemplateView";
import { templateName } from "./templates";

function load() {
  try {
    const list = JSON.parse(localStorage.getItem("portfolios") || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const actions = [
  { to: "/templates", title: "Browse templates", text: "Seven designs for every field." },
  { to: "/ai-tools", title: "AI writing tools", text: "Draft your bio and project text." },
  { to: "/my-portfolios", title: "My portfolios", text: "Edit what you have already made." },
];

export default function UserDashboard() {
  const name = (localStorage.getItem("userName") || "there").split(" ")[0];
  const portfolios = load();
  const recent = [...portfolios].reverse().slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-ink p-7 text-white sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cobalt/40 blur-3xl"
        />
        <div className="relative">
          <p className="text-sm text-slate-300">{greeting()}, {name}</p>
          <h1 className="mt-2 max-w-lg font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            What would you like to build today?
          </h1>
          <Link
            to="/templates"
            className="mt-6 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100"
          >
            Create a portfolio
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="rounded-2xl border border-line bg-white p-5 transition hover:border-cobalt hover:shadow-md"
          >
            <h2 className="font-display text-lg font-bold">{a.title}</h2>
            <p className="mt-1 text-sm text-body">{a.text}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Recent portfolios</h2>
            <p className="mt-1 text-sm text-muted">
              {portfolios.length} saved on this device
            </p>
          </div>
          {portfolios.length > 0 && (
            <Link to="/my-portfolios" className="text-sm font-semibold text-cobalt hover:underline">
              View all
            </Link>
          )}
        </div>

        {recent.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <Link
                key={p.id}
                to="/create-portfolio"
                state={{ portfolio: p }}
                className="overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg"
              >
                <div className="pointer-events-none">
                  <Scaled crop={0.62}>
                    <TemplateView id={p.templateId} data={p} />
                  </Scaled>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-semibold">{p.name || "Untitled"}</h3>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {templateName(p.templateId)}
                    {p.title ? ` · ${p.title}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-display text-lg font-bold">Start your first portfolio</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-body">
              Pick a template, add your details, and see it come together as you type.
            </p>
            <Link
              to="/templates"
              className="mt-5 inline-block rounded-lg bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
            >
              Choose a template
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
