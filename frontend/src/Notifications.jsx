import { useCallback, useEffect, useRef, useState } from "react";
import { apiNotifs, apiNotifsRead } from "./plan";
import { Icon } from "./ui";

const ICON = { update: "refresh", template: "layout", feature: "spark", premium: "crown", info: "bell" };
const LABEL = { update: "Update", template: "New template", feature: "New feature", premium: "Premium", info: "Info" };

const ago = (t) => {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  if (m < 43200) return `${Math.floor(m / 1440)} d ago`;
  return new Date(t).toLocaleDateString();
};

export default function Bell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0, seen: 0 });
  const box = useRef(null);

  const load = useCallback(async () => {
    try { setData(await apiNotifs()); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    const f = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", f);
    return () => document.removeEventListener("pointerdown", f);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
      if (data.unread > 0) {
        apiNotifsRead().catch(() => {});
        setData((d) => ({ ...d, unread: 0 }));
      }
    }
  }

  return (
    <div className="bellwrap" ref={box}>
      <button className="bellbtn" onClick={toggle} aria-label="Notifications">
        <Icon n="bell" />
        {data.unread > 0 && <span className="belldot">{data.unread > 9 ? "9+" : data.unread}</span>}
      </button>
      {open && (
        <div className="npop">
          <div className="npop-head"><b>Notifications</b></div>
          {data.items.length === 0 ? (
            <p className="muted npop-empty">Nothing yet. Updates, new templates and features will show up here.</p>
          ) : (
            data.items.map((n) => (
              <div key={n.id} className={`nitem ${n.ts > data.seen ? "new" : ""}`}>
                <span className={`nic ${n.kind}`}><Icon n={ICON[n.kind] || "bell"} s={16} /></span>
                <div>
                  <b>{n.title}</b>
                  {n.body && <p>{n.body}</p>}
                  <small>{LABEL[n.kind] || "Info"} · {ago(n.ts)}</small>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
