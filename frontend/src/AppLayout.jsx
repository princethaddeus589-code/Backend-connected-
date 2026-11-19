import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession } from "./api";
import Logo from "./Logo";

const menu = [
  { name: "Overview", path: "/dashboard", icon: "▦" },
  { name: "Templates", path: "/templates", icon: "▤" },
  { name: "My portfolios", path: "/my-portfolios", icon: "▣" },
  { name: "Settings", path: "/settings", icon: "⚙" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-mist text-ink md:flex">
      {/* Sidebar */}
      <aside className="border-b border-line bg-white md:flex md:w-64 md:flex-none md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:p-5">
          <Logo />
          <button
            type="button"
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>

        <div className="hidden px-4 pb-3 md:block">
          <div className="rounded-xl border border-line bg-mist p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cobalt text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs text-muted">Free plan</p>
              </div>
            </div>
          </div>
        </div>

        <nav
          className={`${
            mobileOpen ? "flex" : "hidden"
          } flex-col gap-1 px-3 pb-4 md:flex`}
        >
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-cobalt/10 text-cobalt"
                    : "text-body hover:bg-mist"
                }`
              }
            >
              <span className="text-base opacity-80">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden p-4 md:block">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-line bg-white py-2.5 text-sm font-semibold text-body transition hover:bg-mist"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-muted">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
          >
            Sign out
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
