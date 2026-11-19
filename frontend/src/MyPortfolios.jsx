import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TemplateView, { Scaled } from "./TemplateView";
import { templateName } from "./templates";

function load() {
  try {
    const list = JSON.parse(localStorage.getItem("portfolios") || "[]");
    return Array.isArray(list)
      ? list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];
  } catch {
    return [];
  }
}

function formatDate(date) {
  if (!date) return "Recently";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MyPortfolios() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState(load);

  function remove(id) {
    if (!window.confirm("Delete this portfolio? This cannot be undone.")) return;
    const next = portfolios.filter((p) => p.id !== id);
    localStorage.setItem("portfolios", JSON.stringify(next));
    window.dispatchEvent(new Event("portfolios-change"));
    setPortfolios(next);
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">My portfolios</h1>
          <p className="mt-2 text-body">{portfolios.length} saved on this device</p>
        </div>
        <Link
          to="/templates"
          className="rounded-lg bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
        >
          New portfolio
        </Link>
      </header>

      {portfolios.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h2 className="font-display text-xl font-bold">No portfolios yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Choose a template, add your details, and your first portfolio will appear here.
          </p>
          <Link
            to="/templates"
            className="mt-6 inline-block rounded-lg bg-cobalt px-6 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
          >
            Choose a template
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg">
              <div className="pointer-events-none">
                <Scaled crop={0.8}>
                  <TemplateView id={p.templateId} data={p} />
                </Scaled>
              </div>
              <div className="p-5">
                <h3 className="truncate text-lg font-bold">{p.name || "Untitled"}</h3>
                <p className="mt-1 truncate text-sm text-muted">
                  {templateName(p.templateId)} · {formatDate(p.createdAt)}
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => navigate("/create-portfolio", { state: { portfolio: p } })}
                    className="flex-1 rounded-lg bg-cobalt py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
