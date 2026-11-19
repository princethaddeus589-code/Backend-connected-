 import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyPortfolios() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("portfolios") || "[]");

    saved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setPortfolios(saved);
  }, []);

  function deletePortfolio(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this portfolio?"
    );

    if (!confirmed) return;

    const updated = portfolios.filter((portfolio) => portfolio.id !== id);

    localStorage.setItem("portfolios", JSON.stringify(updated));
    setPortfolios(updated);
  }

  function formatDate(date) {
    if (!date) return "Recently created";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-mist px-5 py-8 text-ink sm:px-8 lg:px-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-muted">Your workspace</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            My portfolios
          </h1>
          <p className="mt-2 text-body">
            Manage and organize all your portfolios in one place.
          </p>
        </div>

        <button
          onClick={() => navigate("/templates")}
          className="rounded-lg bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
        >
          + Create portfolio
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-sm text-muted">Total portfolios</p>
          <h2 className="mt-2 font-display text-4xl font-bold">
            {portfolios.length}
          </h2>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-sm text-muted">Recently created</p>
          <h2 className="mt-2 font-display text-4xl font-bold">
            {portfolios.length > 0 ? "1" : "0"}
          </h2>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-sm text-muted">Templates used</p>
          <h2 className="mt-2 font-display text-4xl font-bold">
            {new Set(portfolios.map((p) => p.templateId)).size}
          </h2>
        </div>
      </div>

      {/* Portfolio list */}
      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Your projects</h2>
          <span className="rounded-full bg-white px-3 py-1 text-sm text-body ring-1 ring-line">
            {portfolios.length} projects
          </span>
        </div>

        {portfolios.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cobalt/10 text-3xl">
              📁
            </div>

            <h3 className="mt-6 font-display text-xl font-bold">
              No portfolios yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              You haven't created any portfolios yet. Choose a template, add
              your details, and build your first professional portfolio.
            </p>

            <button
              onClick={() => navigate("/templates")}
              className="mt-6 rounded-lg bg-cobalt px-6 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
            >
              Create your first portfolio
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg"
              >
                <div className="flex h-36 items-center justify-center bg-cobalt/10">
                  <div className="text-center">
                    <p className="font-display text-4xl font-bold text-cobalt">
                      {portfolio.name?.charAt(0)?.toUpperCase() || "P"}
                    </p>
                    <p className="mt-1 text-sm text-muted">Portfolio preview</p>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="truncate text-lg font-bold">
                    {portfolio.name || "Untitled Portfolio"}
                  </h3>

                  <p className="mt-1 truncate text-sm text-muted">
                    {portfolio.title || "No professional title added"}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted">
                    <span>{formatDate(portfolio.createdAt)}</span>

                    <span className="rounded-full bg-mist px-2 py-1">
                      {portfolio.templateId || "Custom"}
                    </span>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() =>
                        navigate("/create-portfolio", {
                          state: { templateId: portfolio.templateId },
                        })
                      }
                      className="flex-1 rounded-lg bg-cobalt px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => deletePortfolio(portfolio.id)}
                      className="rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
