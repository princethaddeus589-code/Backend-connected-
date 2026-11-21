import { useEffect, useRef } from "react";
import { apiApple, apiGoogle } from "./lib";

const GID = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
const AID = import.meta.env?.VITE_APPLE_CLIENT_ID;
const onApple = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const old = document.querySelector(`script[src="${src}"]`);
    if (old) {
      if (old.dataset.loaded) return resolve();
      old.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = () => reject(new Error("Could not load sign-in. Check your connection."));
    document.head.appendChild(s);
  });
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function appleLogin() {
  await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");
  const raw = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
  window.AppleID.auth.init({
    clientId: AID,
    scope: "name email",
    redirectURI: window.location.origin,
    state: "pf",
    nonce: await sha256Hex(raw),
    usePopup: true,
  });
  const r = await window.AppleID.auth.signIn();
  const n = r.user?.name;
  return {
    credential: r.authorization.id_token,
    nonce: raw,
    name: n ? `${n.firstName || ""} ${n.lastName || ""}`.trim() : "",
  };
}

function Google({ onToken }) {
  const box = useRef(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  useEffect(() => {
    let alive = true;
    loadScript("https://accounts.google.com/gsi/client")
      .then(() => {
        if (!alive || !box.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({ client_id: GID, callback: (r) => cb.current(r.credential) });
        window.google.accounts.id.renderButton(box.current, {
          theme: "outline", size: "large", shape: "pill", text: "continue_with", logo_alignment: "center",
          width: Math.min(box.current.offsetWidth || 340, 400),
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return <div ref={box} className="gbtn" />;
}

export default function Social({ onUser, onError }) {
  if (!GID && !(AID && onApple)) return null;

  async function run(fn) {
    try {
      onError("");
      onUser(await fn());
    } catch (e) {
      if (e?.error === "popup_closed_by_user" || e?.error === "user_cancelled_authorize") return;
      onError(e?.message || "Sign-in failed. Please try again.");
    }
  }

  return (
    <div className="social">
      {GID && <Google onToken={(c) => run(() => apiGoogle({ credential: c }))} />}
      {AID && onApple && (
        <button type="button" className="abtn" onClick={() => run(async () => apiApple(await appleLogin()))}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
          </svg>
          Continue with Apple
        </button>
      )}
      <div className="divider"><span>or</span></div>
    </div>
  );
}
