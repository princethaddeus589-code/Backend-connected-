import { useEffect, useRef, useState } from "react";

const THEMES = {
  devfolio: { bg: "#0f1115", fg: "#f8fafc", muted: "#94a3b8", accent: "#a3e635", on: "#0b1220", card: "rgba(255,255,255,0.05)", line: "rgba(255,255,255,0.12)", chip: "pill", cards: false, radius: 14, h1: "font-display font-extrabold tracking-tight", labels: ["Tech stack", "Experience", "Featured project"] },
  minimal: { bg: "#f1f3f7", fg: "#14161a", muted: "#5b6270", accent: "#14161a", on: "#ffffff", card: "transparent", line: "rgba(0,0,0,0.16)", chip: "text", cards: false, radius: 0, serif: true, h1: "font-bold tracking-tight", labels: ["Skills", "Background", "Selected work"] },
  creative: { bg: "#fff1e8", fg: "#2b1d17", muted: "#7a6258", accent: "#ea580c", on: "#ffffff", card: "#ffdcc6", line: "rgba(43,29,23,0.12)", chip: "filled", cards: true, radius: 26, h1: "font-display font-extrabold tracking-tight", labels: ["Tools and skills", "Highlights", "Featured work"] },
  professional: { bg: "#eef3fa", fg: "#162a45", muted: "#4b5d78", accent: "#1d4ed8", on: "#ffffff", card: "#ffffff", line: "rgba(22,42,69,0.12)", chip: "square", cards: true, radius: 14, h1: "font-display font-bold tracking-tight", labels: ["Core skills", "Experience and achievements", "Key project"] },
  photographer: { bg: "#0c0c0d", fg: "#f5f5f4", muted: "#a8a29e", accent: "#f5f5f4", on: "#0c0c0d", card: "rgba(255,255,255,0.04)", line: "rgba(255,255,255,0.16)", chip: "text", cards: false, radius: 2, center: true, serif: true, h1: "font-light uppercase tracking-[0.12em]", labels: ["Specialties", "Exhibitions and highlights", "Featured series"] },
  freelancer: { bg: "#ecf7ef", fg: "#12372a", muted: "#3f6b57", accent: "#15803d", on: "#ffffff", card: "#ffffff", line: "rgba(18,55,42,0.14)", chip: "filled", cards: true, radius: 20, badge: "Available for new projects", h1: "font-display font-extrabold tracking-tight", labels: ["Services", "Experience", "Recent project"] },
  student: { bg: "#f5f3ff", fg: "#261a4d", muted: "#5f568a", accent: "#7c3aed", on: "#ffffff", card: "#ffffff", line: "rgba(38,26,77,0.12)", chip: "pill", cards: true, radius: 20, h1: "font-display font-bold tracking-tight", labels: ["Skills", "Education and activities", "Featured project"] },
};

/* Draws children at a fixed 760px width and scales them to fit the box.
   crop = fixed height ratio (for thumbnails); no crop = full height. */
export function Scaled({ children, width = 760, crop }) {
  const box = useRef(null);
  const inner = useRef(null);
  const [m, setM] = useState({ scale: 0.5, h: 0 });

  useEffect(() => {
    const el = box.current;
    const inn = inner.current;
    if (!el || !inn) return;
    const update = () => {
      const scale = el.clientWidth / width;
      setM({ scale, h: crop ? el.clientWidth * crop : inn.offsetHeight * scale });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(inn);
    return () => ro.disconnect();
  }, [width, crop]);

  return (
    <div ref={box} className="w-full overflow-hidden" style={{ height: m.h || undefined }}>
      <div ref={inner} style={{ width, transform: `scale(${m.scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

export default function TemplateView({ id, data }) {
  const t = THEMES[id] || THEMES.devfolio;
  const d = data || {};
  const name = d.name?.trim() || "Your Name";
  const skills = (d.skills || "").split(",").map((s) => s.trim()).filter(Boolean);
  const items = (d.highlights || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const link = /^https?:\/\//i.test(d.projectLink || "") ? d.projectLink : "";
  const serif = t.serif ? { fontFamily: "Georgia, 'Times New Roman', serif" } : undefined;
  const box = { background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius };

  const block = (label, body) => (
    <section className="mt-12">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.accent }}>
        {label}
      </p>
      <div className="mt-4">{body}</div>
    </section>
  );

  const chips =
    t.chip === "text" ? (
      <p className={`text-[18px] ${t.center ? "text-center" : ""}`} style={{ color: t.muted }}>
        {skills.join("  /  ")}
      </p>
    ) : (
      <div className="flex flex-wrap gap-2.5">
        {skills.map((s) => (
          <span
            key={s}
            className="px-4 py-1.5 text-[16px] font-medium"
            style={{
              borderRadius: t.chip === "square" ? 8 : 999,
              background: t.chip === "pill" ? "transparent" : t.card,
              border: `1px solid ${t.line}`,
            }}
          >
            {s}
          </span>
        ))}
      </div>
    );

  const list = t.cards ? (
    <div className="grid grid-cols-2 gap-3">
      {items.map((x, i) => (
        <div key={i} className="p-5 text-[17px] leading-snug" style={box}>
          {x}
        </div>
      ))}
    </div>
  ) : (
    <ul>
      {items.map((x, i) => (
        <li
          key={i}
          className={`py-3.5 text-[18px] ${t.center ? "text-center" : ""}`}
          style={{ borderTop: `1px solid ${t.line}` }}
        >
          {x}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="px-14 py-12" style={{ background: t.bg, color: t.fg }}>
      <div className="flex items-center justify-between pb-6" style={{ borderBottom: `1px solid ${t.line}` }}>
        <span className="text-[18px] font-bold tracking-tight" style={serif}>
          {name.split(" ")[0]}
        </span>
        <span className="text-[14px]" style={{ color: t.muted }}>
          {d.location || "Portfolio"}
        </span>
      </div>

      <header className={`pt-16 ${t.center ? "text-center" : ""}`}>
        {t.badge && (
          <span
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[14px] font-semibold"
            style={{ background: t.card, border: `1px solid ${t.line}` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: t.accent }} />
            {t.badge}
          </span>
        )}
        <p className="text-[14px] font-semibold uppercase tracking-[0.2em]" style={{ color: t.accent }}>
          {d.title?.trim() || "Your title"}
        </p>
        <h1 className={`mt-4 text-[68px] leading-[1.04] ${t.h1}`} style={serif}>
          {name}
        </h1>
        <p
          className={`mt-6 max-w-[560px] whitespace-pre-wrap text-[20px] leading-8 ${t.center ? "mx-auto" : ""}`}
          style={{ color: t.muted }}
        >
          {d.bio?.trim() || "Write a short introduction about yourself."}
        </p>
        {d.email && (
          <a
            href={`mailto:${d.email}`}
            className="mt-8 inline-block px-7 py-3.5 text-[16px] font-semibold"
            style={{ background: t.accent, color: t.on, borderRadius: Math.min(t.radius, 14) }}
          >
            Get in touch
          </a>
        )}
      </header>

      {skills.length > 0 && block(t.labels[0], chips)}
      {items.length > 0 && block(t.labels[1], list)}
      {(d.projectTitle || d.projectDescription) &&
        block(
          t.labels[2],
          <div className="p-7" style={box}>
            <h3 className="break-words text-[28px] font-bold leading-tight" style={serif}>
              {d.projectTitle || "Project"}
            </h3>
            {d.projectDescription && (
              <p className="mt-3 whitespace-pre-wrap text-[18px] leading-8" style={{ color: t.muted }}>
                {d.projectDescription}
              </p>
            )}
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-[16px] font-semibold underline underline-offset-4"
                style={{ color: t.accent }}
              >
                View project
              </a>
            )}
          </div>
        )}

      <footer
        className={`mt-14 pt-6 text-[15px] ${t.center ? "text-center" : ""}`}
        style={{ borderTop: `1px solid ${t.line}`, color: t.muted }}
      >
        {[d.email, d.location].filter(Boolean).join("  ·  ") || `© ${new Date().getFullYear()} ${name}`}
      </footer>
    </div>
  );
}
