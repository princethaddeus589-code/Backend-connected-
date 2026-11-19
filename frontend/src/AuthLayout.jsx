import Logo from "./Logo";

export const fieldClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-cobalt focus:ring-4 focus:ring-cobalt/15 sm:text-sm";

const points = [
  "Start from a template made for your field",
  "Add your projects, skills and experience",
  "Publish when you are ready to share",
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cobalt/40 blur-3xl"
        />
        <Logo light />
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Your portfolio is a few minutes away.
          </h2>
          <ul className="mt-8 space-y-4 text-slate-300">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-none text-cobalt"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-slate-400">
          © {new Date().getFullYear()} Portfolia
        </p>
      </aside>

      <main className="flex flex-col px-6 py-8 sm:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-2 text-sm text-body">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-body">{footer}</p>
        </div>
      </main>
    </div>
  );
}
