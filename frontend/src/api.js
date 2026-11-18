const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://backend-connected-hyw6.vercel.app"
).replace(/\/+$/, "");

console.log("API_BASE:", API_BASE);
export async function apiSignup({ name, email, password }) {
  try {
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json().catch(() => ({}));

    console.log("Signup response:", res.status, data);

    if (!res.ok) {
      throw new Error(data.message || "Unable to create account");
    }

    return data;
  } catch (error) {
    console.error("Signup connection error:", error);
    throw error;
  }
}

export async function apiSignin({ email, password }) {
  const res = await fetch(`${API_BASE}/api/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Sign in failed");
  }

  return data;
}

export function saveSession(user) {
  sessionStorage.setItem(
    "auth_token",
    user.token || user.uid || "session"
  );

  localStorage.setItem("userName", user.name || "User");
  localStorage.setItem("userEmail", user.email || "");

  if (user.uid) {
    localStorage.setItem("userUid", user.uid);
  }
}

export function clearSession() {
  sessionStorage.removeItem("auth_token");
}

export function isLoggedIn() {
  return Boolean(sessionStorage.getItem("auth_token"));
}
