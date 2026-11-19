import { useState } from "react";
import { apiAiWrite } from "./api";

const TOOLS = [
  { id: "bio", title: "Write my bio", text: "A short, polished introduction.", ph: "Example: I'm a final-year business student. I led a campus marketing team and I'm looking for a graduate role in sales." },
  { id: "project", title: "Describe a project", text: "Turn rough notes into a clear description.", ph: "Example: Organised a charity fundraiser with 200 guests. Raised $5,000. Managed 12 volunteers." },
  { id: "skills", title: "Suggest skills", text: "Skills that fit your role.", ph: "Example: I work as an office manager and handle scheduling, budgets and supplier contracts." },
  { id: "polish", title: "Polish my text", text: "Fix the wording and tone.", ph: "Paste any text you want improved." },
];
const TONES = ["Professional", "Friendly", "Confident"];

export default function AiTools() {
  const [tool, setTool] = useState("bio");
  const [tone, setTone] = useState("Professional");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const current = TOOLS.find((t) => t.id === tool);

  async function generate(e) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Tell the AI a little about yourself first.");
      return;
    }
    setBusy(true);
    setError("");
    setResult("");
    try {
      setResult(await apiAiWrite({ tool, tone, input: text }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy. Select the text and copy it manually.");
    }
  }

  return (
    <div>
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">AI tools</h1>
        <p className="mt-2 max-w-xl text-body">
          Not sure what to write? Share a few notes and get a first draft. Always read it and edit it so it sounds like you.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTool(t.id);
              setResult("");
              setError("");
            }}
            className={`rounded-2xl border p-4 text-left transition ${
              tool === t.id ? "border-cobalt bg-cobalt/5 ring-1 ring-cobalt" : "border-line bg-white hover:border-slate-400"
            }`}
          >
            <h2 className="font-display font-bold">{t.title}</h2>
            <p className="mt-1 text-sm text-body">{t.text}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <form onSubmit={generate} className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-7">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Your notes</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              maxLength={2000}
              placeholder={current.ph}
              className="w-full rounded-lg border border-line px-3.5 py-3 text-base outline-none transition focus:border-cobalt focus:ring-4 focus:ring-cobalt/15 sm:text-sm"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">Tone</p>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    tone === t ? "border-cobalt bg-cobalt text-white" : "border-line text-body hover:border-slate-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark disabled:opacity-60"
          >
            {busy ? "Writing…" : "Generate"}
          </button>
        </form>

        <section className="min-h-[200px] rounded-2xl border border-line bg-white p-5 sm:p-7">
          <h2 className="font-display text-lg font-bold">Result</h2>
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          {result ? (
            <>
              <p className="page-in mt-4 whitespace-pre-wrap leading-7">{result}</p>
              <button
                onClick={copy}
                className="mt-5 rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:bg-mist"
              >
                {copied ? "Copied" : "Copy text"}
              </button>
            </>
          ) : (
            !error && (
              <p className="mt-4 text-sm text-muted">
                {busy ? "Writing your draft…" : "Your draft will appear here."}
              </p>
            )
          )}
        </section>
      </div>
    </div>
  );
}
