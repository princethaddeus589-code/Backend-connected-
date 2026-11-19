import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TemplateView, { Scaled } from "./TemplateView";
import { TEMPLATES, emptyPortfolio } from "./templates";
import { apiAiWrite } from "./api";

const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-cobalt focus:ring-4 focus:ring-cobalt/15 sm:text-sm";

function Field({ label, hint, action, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        {action}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function CreatePortfolio() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const existing = state?.portfolio || null;

  const [templateId, setTemplateId] = useState(
    existing?.templateId || state?.templateId || sessionStorage.getItem("selectedTemplate") || "professional"
  );
  const [form, setForm] = useState(() =>
    existing
      ? { ...emptyPortfolio, ...existing }
      : {
          ...emptyPortfolio,
          name: localStorage.getItem("userName") || "",
          email: localStorage.getItem("userEmail") || "",
        }
  );
  const [tab, setTab] = useState("edit");
  const [message, setMessage] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  function set(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setMessage("");
  }

  async function writeBio() {
    if (!form.title && !form.skills && !form.highlights) {
      setMessage("Add your role, skills or background first so the AI has something to work with.");
      return;
    }
    setAiBusy(true);
    setMessage("");
    try {
      const text = await apiAiWrite({
        tool: "bio",
        tone: "Professional",
        input: `Name: ${form.name}\nRole: ${form.title}\nSkills: ${form.skills}\nBackground:\n${form.highlights}\nCurrent bio: ${form.bio}`,
      });
      setForm((f) => ({ ...f, bio: text }));
    } catch (err) {
      setMessage(err.message);
    } finally {
      setAiBusy(false);
    }
  }

  function save(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage("Please enter your name.");
      return;
    }
    try {
      const list = JSON.parse(localStorage.getItem("portfolios") || "[]");
      const record = existing
        ? { ...existing, ...form, templateId, updatedAt: new Date().toISOString() }
        : { ...form, id: crypto.randomUUID(), templateId, createdAt: new Date().toISOString() };
      const next = existing ? list.map((p) => (p.id === existing.id ? record : p)) : [...list, record];
      localStorage.setItem("portfolios", JSON.stringify(next));
      window.dispatchEvent(new Event("portfolios-change"));
      navigate("/my-portfolios");
    } catch {
      setMessage("Could not save your portfolio. Please try again.");
    }
  }

  return (
    <div>
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {existing ? "Edit your portfolio" : "Create your portfolio"}
        </h1>
        <p className="mt-2 text-body">Fill in your details and watch the template update as you type.</p>
      </header>

      <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplateId(t.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              templateId === t.id
                ? "border-cobalt bg-cobalt text-white"
                : "border-line bg-white text-body hover:border-slate-400"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 rounded-xl bg-white p-1 ring-1 ring-line lg:hidden">
        {["edit", "preview"].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
              tab === k ? "bg-ink text-white" : "text-body"
            }`}
          >
            {k === "edit" ? "Details" : "Preview"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <form
          onSubmit={save}
          className={`space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-7 ${
            tab === "edit" ? "" : "hidden lg:block"
          }`}
        >
          <h2 className="font-display text-xl font-bold">About you</h2>
          <Field label="Full name">
            <input name="name" value={form.name} onChange={set} className={input} placeholder="Your name" required />
          </Field>
          <Field label="Role or title" hint="For example: Marketing manager, Biology student, Photographer.">
            <input name="title" value={form.title} onChange={set} className={input} placeholder="What do you do?" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Location">
              <input name="location" value={form.location} onChange={set} className={input} placeholder="City, Country" />
            </Field>
            <Field label="Contact email">
              <input name="email" type="email" value={form.email} onChange={set} className={input} placeholder="you@example.com" />
            </Field>
          </div>
          <Field
            label="Short bio"
            action={
              <button
                type="button"
                onClick={writeBio}
                disabled={aiBusy}
                className="rounded-md bg-cobalt/10 px-2.5 py-1 text-xs font-semibold text-cobalt transition hover:bg-cobalt/20 disabled:opacity-60"
              >
                {aiBusy ? "Writing…" : "Write with AI"}
              </button>
            }
          >
            <textarea name="bio" value={form.bio} onChange={set} rows={4} className={input} placeholder="Two or three sentences about who you are and what you do." />
          </Field>

          <h2 className="border-t border-line pt-5 font-display text-xl font-bold">Skills and background</h2>
          <Field label="Skills" hint="Separate with commas.">
            <input name="skills" value={form.skills} onChange={set} className={input} placeholder="Communication, Excel, Design, Research" />
          </Field>
          <Field label="Experience, education or achievements" hint="One item per line.">
            <textarea name="highlights" value={form.highlights} onChange={set} rows={4} className={input} placeholder={"Marketing assistant, Acme Co.\nBSc Economics\nWon the regional pitch competition"} />
          </Field>

          <h2 className="border-t border-line pt-5 font-display text-xl font-bold">Featured work</h2>
          <Field label="Project or achievement title">
            <input name="projectTitle" value={form.projectTitle} onChange={set} className={input} placeholder="What are you proud of?" />
          </Field>
          <Field label="Description">
            <textarea name="projectDescription" value={form.projectDescription} onChange={set} rows={3} className={input} placeholder="What was it, and what was the result?" />
          </Field>
          <Field label="Link (optional)">
            <input name="projectLink" type="url" value={form.projectLink} onChange={set} className={input} placeholder="https://example.com" />
          </Field>

          {message && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark"
          >
            {existing ? "Save changes" : "Save portfolio"}
          </button>
          <p className="text-xs text-muted">Portfolios are saved in this browser on this device.</p>
        </form>

        <aside className={`lg:sticky lg:top-24 ${tab === "preview" ? "" : "hidden lg:block"}`}>
          <p className="mb-3 text-sm font-medium text-muted">Live preview</p>
          <div className="overflow-hidden rounded-2xl border border-line shadow-sm">
            <Scaled>
              <TemplateView id={templateId} data={form} />
            </Scaled>
          </div>
        </aside>
      </div>
    </div>
  );
}
