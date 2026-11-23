import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buildHtml } from "./lib";

const P = {
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  folder: "M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  plus: "M12 5v14M5 12h14",
  spark: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M9 14v6",
  out: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  eye: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
  link: "M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1",
  down: "M12 3v12M7 10l5 5 5-5M5 21h14",
  edit: "M4 20h4L19 9l-4-4L4 16z",
  check: "M5 12l5 5 9-10",
  arrow: "M5 12h14M13 6l6 6-6 6",
  copy: "M9 9h11v11H9zM5 15V5h10",
  user: "M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z",
  layout: "M3 4h18v16H3zM3 10h18M9 10v10",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18",
  x: "M6 6l12 12M18 6L6 18",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
};

export function Icon({ n, s = 20 }) {
  return (
    <svg className="icon" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[n]} />
    </svg>
  );
}

export function Logo({ to = "/" }) {
  return (
    <Link to={to} className="logo wm">
      <img src="/favicon.svg" alt="" />
      PORTFOLIA<i />
    </Link>
  );
}

export function Reveal({ children, d = 0, className = "" }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${on ? "in" : ""} ${className}`} style={{ transitionDelay: `${d}ms` }}>
      {children}
    </div>
  );
}

// Scaled live preview of a generated portfolio website
export function Thumb({ data, h = 220, w = 1100, live = false }) {
  const box = useRef(null);
  const [m, setM] = useState({ s: 0.3, h: 700 });
  const html = useMemo(() => buildHtml(data), [data]);
  useEffect(() => {
    const el = box.current;
    const f = () => setM({ s: Math.max(el.clientWidth / w, 0.1), h: el.clientHeight });
    f();
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={box} className={`thumb ${live ? "live" : ""}`} style={{ height: h }}>
      <iframe
        title="Portfolio preview"
        srcDoc={html}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        tabIndex={-1}
        style={{ width: w, height: m.h / m.s, transform: `scale(${m.s})` }}
      />
    </div>
  );
}
