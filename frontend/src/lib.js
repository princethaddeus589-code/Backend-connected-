// ---------- API + session ----------
const BASE = (import.meta.env?.VITE_API_URL || "https://backend-connected-hyw6.vercel.app").replace(/\/+$/, "");

async function call(method, path, body, token) {
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
    throw e;
  }
  return data;
}
const post = (path, body, token) => call("POST", path, body, token);

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("pf_user")); } catch { return null; }
};
export const saveSession = (u) =>
  localStorage.setItem("pf_user", JSON.stringify({ uid: u.uid, name: u.name, email: u.email, token: u.token, admin: !!u.admin }));
export const clearSession = () => localStorage.removeItem("pf_user");
export const updateName = (name) => {
  const u = getUser();
  if (u) localStorage.setItem("pf_user", JSON.stringify({ ...u, name }));
};
export const apiSignup = (b) => post("/api/signup", b);
export const apiSignin = (b) => post("/api/signin", b);
export const isAdmin = () => !!getUser()?.admin;
const tok = () => getUser()?.token || "";
export const adminGet = (path) => call("GET", "/api/admin" + path, null, tok());
export const adminPost = (path, body) => call("POST", "/api/admin" + path, body, tok());
export const track = (type, meta = {}) => {
  call("POST", "/api/track", { type, meta }, tok()).catch(() => {});
};
export const aiWrite = (b) => post("/api/ai/write", b, tok());

