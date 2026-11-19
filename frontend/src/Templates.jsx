import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TemplateView, { Scaled } from "./TemplateView";
import { TEMPLATES } from "./templates";

const categories = ["All", ...new Set(TEMPLATES.map((t) => t.category))];

export default function Templates() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);

  const shown =
    category === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  function use(template) {
    sessionStorage.setItem("selectedTemplate", template.id);
    navigate("/create-portfolio", { state: { templateId: template.id } });
  }

  return (
    <div>
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Choose a template
        </h1>
        <p className="mt-2 max-w-xl text-body">
          What you see here is exactly what you get. Pick a design, add your details and it
          fills in the same way.
        </p>
      </header>

      <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              category === c
                ? "border-cobalt bg-cobalt text-white"
                : "border-line bg-white text-body hover:border-slate-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <article
            key={t.id}
            className="overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-xl"
          >
            <button
              type="button"
              onClick={() => setSelected(t)}
              className="block w-full text-left"
              aria-label={`Preview ${t.name}`}
            >
              <div className="pointer-events-none">
                <Scaled crop={0.85}>
                  <TemplateView id={t.id} data={t.sample} />
                </Scaled>
              </div>
            </button>
            <div className="p-5">
              <p className="text-xs font-medium text-muted">{t.category}</p>
              <h2 className="mt-1 font-display text-lg font-bold">{t.name}</h2>
              <p className="mt-2 text-sm leading-6 text-body">{t.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelected(t)}
                  className="rounded-lg border border-line py-2.5 text-sm font-semibold transition hover:bg-mist"
                >
                  Preview
                </button>
                <button
                  onClick={() => use(t)}
                  className="rounded-lg bg-cobalt py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
                >
                  Use template
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name} preview`}
            className="page-in flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div>
                <h2 className="font-display text-xl font-bold">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted">Sample content. Yours will replace it.</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-mist"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto">
              <Scaled>
                <TemplateView id={selected.id} data={selected.sample} />
              </Scaled>
            </div>
            <div className="border-t border-line p-4">
              <button
                onClick={() => use(selected)}
                className="w-full rounded-lg bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
              >
                Use this template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
