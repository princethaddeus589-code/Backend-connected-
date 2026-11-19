// ---------- API + session ----------
const BASE = (import.meta.env?.VITE_API_URL || "https://backend-connected-hyw6.vercel.app").replace(/\/+$/, "");

async function post(path, body, token) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Check your internet and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.message || "Something went wrong. Please try again.");
    e.status = res.status;
    throw e;
  }
  return data;
}

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("pf_user")); } catch { return null; }
};
export const saveSession = (u) =>
  localStorage.setItem("pf_user", JSON.stringify({ uid: u.uid, name: u.name, email: u.email, token: u.token }));
export const clearSession = () => localStorage.removeItem("pf_user");
export const updateName = (name) => {
  const u = getUser();
  if (u) localStorage.setItem("pf_user", JSON.stringify({ ...u, name }));
};
export const apiSignup = (b) => post("/api/signup", b);
export const apiSignin = (b) => post("/api/signin", b);
export const aiWrite = (b) => post("/api/ai/write", b, getUser()?.token || "");

// ---------- theme / motion ----------
export function applyTheme() {
  const m = localStorage.getItem("pf_theme") || "system";
  const dark = m === "dark" || (m === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.classList.toggle("no-motion", localStorage.getItem("pf_motion") === "off");
}

// ---------- portfolio storage (per account, on this device) ----------
const key = () => "pf_data_" + (getUser()?.uid || "guest");
export const loadAll = () => {
  try { return JSON.parse(localStorage.getItem(key())) || []; } catch { return []; }
};
export const saveAll = (list) => localStorage.setItem(key(), JSON.stringify(list));
export const uid = () => Math.random().toString(36).slice(2, 10);

export const KINDS = {
  student: { label: "Student", hint: "Projects, grades and goals", work: "Projects & achievements" },
  teacher: { label: "Teacher", hint: "Courses, classes and research", work: "Courses & achievements" },
  business: { label: "Business", hint: "Ventures, brands and results", work: "Ventures & results" },
  developer: { label: "Developer", hint: "Apps, code and open source", work: "Projects" },
  freelancer: { label: "Freelancer", hint: "Services and client work", work: "Selected work" },
  creative: { label: "Creative", hint: "Design, art and media", work: "Selected work" },
};

export const TEMPLATES = [
  { id: "aurora", name: "Aurora", note: "Soft gradients, centered", accent: "#4f46e5" },
  { id: "midnight", name: "Midnight", note: "Dark and sharp", accent: "#22d3ee" },
  { id: "scholar", name: "Scholar", note: "Warm and academic", accent: "#b45309" },
  { id: "executive", name: "Executive", note: "Navy and gold", accent: "#c9a227" },
];

export const blank = (t) => {
  const u = getUser() || {};
  return {
    id: uid(), template: t?.id || "aurora", accent: t?.accent || "#4f46e5", kind: "student",
    name: u.name || "", title: "", location: "", photo: "", bio: "", skills: [],
    projects: [{ title: "", text: "", link: "" }], experience: [], education: [],
    contact: { email: u.email || "", website: "", linkedin: "", github: "", twitter: "" },
  };
};

const sample = (i, kind, name, title, bio, skills, projects, experience) => ({
  id: "s" + i, template: TEMPLATES[i].id, accent: TEMPLATES[i].accent, kind, name, title,
  location: "Lagos, Nigeria", photo: "", bio, skills, projects, experience,
  education: [{ school: "University of Lagos", degree: "B.Sc.", period: "2018 - 2022" }],
  contact: { email: "hello@example.com", website: "example.com", linkedin: "linkedin.com/in/example", github: "", twitter: "" },
});
export const SAMPLES = [
  sample(0, "student", "Amara Okafor", "Computer Science Student",
    "I build helpful apps and lead campus tech clubs. Currently looking for an internship where I can learn fast and ship real products.",
    ["Python", "React", "Public speaking", "Design"],
    [{ title: "Campus Events App", text: "A mobile-friendly app that helped 1,200 students find events.", link: "" },
     { title: "Tech Club Lead", text: "Organised 10 workshops and grew membership by 3x.", link: "" }],
    [{ role: "Intern", org: "Bright Labs", period: "2024", text: "Built dashboards for the product team." }]),
  sample(1, "developer", "Daniel Mensah", "Full-stack Developer",
    "I design and build fast, reliable web products. I enjoy clean APIs, good tooling and mentoring other developers.",
    ["TypeScript", "Node.js", "React", "PostgreSQL", "AWS"],
    [{ title: "Payments API", text: "Processing 50k transactions a day with 99.9% uptime.", link: "" },
     { title: "Open-source CLI", text: "A developer tool with 2k GitHub stars.", link: "" }],
    [{ role: "Senior Engineer", org: "Paylink", period: "2021 - Now", text: "Lead a team of 6 engineers." }]),
  sample(2, "teacher", "Grace Adeyemi", "Mathematics Teacher",
    "I help students fall in love with numbers through clear explanations, real-world examples and patient support.",
    ["Curriculum design", "Mentoring", "Algebra", "Classroom tech"],
    [{ title: "Math Olympiad Coaching", text: "My students won 14 regional medals in three years.", link: "" },
     { title: "Online Revision Classes", text: "Free weekly sessions reaching 400+ learners.", link: "" }],
    [{ role: "Head of Mathematics", org: "Greenfield College", period: "2019 - Now", text: "Improved exam pass rates by 22%." }]),
  sample(3, "business", "Michael Bello", "Founder & CEO",
    "I build and grow businesses across retail and logistics, with a focus on people, process and sustainable growth.",
    ["Strategy", "Operations", "Fundraising", "Leadership"],
    [{ title: "Swift Logistics", text: "Scaled from 3 to 120 staff and 9 cities.", link: "" },
     { title: "Bello Retail", text: "Opened 5 stores with 30% yearly growth.", link: "" }],
    [{ role: "Founder & CEO", org: "Swift Logistics", period: "2017 - Now", text: "Raised $2M seed funding." }]),
];

// ---------- share links (no server needed) ----------
const toB64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64 = (s) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};
export const shareUrl = (p) => `${location.origin}/view#${toB64(JSON.stringify({ ...p, id: "" }))}`;
export const fromShare = (hash) => {
  try { return JSON.parse(fromB64(hash.replace(/^#/, ""))); } catch { return null; }
};

// ---------- portfolio website generator ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const link = (u) => {
  u = String(u || "").trim();
  if (!u) return "";
  if (/^(https?:\/\/|mailto:)/i.test(u)) return u;
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(u)) return "mailto:" + u;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(u)) return "https://" + u;
  return "";
};

const CSS = `
*{box-sizing:border-box;margin:0}html{scroll-behavior:smooth}
body{min-height:100vh;font-family:var(--f);background:var(--bg);color:var(--fg);line-height:1.65;-webkit-font-smoothing:antialiased}
body.aurora{--bg:linear-gradient(180deg,#f3f4ff,#fff 45%);--fg:#1e1b4b;--mu:#64748b;--cd:#fff;--ln:#e6e8f5;--f:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--ha:center;--hj:center;--am:auto;--hb:transparent;--hf:inherit}
body.midnight{--bg:#080c18;--fg:#e6eaf5;--mu:#8b95b0;--cd:#101728;--ln:#1e2740;--f:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--ha:left;--hj:flex-start;--am:0;--hb:transparent;--hf:inherit}
body.scholar{--bg:#fbf6ee;--fg:#2b2118;--mu:#7a6a58;--cd:#fffdf8;--ln:#eadfce;--f:Georgia,"Times New Roman",serif;--ha:left;--hj:flex-start;--am:0;--hb:transparent;--hf:inherit}
body.executive{--bg:#f4f6fa;--fg:#0f172a;--mu:#5b6b82;--cd:#fff;--ln:#dfe5ee;--f:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--ha:left;--hj:flex-start;--am:0;--hb:#0b2545;--hf:#fff}
.nav{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 5vw;backdrop-filter:blur(10px);background:color-mix(in srgb,var(--cd) 72%,transparent);border-bottom:1px solid var(--ln)}
.nav b{font-weight:800;letter-spacing:-.01em}.nav div{display:flex;gap:20px}.nav a{font-size:14px;color:var(--mu);text-decoration:none;transition:.2s}.nav a:hover{color:var(--a)}
.hero{background:var(--hb);color:var(--hf);text-align:var(--ha);padding:92px 5vw 78px;position:relative;overflow:hidden}
.hero .in{max-width:880px;margin:auto;position:relative}
.blob{position:absolute;width:440px;height:440px;border-radius:50%;background:var(--a);filter:blur(95px);opacity:.2;top:-140px;right:-90px;animation:fl 10s ease-in-out infinite}
.av{width:108px;height:108px;border-radius:50%;background:linear-gradient(135deg,var(--a),#7c3aed);color:#fff;display:grid;place-items:center;font-size:44px;font-weight:800;margin-block-end:22px;margin-inline:var(--am);object-fit:cover;box-shadow:0 16px 36px -12px var(--a)}
.k{font-size:13px;letter-spacing:.15em;text-transform:uppercase;color:var(--a);font-weight:700}
.hero h1{font-size:clamp(38px,7vw,70px);line-height:1.04;margin:10px 0 18px;letter-spacing:-.03em;font-weight:800}
.hero p{font-size:19px;opacity:.82;max-width:640px;margin-inline:var(--am)}
.loc{margin-top:14px;font-size:14px;opacity:.7}
.cta{display:flex;gap:12px;margin-top:32px;justify-content:var(--hj);flex-wrap:wrap}
.b{padding:13px 26px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;background:var(--a);color:#fff;transition:.25s}
.b:hover{transform:translateY(-2px);box-shadow:0 14px 26px -12px var(--a)}.b.o{background:transparent;border:1.5px solid currentColor;color:inherit}
section{padding:72px 5vw}.w{max-width:960px;margin:auto}
h2{font-size:clamp(26px,4vw,36px);margin-bottom:30px;letter-spacing:-.02em;font-weight:800}
h2::after{content:"";display:block;width:46px;height:4px;border-radius:4px;background:var(--a);margin-top:10px}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{padding:9px 18px;border-radius:999px;background:var(--cd);border:1px solid var(--ln);font-size:14px;font-weight:600;transition:.2s}.chip:hover{border-color:var(--a);color:var(--a);transform:translateY(-2px)}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.c{background:var(--cd);border:1px solid var(--ln);border-radius:18px;padding:26px;transition:.3s}.c:hover{transform:translateY(-5px);box-shadow:0 22px 40px -24px var(--a);border-color:var(--a)}
.c h3{font-size:20px;margin-bottom:8px}.c p{color:var(--mu);font-size:15px}.c a{display:inline-block;margin-top:14px;color:var(--a);font-weight:700;font-size:14px;text-decoration:none}
.tl{border-left:2px solid var(--ln);padding-left:28px;display:grid;gap:30px}
.tl div{position:relative}.tl div::before{content:"";position:absolute;left:-35px;top:9px;width:12px;height:12px;border-radius:50%;background:var(--a);box-shadow:0 0 0 5px color-mix(in srgb,var(--a) 22%,transparent)}
.tl b{font-size:18px}.tl em{display:block;font-style:normal;color:var(--a);font-size:14px;font-weight:600}.tl p{color:var(--mu);margin-top:6px}
footer{padding:64px 5vw;text-align:center;border-top:1px solid var(--ln)}footer h2::after{margin-inline:auto}
.ct{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
small{display:block;margin-top:36px;color:var(--mu);font-size:13px}
.rv{animation:up .85s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*90ms)}
@keyframes up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes fl{50%{transform:translate(-30px,30px) scale(1.12)}}
@supports (animation-timeline:view()){.sc{animation:up both linear;animation-timeline:view();animation-range:entry 0% cover 28%}}
@media(max-width:640px){.nav div{display:none}.hero{padding:64px 6vw 56px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
`;

export function buildHtml(d) {
  d = d || {};
  const t = TEMPLATES.find((x) => x.id === d.template)?.id || "aurora";
  const a = /^#[0-9a-f]{6}$/i.test(d.accent || "") ? d.accent : "#4f46e5";
  const c = d.contact || {};
  const name = esc(d.name || "Your Name");
  const kind = KINDS[d.kind] || KINDS.student;
  const projects = (d.projects || []).filter((p) => p.title || p.text);
  const exp = (d.experience || []).filter((p) => p.role || p.org);
  const edu = (d.education || []).filter((p) => p.school || p.degree);
  const skills = (d.skills || []).filter(Boolean);
  const links = [["Email", c.email], ["Website", c.website], ["LinkedIn", c.linkedin], ["GitHub", c.github], ["X / Twitter", c.twitter]]
    .map(([l, v]) => [l, link(v)]).filter((x) => x[1]);
  let i = 0;
  const rv = (c = "") => `class="rv ${c}" style="--i:${i++}"`;
  const photo = /^https:\/\//i.test(d.photo || "") ? esc(d.photo) : "";
  const nav = [projects.length && ["work", kind.work], (exp.length || edu.length) && ["bg", "Background"], skills.length && ["skills", "Skills"], links.length && ["contact", "Contact"]].filter(Boolean);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}${d.title ? " | " + esc(d.title) : ""}</title><style>${CSS}</style></head>
<body class="${t}" style="--a:${a}">
<div class="nav"><b>${name}</b><div>${nav.map(([id, l]) => `<a href="#${id}">${esc(l.split(" & ")[0])}</a>`).join("")}</div></div>
<header class="hero"><div class="blob"></div><div class="in">
${photo ? `<img ${rv("av")} src="${photo}" alt="${name}">` : `<div ${rv("av")}>${esc((d.name || "Y").trim().charAt(0).toUpperCase())}</div>`}
<div ${rv("k")}>${esc(d.title || kind.label)}</div>
<h1 ${rv()}>${name}</h1>
${d.bio ? `<p ${rv()}>${esc(d.bio)}</p>` : ""}
${d.location ? `<div ${rv("loc")}>${esc(d.location)}</div>` : ""}
<div ${rv("cta")}>${projects.length ? `<a class="b" href="#work">View my work</a>` : ""}${links.length ? `<a class="b o" href="#contact">Get in touch</a>` : ""}</div>
</div></header>
${projects.length ? `<section id="work" class="sc"><div class="w"><h2>${esc(kind.work)}</h2><div class="g">${projects.map((p) => `<div class="c"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p>${link(p.link) ? `<a href="${esc(link(p.link))}" target="_blank" rel="noopener">View project &rarr;</a>` : ""}</div>`).join("")}</div></div></section>` : ""}
${exp.length || edu.length ? `<section id="bg" class="sc"><div class="w">${exp.length ? `<h2>Experience</h2><div class="tl">${exp.map((e) => `<div><b>${esc(e.role)}</b>${e.org ? " · " + esc(e.org) : ""}<em>${esc(e.period)}</em>${e.text ? `<p>${esc(e.text)}</p>` : ""}</div>`).join("")}</div>` : ""}${edu.length ? `<h2 style="margin-top:${exp.length ? 56 : 0}px">Education</h2><div class="tl">${edu.map((e) => `<div><b>${esc(e.school)}</b><em>${esc(e.degree)}${e.period ? " · " + esc(e.period) : ""}</em></div>`).join("")}</div>` : ""}</div></section>` : ""}
${skills.length ? `<section id="skills" class="sc"><div class="w"><h2>Skills</h2><div class="chips">${skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div></div></section>` : ""}
${links.length ? `<footer id="contact" class="sc"><h2>Let's work together</h2><div class="ct">${links.map(([l, u]) => `<a class="b${l === "Email" ? "" : " o"}" href="${esc(u)}" target="_blank" rel="noopener">${l}</a>`).join("")}</div><small>© ${new Date().getFullYear()} ${name}. Built with Portfolia.</small></footer>` : `<footer><small>© ${new Date().getFullYear()} ${name}. Built with Portfolia.</small></footer>`}
</body></html>`;
}
