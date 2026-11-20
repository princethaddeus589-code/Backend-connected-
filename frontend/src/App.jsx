import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearSession, fromShare, getUser, isAdmin } from "./lib";
import { Icon } from "./ui";
import Landing from "./Landing";
import Auth from "./Auth";
import Builder from "./Builder";
import Admin from "./Admin";
import { Dashboard, Portfolios, AiTools, Settings } from "./Pages";
import { buildHtml } from "./lib";

const NAV = [
  { to: "/app", end: true, label: "Home", icon: "home" },
  { to: "/app/portfolios", label: "Portfolios", icon: "folder" },
  { to: "/app/create", label: "Create", icon: "plus" },
  { to: "/app/ai", label: "AI", icon: "spark" },
  { to: "/app/settings", label: "Settings", icon: "sliders" },
];

function Guard({ children }) {
  return getUser() ? children : <Navigate to="/login" replace />;
}
function AdminOnly({ children }) {
  return isAdmin() ? children : <Navigate to="/app" replace />;
}
function Guest({ children }) {
  return getUser() ? <Navigate to="/app" replace /> : children;
}

function Shell() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = getUser() || {};
  const [open, setOpen] = useState(false);
  const menu = useRef(null);

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const f = (e) => menu.current && !menu.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", f);
    return () => document.removeEventListener("pointerdown", f);
  }, []);

  const signOut = () => {
    clearSession();
    nav("/", { replace: true });
  };
  const TITLES = { "/app": "Home", "/app/portfolios": "Portfolios", "/app/create": "Create", "/app/ai": "AI writer", "/app/settings": "Settings", "/app/admin": "Admin" };
  const title = TITLES[loc.pathname] || (loc.pathname.startsWith("/app/edit") ? "Edit" : "");
  const initial = (user.name || user.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="shell">
      <aside className="side">
        <div className="who">
          <span className="avatar">{initial}</span>
          <div>
            <b>{user.name || "Your account"}</b>
            <small>{user.email}</small>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <Icon n={n.icon} /> {n.label}
            </NavLink>
          ))}
          {isAdmin() && (
            <NavLink to="/app/admin"><Icon n="shield" /> Admin</NavLink>
          )}
        </nav>
        <div className="side-foot">
          <button className="btn ghost full" onClick={signOut}><Icon n="out" s={18} /> Sign out</button>
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <div className="top-title">{title}</div>
          <div className="top-right" ref={menu}>
            <button className="avatar btn-av" onClick={() => setOpen(!open)} aria-label="Account menu">{initial}</button>
            {open && (
              <div className="pop">
                <div className="pop-head"><b>{user.name || "Your account"}</b><small>{user.email}</small></div>
                {isAdmin() && <button onClick={() => nav("/app/admin")}><Icon n="shield" s={18} /> Admin dashboard</button>}
                <button onClick={() => nav("/app/settings")}><Icon n="sliders" s={18} /> Settings</button>
                <button className="danger" onClick={signOut}><Icon n="out" s={18} /> Sign out</button>
              </div>
            )}
          </div>
        </header>
        <main className="page" key={loc.pathname}>
          <Outlet />
        </main>
      </div>

      <nav className="bottom">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span className="ic"><Icon n={n.icon} /></span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function View() {
  const data = fromShare(location.hash);
  if (!data) return <Navigate to="/" replace />;
  return (
    <div className="viewer">
      <iframe title={data.name || "Portfolio"} srcDoc={buildHtml(data)} sandbox="allow-popups allow-popups-to-escape-sandbox" />
      <a className="badge" href="/" target="_blank" rel="noopener">Made with Portfolia</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Guest><Auth mode="login" /></Guest>} />
        <Route path="/signup" element={<Guest><Auth mode="signup" /></Guest>} />
        <Route path="/view" element={<View />} />
        <Route path="/app" element={<Guard><Shell /></Guard>}>
          <Route index element={<Dashboard />} />
          <Route path="portfolios" element={<Portfolios />} />
          <Route path="create" element={<Builder />} />
          <Route path="edit/:id" element={<Builder />} />
          <Route path="ai" element={<AiTools />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<AdminOnly><Admin /></AdminOnly>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
