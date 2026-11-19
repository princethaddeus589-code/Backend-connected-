import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession } from "./api";
import Logo from "./Logo";

const icons = {
  home: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  templates: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  ai: <path d="M11 3l1.8 4.6L17 9.4l-4.2 1.8L11 16l-1.8-4.8L5 9.4l4.2-1.8zM18 14l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
};

const items = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/templates", label: "Templates", icon: "templates" },
  { to: "/ai-tools", label: "AI Tools", icon: "ai" },
  { to: "/my-portfolios", label: "Portfolios", icon: "folder" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

function readCount() {
  try {
    const list = JSON.parse(localStorage.getItem("portfolios") || "[]");
    return Array.isArray(list) ? list.length : 0;
  } catch {
    return 0;
  }
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(readCount);
  const menuRef = useRef(null);

  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";
  const initials = userName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  let active = items.findIndex((i) => pathname.startsWith(i.to));
  if (pathname.startsWith("/create-portfolio")) active = 1;

  useEffect(() => {
    const update = () => setCount(readCount());
    update();
    window.addEventListener("portfolios-change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("portfolios-change", update);
      window.removeEventListener("storage", update);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : !menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function signOut() {
    clearSession();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo to="/dashboard" />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-medium transition hover:bg-mist"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cobalt text-xs font-bold text-white">
                {initials}
              </span>
              <span className="hidden max-w-[120px] truncate sm:block">
                {userName.split(" ")[0]}
              </span>
              <svg className="h-4 w-4 text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                className="page-in absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-xl"
              >
                <div className="border-b border-line p-4">
                  <p className="truncate font-semibold">{userName}</p>
                  <p className="truncate text-sm text-muted">{userEmail}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm hover:bg-mist"
                  >
                    Account settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-36 pt-6">
        <div key={pathname} className="page-in">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <ul className="pointer-events-auto relative flex w-full max-w-md rounded-[2rem] bg-ink/90 p-1.5 shadow-[0_14px_40px_rgba(11,18,32,0.35)] ring-1 ring-white/10 backdrop-blur-xl">
          <span
            aria-hidden
            className="absolute inset-y-1.5 left-1.5 rounded-[1.6rem] bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.3,0.9,0.3,1)]"
            style={{
              width: `calc((100% - 0.75rem) / ${items.length})`,
              transform: `translateX(${Math.max(active, 0) * 100}%)`,
              opacity: active < 0 ? 0 : 1,
            }}
          />
          {items.map((item, i) => (
            <li key={item.to} className="relative z-10 flex-1">
              <Link
                to={item.to}
                aria-current={i === active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-[1.6rem] py-2.5 text-[11px] font-semibold transition-colors ${
                  i === active ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {icons[item.icon]}
                </svg>
                {item.label}
                {item.icon === "folder" && count > 0 && (
                  <span className="absolute right-[18%] top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cobalt px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
