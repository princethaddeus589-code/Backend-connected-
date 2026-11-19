import { Link } from "react-router-dom";

export default function UserDashboard() {
  const name = localStorage.getItem("userName") || "User";

  let portfolios = [];

  try {
    const saved = JSON.parse(localStorage.getItem("portfolios") || "[]");
    portfolios = Array.isArray(saved) ? saved : [];
  } catch {
    portfolios = [];
  }

  const published = portfolios.filter(
    (item) =>
      item.isPublished === true ||
      item.published === true ||
      item.status?.toLowerCase() === "published"
  ).length;

  const stats = [
    { label: "Total portfolios", value: portfolios.length },
    { label: "Published", value: published },
    { label: "Drafts", value: portfolios.length - published },
  ];

  const recent = [...portfolios].reverse().slice(0, 3);

  return (
    <div className="min-h-screen bg-mist p-4 text-ink sm:p-7 lg:p-9">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Your workspace</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
        </div>

        <Link
          to="/create-portfolio"
          className="rounded-lg bg-cobalt px-4 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
        >
          + Create portfolio
        </Link>
      </header>

      <section className="relative mb-7 overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cobalt/40 blur-3xl"
        />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold">Hello, {name}.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            Your work deserves to be seen. Create a portfolio that presents your
            skills and experience professionally.
          </p>
          <Link
            to="/templates"
            className="mt-5 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-100"
          >
            Explore templates
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-3 font-display text-4xl font-bold">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Recent portfolios</h2>
            <p className="mt-1 text-sm text-muted">Your latest projects.</p>
          </div>
          <Link
            to="/my-portfolios"
            className="text-sm font-semibold text-cobalt hover:underline"
          >
            View all
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recent.map((portfolio, index) => (
              <Link
                key={portfolio.id || portfolio.title || index}
                to="/create-portfolio"
                state={{ portfolio }}
                className="rounded-xl border border-line bg-white p-5 transition hover:border-cobalt"
              >
                <h3 className="font-semibold">
                  {portfolio.title || portfolio.name || "Untitled portfolio"}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {portfolio.description || "Your portfolio project"}
                </p>
                <p className="mt-4 text-sm font-semibold text-cobalt">
                  Open project
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-semibold">No portfolios yet</h3>
            <p className="mt-2 text-sm text-muted">
              Create your first portfolio to get started.
            </p>
            <Link
              to="/create-portfolio"
              className="mt-4 inline-block rounded-lg bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
            >
              Create your first portfolio
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
