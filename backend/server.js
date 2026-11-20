import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Firebase Admin
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("Firebase credentials loaded from ENV:", serviceAccount.client_email);
  } else {
    // For local development only - use the JSON file
    serviceAccount = (await import("./serviceAccountKey.json", { with: { type: "json" } })).default;
    console.log("Firebase credentials loaded from FILE");
  }
} catch (err) {
  console.error("Firebase credentials missing or invalid:", err.message);
  process.exit(1);
}

// Fix line breaks in the private key if they were pasted as \n text
if (serviceAccount?.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Portfolia Auth API is running" });
});

const db = getFirestore();

// ---------- admin + activity tracking ----------
const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const isAdmin = (email) => !!email && ADMINS.includes(String(email).toLowerCase());

async function logEvent(type, user, meta = {}) {
  try {
    await db.collection("events").add({
      type,
      uid: user?.uid || "",
      email: user?.email || "",
      meta,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("LOG EVENT ERROR:", err.message);
  }
}

async function authUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("no token");
  return auth.verifyIdToken(token);
}

async function requireAdmin(req, res, next) {
  try {
    const user = await authUser(req);
    if (!isAdmin(user.email)) return res.status(403).json({ message: "Admins only." });
    req.admin = user;
    next();
  } catch {
    res.status(401).json({ message: "Please sign in again." });
  }
}

// SIGN UP
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await auth.createUser({
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    await logEvent("signup", { uid: user.uid, email: user.email });
    return res.status(201).json({
      message: "Account created successfully",
      uid: user.uid,
      name: user.displayName,
      email: user.email,
    });
  } catch (error) {
    console.error("SIGNUP ERROR CODE:", error.code);
    console.error("SIGNUP ERROR MESSAGE:", error.message);

    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        message: "This email is already registered",
      });
    }

    return res.status(400).json({
      message: "Signup failed: " + (error.code || "unknown error"),
    });
  }
});

// SIGN IN
app.post("/api/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "FIREBASE_WEB_API_KEY is not set" });
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const code = data?.error?.message || "UNKNOWN";
      console.error("SIGNIN ERROR:", code);
      await logEvent("signin_failed", { email: String(email).trim().toLowerCase() }, { reason: code });

      if (code.startsWith("API_KEY") || code.includes("API key") || code === "OPERATION_NOT_ALLOWED") {
        return res.status(500).json({ message: "Server config error: " + code });
      }
      if (code === "EMAIL_NOT_FOUND") {
        return res.status(401).json({ message: "No account found with this email" });
      }
      return res.status(401).json({ message: "Email or password is incorrect" });
    }

    // Get display name from Firebase Admin
    let name = data.displayName || email.split("@")[0];
    try {
      const user = await auth.getUser(data.localId);
      name = user.displayName || name;
    } catch {}

        await logEvent("signin", { uid: data.localId, email: data.email });

    res.json({
      message: "Sign in successful",
      uid: data.localId,
      name,
      email: data.email,
      token: data.idToken,
      admin: isAdmin(data.email),
    });

  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Sign in failed" });
  }
});

// AI WRITING HELPER (free Google Gemini key: GEMINI_API_KEY)
const AI_HITS = new Map();
const AI_SYSTEM =
  "You are a writing assistant inside Portfolia, a portfolio builder used by students, professionals, freelancers and founders. " +
  "Write clear, natural, first-person text based only on the details the user gives. " +
  "Never invent employers, degrees, numbers, awards or links. Keep it concise. Reply with the text only, no preamble.";
const AI_TASKS = {
  bio: "Write a short portfolio bio of 2 to 3 sentences.",
  project: "Write a clear project or achievement description of 2 to 4 sentences, focused on what was done and the result.",
  skills: "Suggest 8 to 10 relevant skills as a comma-separated list. Only list the skills.",
  polish: "Improve the wording, clarity and grammar of this text. Keep the meaning and the length similar.",
};

const AI_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash"];

app.post("/api/ai/write", async (req, res) => {
  let user = null;
  const { tool, input, tone } = req.body || {};
  const fail = async (status, message, extra = {}) => {
    await logEvent("ai_write", user, { tool: String(tool || ""), ok: false, status, ...extra });
    return res.status(status).json({ message });
  };

  try {
    try {
      user = await authUser(req);
    } catch {
      return res.status(401).json({ message: "Your session expired. Please sign out and sign in again." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return fail(503, "AI is not set up yet. Add GEMINI_API_KEY on the server.");

    if (!AI_TASKS[tool] || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({ message: "Please add some notes first." });
    }

    const now = Date.now();
    const hits = (AI_HITS.get(user.uid) || []).filter((t) => now - t < 3600000);
    if (hits.length >= 20) return fail(429, "You reached the hourly AI limit. Try again later.", { limit: true });
    hits.push(now);
    AI_HITS.set(user.uid, hits);

    const safeTone = ["Professional", "Friendly", "Confident"].includes(tone) ? tone : "Professional";
    const models = [process.env.AI_MODEL, ...AI_MODELS].filter(Boolean);
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: AI_SYSTEM }] },
      contents: [
        {
          role: "user",
          parts: [{ text: `${AI_TASKS[tool]}\nTone: ${safeTone}\n\nUser details:\n${input.trim().slice(0, 2000)}` }],
        },
      ],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    });

    let lastStatus = 0;
    let lastMsg = "";
    for (const model of [...new Set(models)]) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey }, body }
      );
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
        if (!text) return fail(502, "The AI returned no text. Try rephrasing your notes.", { model });
        await logEvent("ai_write", user, { tool, ok: true, model, chars: text.length });
        return res.json({ text });
      }

      lastStatus = response.status;
      lastMsg = data?.error?.message || String(response.status);
      console.error("AI ERROR:", model, response.status, lastMsg);
      if ([404, 429, 500, 503].includes(response.status)) continue;
      break;
    }

    if (lastStatus === 429) return fail(429, "The free AI limit was reached for now. Please try again in a minute.", { detail: lastMsg });
    if (lastStatus === 404) return fail(502, "No AI model is available for your key. Set AI_MODEL to a model listed in Google AI Studio.", { detail: lastMsg });
    if (lastStatus === 400 || lastStatus === 403) return fail(502, "AI key problem. Check GEMINI_API_KEY on the server.", { detail: lastMsg });
    return fail(502, "The AI service could not answer right now. Please try again.", { detail: lastMsg });
  } catch (error) {
    console.error("AI ROUTE ERROR:", error);
    return fail(500, "Something went wrong. Please try again.");
  }
});

// APP ACTIVITY
const TRACK_TYPES = ["portfolio_saved", "portfolio_deleted", "portfolio_shared", "portfolio_downloaded"];
app.post("/api/track", async (req, res) => {
  try {
    const user = await authUser(req);
    const { type, meta } = req.body || {};
    if (!TRACK_TYPES.includes(type)) return res.status(400).json({ message: "Unknown event." });
    const clean = {};
    for (const k of ["template", "kind"]) if (typeof meta?.[k] === "string") clean[k] = meta[k].slice(0, 30);
    if (typeof meta?.isNew === "boolean") clean.isNew = meta.isNew;
    await logEvent(type, user, clean);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ message: "Please sign in again." });
  }
});

// ADMIN DASHBOARD
const DAY = 86400000;
const toMs = (s) => (s ? Date.parse(s) || 0 : 0);

async function readEvents(limit) {
  const snap = await db.collection("events").orderBy("ts", "desc").limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

app.get("/api/admin/overview", requireAdmin, async (req, res) => {
  try {
    const list = await auth.listUsers(1000);
    const now = Date.now();
    const users = list.users;
    const stats = {
      totalUsers: users.length,
      newUsers7d: users.filter((u) => now - toMs(u.metadata.creationTime) < 7 * DAY).length,
      active24h: users.filter((u) => now - toMs(u.metadata.lastSignInTime) < DAY).length,
      disabledUsers: users.filter((u) => u.disabled).length,
    };

    let events = [];
    let dbError = "";
    try {
      events = await readEvents(500);
    } catch (err) {
      dbError = err.message;
      console.error("ADMIN EVENTS ERROR:", err.message);
    }

    const count = (fn) => events.filter(fn).length;
    const totals = {
      signins: count((e) => e.type === "signin"),
      failedSignins: count((e) => e.type === "signin_failed"),
      portfoliosSaved: count((e) => e.type === "portfolio_saved"),
      portfoliosShared: count((e) => e.type === "portfolio_shared"),
      downloads: count((e) => e.type === "portfolio_downloaded"),
      aiRequests: count((e) => e.type === "ai_write"),
      aiFailures: count((e) => e.type === "ai_write" && e.meta?.ok === false),
    };

    const aiTools = {};
    events.filter((e) => e.type === "ai_write").forEach((e) => {
      const t = e.meta?.tool || "unknown";
      aiTools[t] = (aiTools[t] || 0) + 1;
    });

    const series = [];
    for (let i = 13; i >= 0; i--) {
      const start = new Date(now - i * DAY);
      start.setUTCHours(0, 0, 0, 0);
      const s = start.getTime();
      const inDay = (e) => e.ts >= s && e.ts < s + DAY;
      series.push({
        day: start.toISOString().slice(5, 10),
        signups: count((e) => inDay(e) && e.type === "signup"),
        signins: count((e) => inDay(e) && e.type === "signin"),
        ai: count((e) => inDay(e) && e.type === "ai_write"),
        portfolios: count((e) => inDay(e) && e.type === "portfolio_saved"),
      });
    }

    res.json({ stats, totals, aiTools, series, recent: events.slice(0, 25), dbError, sample: events.length });
  } catch (err) {
    console.error("ADMIN OVERVIEW ERROR:", err);
    res.status(500).json({ message: "Could not load the dashboard." });
  }
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const list = await auth.listUsers(1000);
    const users = list.users
      .map((u) => ({
        uid: u.uid,
        email: u.email || "",
        name: u.displayName || "",
        created: toMs(u.metadata.creationTime),
        lastSignIn: toMs(u.metadata.lastSignInTime),
        disabled: u.disabled,
        admin: isAdmin(u.email),
      }))
      .sort((a, b) => b.created - a.created);
    res.json({ users });
  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    res.status(500).json({ message: "Could not load users." });
  }
});

app.get("/api/admin/events", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const type = String(req.query.type || "");
    let events = await readEvents(500);
    if (type) events = events.filter((e) => e.type === type);
    res.json({ events: events.slice(0, limit) });
  } catch (err) {
    console.error("ADMIN EVENTS ERROR:", err.message);
    res.status(500).json({ message: "Could not load activity. Is Firestore enabled?" });
  }
});

app.post("/api/admin/users/disable", requireAdmin, async (req, res) => {
  try {
    const { uid, disabled } = req.body || {};
    if (typeof uid !== "string" || typeof disabled !== "boolean") return res.status(400).json({ message: "Invalid request." });
    const target = await auth.getUser(uid);
    if (isAdmin(target.email)) return res.status(400).json({ message: "You cannot disable an admin." });
    await auth.updateUser(uid, { disabled });
    await logEvent(disabled ? "admin_disabled_user" : "admin_enabled_user", req.admin, { target: target.email || uid });
    res.json({ ok: true });
  } catch (err) {
    console.error("ADMIN DISABLE ERROR:", err.message);
    res.status(500).json({ message: "Could not update this user." });
  }
});

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
