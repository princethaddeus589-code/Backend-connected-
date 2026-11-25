import { useEffect, useState } from "react";
import { getUser } from "./lib";

const BASE = (import.meta.env?.VITE_API_URL || "https://backend-connected-hyw6.vercel.app").replace(/\/+$/, "");
export const FREE_TEMPLATES = ["aurora", "midnight", "scholar", "executive"];

async function api(method, path, body) {
  const token = getUser()?.token || "";
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Check your internet and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.message || "Something went wrong. Please try again.");
    e.status = res.status;
    e.code = data.code;
    throw e;
  }
  return data;
}

export const apiPublish = (portfolio, slug, customSlug) => api("POST", "/api/portfolios/publish", { portfolio, slug, customSlug });
export const apiUnpublish = (slug) => api("POST", "/api/portfolios/unpublish", { slug });
export const apiPublic = (slug) => api("GET", "/api/public/p/" + encodeURIComponent(slug));
export const apiNotifs = () => api("GET", "/api/notifications");
export const apiNotifsRead = () => api("POST", "/api/notifications/read", {});
export const apiRequestPremium = () => api("POST", "/api/premium/request", {});
export const adminNotify = (b) => api("POST", "/api/admin/notify", b);
export const adminNotifList = () => api("GET", "/api/admin/notifications");
export const adminNotifDelete = (id) => api("POST", "/api/admin/notify/delete", { id });
export const adminSetPlan = (uid, plan, days) => api("POST", "/api/admin/users/plan", { uid, plan, days });
export const siteLink = (slug) => `${location.origin}/p/${slug}`;

// ---- plan of the signed-in user (cached on this device) ----
const key = () => "pf_me_" + (getUser()?.uid || "guest");
export const getMe = () => {
  try { return JSON.parse(localStorage.getItem(key())) || null; } catch { return null; }
};
export async function refreshMe() {
  try {
    const me = await api("GET", "/api/me");
    localStorage.setItem(key(), JSON.stringify(me));
    window.dispatchEvent(new Event("pf-me"));
    return me;
  } catch {
    return getMe();
  }
}
export const isPremium = () => getMe()?.plan === "premium";
export const brand = (html) => (isPremium() ? html.split(" Built with Portfolia.").join("") : html);

export function useMe(refresh = false) {
  const [me, setMe] = useState(getMe);
  useEffect(() => {
    const f = () => setMe(getMe());
    window.addEventListener("pf-me", f);
    if (refresh) refreshMe();
    return () => window.removeEventListener("pf-me", f);
  }, [refresh]);
  return me;
}
