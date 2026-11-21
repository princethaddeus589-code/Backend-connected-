import crypto from "crypto";
import nodemailer from "nodemailer";

const OTP_TTL = 10 * 60 * 1000; // code valid for 10 minutes
const COOLDOWN = 60 * 1000; // one new code per minute
const MAX_TRIES = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registerAuthRoutes(app, { auth, db, logEvent, isAdmin }) {
  const webKey = () => process.env.FIREBASE_WEB_API_KEY;
  const clean = (e) => String(e || "").trim().toLowerCase();
  const docId = (email, purpose) => crypto.createHash("sha256").update(`${email}|${purpose}`).digest("hex");
  const hashCode = (email, purpose, code) =>
    crypto.createHash("sha256").update(`${email}|${purpose}|${code}|${process.env.OTP_SECRET || webKey()}`).digest("hex");

    // ---------- sending email (Gmail first, Brevo as a backup) ----------
  let transporter;
  async function sendMail(to, subject, html) {
    const gUser = process.env.GMAIL_USER;
    const gPass = process.env.GMAIL_APP_PASSWORD;
    const fromName = process.env.MAIL_FROM_NAME || "Portfolia";

    if (gUser && gPass) {
      try {
        transporter ||= nodemailer.createTransport({ service: "gmail", auth: { user: gUser, pass: gPass.replace(/\s+/g, "") } });
        await transporter.sendMail({ from: `"${fromName}" <${gUser}>`, to, subject, html });
        return;
      } catch (err) {
        console.error("MAIL ERROR (gmail):", err.message);
        throw new Error("MAIL_FAILED");
      }
    }

    const key = process.env.BREVO_API_KEY;
    const from = process.env.MAIL_FROM;
    if (!key || !from) throw new Error("MAIL_NOT_CONFIGURED");
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: fromName, email: from }, to: [{ email: to }], subject, htmlContent: html }),
    });
    if (!r.ok) {
      console.error("MAIL ERROR:", r.status, await r.text().catch(() => ""));
      throw new Error("MAIL_FAILED");
    }
  }



  const mailHtml = (title, code) =>
    `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#111">
<h2 style="margin:0 0 12px">${title}</h2>
<p>Your Portfolia verification code is:</p>
<p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:18px 0">${code}</p>
<p style="color:#666;font-size:13px">This code expires in 10 minutes. If you did not ask for it, you can ignore this email.</p></div>`;

  // ---------- one-time codes (stored hashed in Firestore) ----------
  async function issueOtp(email, purpose) {
    const ref = db.collection("otps").doc(docId(email, purpose));
    const snap = await ref.get();
    const now = Date.now();
    if (snap.exists && now - snap.data().sentAt < COOLDOWN) {
      const e = new Error("WAIT");
      e.wait = Math.ceil((COOLDOWN - (now - snap.data().sentAt)) / 1000);
      throw e;
    }
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    await ref.set({ email, purpose, codeHash: hashCode(email, purpose, code), expires: now + OTP_TTL, tries: 0, sentAt: now });
    return code;
  }

  async function checkOtp(email, purpose, code) {
    const ref = db.collection("otps").doc(docId(email, purpose));
    const snap = await ref.get();
    if (!snap.exists) return "expired";
    const d = snap.data();
    if (Date.now() > d.expires) { await ref.delete(); return "expired"; }
    if (d.tries >= MAX_TRIES) return "locked";
    const a = Buffer.from(hashCode(email, purpose, String(code).trim()));
    const b = Buffer.from(d.codeHash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      await ref.update({ tries: d.tries + 1 });
      return "bad";
    }
    await ref.delete();
    return "ok";
  }

  const otpMessage = {
    bad: "That code is not correct. Check it and try again.",
    expired: "That code has expired. Request a new one.",
    locked: "Too many wrong attempts. Request a new code.",
  };

  function fail(res, err, fallback) {
    if (err.message === "WAIT") return res.status(429).json({ message: `Please wait ${err.wait} seconds before asking for a new code.` });
    if (err.message === "MAIL_NOT_CONFIGURED") return res.status(503).json({ message: "Email sending is not set up yet. Please try again later." });
    if (err.message === "MAIL_FAILED") return res.status(502).json({ message: "We could not send the email. Please try again." });
    console.error("AUTH ERROR:", err.message);
    return res.status(500).json({ message: fallback });
  }

  // ---------- sign up with an email code ----------
  // Old direct sign-up is closed so nobody can skip the verification code.
  app.post("/api/signup", (req, res) =>
    res.status(410).json({ message: "Please refresh the app and sign up again." })
  );

  app.post("/api/signup/start", async (req, res) => {
    try {
      const name = String(req.body?.name || "").trim();
      const email = clean(req.body?.email);
      const password = String(req.body?.password || "");
      if (!name) return res.status(400).json({ message: "Please enter your name." });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
      if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

      try {
        await auth.getUserByEmail(email);
        return res.status(409).json({ message: "An account with this email already exists. Sign in instead." });
      } catch (e) {
        if (e.code !== "auth/user-not-found") throw e;
      }

      const code = await issueOtp(email, "signup");
      await sendMail(email, "Your Portfolia verification code", mailHtml("Verify your email", code));
      res.json({ message: "Code sent" });
    } catch (err) {
      fail(res, err, "Could not send the code. Please try again.");
    }
  });

  app.post("/api/signup/verify", async (req, res) => {
    try {
      const name = String(req.body?.name || "").trim();
      const email = clean(req.body?.email);
      const password = String(req.body?.password || "");
      const code = String(req.body?.code || "").trim();
      if (!name || !EMAIL_RE.test(email) || password.length < 6 || code.length !== 6) {
        return res.status(400).json({ message: "Please check your details and the 6-digit code." });
      }
      const result = await checkOtp(email, "signup", code);
      if (result !== "ok") return res.status(400).json({ message: otpMessage[result] });

      const user = await auth.createUser({ email, password, displayName: name, emailVerified: true });
      await logEvent("signup", { uid: user.uid, email: user.email }, { verified: true });
      res.status(201).json({ message: "Account created", uid: user.uid });
    } catch (err) {
      if (err.code === "auth/email-already-exists") return res.status(409).json({ message: "An account with this email already exists. Sign in instead." });
      fail(res, err, "Could not create your account. Please try again.");
    }
  });

  // ---------- forgot password with an email code ----------
  app.post("/api/forgot/start", async (req, res) => {
    const generic = { message: "If an account exists for that email, we sent a code." };
    try {
      const email = clean(req.body?.email);
      if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
      try {
        await auth.getUserByEmail(email);
      } catch (e) {
        if (e.code === "auth/user-not-found") return res.json(generic);
        throw e;
      }
      const code = await issueOtp(email, "reset");
      await sendMail(email, "Reset your Portfolia password", mailHtml("Reset your password", code));
      await logEvent("password_reset_requested", { email });
      res.json(generic);
    } catch (err) {
      if (err.message === "WAIT") return res.json(generic);
      fail(res, err, "Could not send the code. Please try again.");
    }
  });

  app.post("/api/forgot/reset", async (req, res) => {
    try {
      const email = clean(req.body?.email);
      const code = String(req.body?.code || "").trim();
      const password = String(req.body?.password || "");
      if (!EMAIL_RE.test(email) || code.length !== 6) return res.status(400).json({ message: "Please check your email and the 6-digit code." });
      if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

      const result = await checkOtp(email, "reset", code);
      if (result !== "ok") return res.status(400).json({ message: otpMessage[result] });

      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password, emailVerified: true });
      await logEvent("password_reset", { uid: user.uid, email });
      res.json({ message: "Password updated" });
    } catch (err) {
      if (err.code === "auth/user-not-found") return res.status(400).json({ message: otpMessage.bad });
      fail(res, err, "Could not reset your password. Please try again.");
    }
  });

  // ---------- Google / Apple sign-in (through Firebase) ----------
  async function socialSignIn(res, providerId, idToken, extra = "", nameHint = "") {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${webKey()}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        postBody: `id_token=${encodeURIComponent(idToken)}&providerId=${providerId}${extra}`,
        requestUri: "http://localhost",
        returnIdpCredential: true,
        returnSecureToken: true,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.idToken) {
      const code = data?.error?.message || "";
      console.error("SOCIAL SIGNIN ERROR:", providerId, code);
      if (code.includes("USER_DISABLED")) return res.status(403).json({ message: "This account has been disabled." });
      return res.status(401).json({ message: "Sign-in failed. Please try again or use your email." });
    }
    if (data.needConfirmation) return res.status(409).json({ message: "This email already has a password account. Sign in with your password." });

    let name = data.displayName || nameHint || "";
    if (!data.displayName && nameHint) {
      try { await auth.updateUser(data.localId, { displayName: nameHint }); } catch { /* ignore */ }
    }
    if (!name) name = String(data.email || "").split("@")[0];
    await logEvent(data.isNewUser ? "signup" : "signin", { uid: data.localId, email: data.email }, { provider: providerId });
    res.json({ uid: data.localId, name, email: data.email, token: data.idToken, admin: isAdmin(data.email) });
  }

  app.post("/api/auth/google", async (req, res) => {
    try {
      const credential = String(req.body?.credential || "");
      if (!credential) return res.status(400).json({ message: "Missing Google credential." });
      await socialSignIn(res, "google.com", credential);
    } catch (err) {
      fail(res, err, "Google sign-in failed. Please try again.");
    }
  });

  app.post("/api/auth/apple", async (req, res) => {
    try {
      const credential = String(req.body?.credential || "");
      const nonce = String(req.body?.nonce || "");
      if (!credential) return res.status(400).json({ message: "Missing Apple credential." });
      await socialSignIn(res, "apple.com", credential, nonce ? `&nonce=${encodeURIComponent(nonce)}` : "", String(req.body?.name || "").trim().slice(0, 60));
    } catch (err) {
      fail(res, err, "Apple sign-in failed. Please try again.");
    }
  });
}
