import crypto from "crypto";

const FREE_TEMPLATES = ["aurora", "midnight", "scholar", "executive"];
const FREE_AI = 10; // AI requests per hour
const PREMIUM_AI = 60;
const FREE_LINKS = 2; // published portfolio links
const PREMIUM_LINKS = 100;
const DAY = 86400000;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,38}[a-z0-9]$/;
const RESERVED = new Set(["admin", "api", "app", "login", "signup", "forgot", "view", "p", "www", "portfolia", "help", "support"]);
const KINDS = ["update", "template", "feature", "premium", "info"];
const AUDIENCES = ["all", "premium", "admin"];

const slugify = (s) =>
  String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28) || "site";
const rand = (n = 4) => {
  const a = "abcdefghjkmnpqrstuvwxyz23456789";
  let o = "";
  for (let i = 0; i < n; i++) o += a[crypto.randomInt(0, a.length)];
  return o;
};

export function registerFeatureRoutes(app, { auth, db, authUser, requireAdmin, logEvent, isAdmin }) {
  const cache = new Map();
  const unauth = (res) => res.status(401).json({ message: "Please sign in again." });

  // ---------- plans (free / premium), switched on by the admin ----------
  async function getPlan(uid) {
    const hit = cache.get(uid);
    if (hit && Date.now() - hit.at < 30000) return hit.v;
    const snap = await db.collection("users").doc(uid).get();
    const d = snap.exists ? snap.data() : {};
    const active = d.plan === "premium" && (!d.premiumUntil || d.premiumUntil > Date.now());
    const v = { premium: active, premiumUntil: active ? d.premiumUntil || 0 : 0 };
    cache.set(uid, { v, at: Date.now() });
    return v;
  }
  app.locals.aiLimit = async (uid) => ((await getPlan(uid)).premium ? PREMIUM_AI : FREE_AI);

  app.get("/api/me", async (req, res) => {
    try {
      const u = await authUser(req);
      const p = await getPlan(u.uid);
      res.json({ plan: p.premium ? "premium" : "free", premiumUntil: p.premiumUntil, admin: isAdmin(u.email), maxLinks: p.premium ? PREMIUM_LINKS : FREE_LINKS });
    } catch {
      unauth(res);
    }
  });

  app.post("/api/premium/request", async (req, res) => {
    let u;
    try { u = await authUser(req); } catch { return unauth(res); }
    try {
      if ((await getPlan(u.uid)).premium) return res.json({ message: "You already have Premium." });
      const ref = db.collection("users").doc(u.uid);
      const s = await ref.get();
      const last = s.exists ? s.data().premiumRequestedAt || 0 : 0;
      if (Date.now() - last < DAY) return res.json({ message: "We already have your request. We will notify you here." });
      await ref.set({ email: u.email || "", premiumRequestedAt: Date.now() }, { merge: true });
      await db.collection("notifications").add({
        audience: "admin", kind: "premium", title: "Premium request",
        body: `${u.email || u.uid} asked for Premium access.`, ts: Date.now(),
      });
      await logEvent("premium_requested", u);
      res.json({ message: "Request sent. We will notify you here when it is ready." });
    } catch (e) {
      console.error("PREMIUM REQUEST ERROR:", e.message);
      res.status(500).json({ message: "Could not send your request. Please try again." });
    }
  });

  // ---------- published portfolio links ----------
  app.post("/api/portfolios/publish", async (req, res) => {
    let user;
    try { user = await authUser(req); } catch { return unauth(res); }
    try {
      const p = req.body?.portfolio;
      if (!p || typeof p !== "object" || Array.isArray(p)) return res.status(400).json({ message: "Nothing to publish." });
      if (JSON.stringify(p).length > 60000) return res.status(413).json({ message: "This portfolio is too large to publish." });

      const plan = await getPlan(user.uid);
      const premium = plan.premium;
      if (!FREE_TEMPLATES.includes(p.template) && !premium) return res.status(403).json({ message: "This template is part of Premium." });

      const sites = db.collection("sites");
      const existing = String(req.body?.slug || "").toLowerCase();
      const custom = String(req.body?.customSlug || "").trim().toLowerCase();
      let slug = "";
      let views = 0;
      let createdAt = Date.now();

      if (existing) {
        const s = await sites.doc(existing).get();
        if (s.exists && s.data().ownerUid === user.uid) {
          slug = existing; views = s.data().views || 0; createdAt = s.data().createdAt || createdAt;
        }
      }
      if (!slug) {
        const mine = await sites.where("ownerUid", "==", user.uid).get();
        const max = premium ? PREMIUM_LINKS : FREE_LINKS;
        if (mine.docs.length >= max) {
          return res.status(403).json({
            message: premium
              ? `You reached the limit of ${max} published portfolios.`
              : `You reached the free limit of ${max} published portfolios. Premium lets you publish more.`,
          });
        }
      }
      if (custom && custom !== slug) {
        if (!premium) return res.status(403).json({ message: "Custom links are part of Premium." });
        if (!SLUG_RE.test(custom) || RESERVED.has(custom)) return res.status(400).json({ message: "Use 4 to 40 letters, numbers or hyphens for the link." });
        const taken = await sites.doc(custom).get();
        if (taken.exists && taken.data().ownerUid !== user.uid) return res.status(409).json({ message: "That link name is taken. Try another." });
        if (slug) await sites.doc(slug).delete();
        slug = custom;
      }
      if (!slug) {
        const base = slugify(p.name);
        for (let i = 0; i < 6 && !slug; i++) {
          const c = `${base}-${rand()}`;
          if (!(await sites.doc(c).get()).exists) slug = c;
        }
        if (!slug) throw new Error("no slug");
      }

      await sites.doc(slug).set({ ownerUid: user.uid, email: user.email || "", data: { ...p, id: "" }, views, createdAt, updatedAt: Date.now() });
      await logEvent("portfolio_published", user, { template: String(p.template || "").slice(0, 30), kind: String(p.kind || "").slice(0, 30) });
      res.json({ slug });
    } catch (e) {
      console.error("PUBLISH ERROR:", e.message);
      res.status(500).json({ message: "Could not publish right now. Please try again." });
    }
  });

  app.post("/api/portfolios/unpublish", async (req, res) => {
    let user;
    try { user = await authUser(req); } catch { return unauth(res); }
    try {
      const ref = db.collection("sites").doc(String(req.body?.slug || "").toLowerCase());
      const s = await ref.get();
      if (s.exists && s.data().ownerUid === user.uid) await ref.delete();
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Could not remove the link." });
    }
  });

  app.get("/api/public/p/:slug", async (req, res) => {
    try {
      const ref = db.collection("sites").doc(String(req.params.slug || "").toLowerCase());
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ message: "This portfolio does not exist or was removed." });
      const d = snap.data();
      try { await ref.update({ views: (d.views || 0) + 1 }); } catch { /* views are best effort */ }
      res.json({ data: d.data, branding: !(await getPlan(d.ownerUid)).premium });
    } catch (e) {
      console.error("PUBLIC READ ERROR:", e.message);
      res.status(500).json({ message: "Could not load this portfolio." });
    }
  });

  // ---------- notifications ----------
  app.get("/api/notifications", async (req, res) => {
    let user;
    try { user = await authUser(req); } catch { return unauth(res); }
    try {
      const premium = (await getPlan(user.uid)).premium;
      const admin = isAdmin(user.email);
      const snap = await db.collection("notifications").orderBy("ts", "desc").limit(80).get();
      const visible = (n) => {
        if (n.toUid) return n.toUid === user.uid;
        if (admin) return true;
        return n.audience === "all" || (n.audience === "premium" && premium);
      };
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(visible)
        .slice(0, 40)
        .map((n) => ({ id: n.id, title: n.title, body: n.body || "", kind: n.kind, ts: n.ts }));

      const uref = db.collection("users").doc(user.uid);
      const us = await uref.get();
      let seen = us.exists ? us.data().notifSeen : 0;
      if (!seen) {
        seen = Date.now(); // new accounts start with nothing unread
        await uref.set({ email: user.email || "", notifSeen: seen }, { merge: true });
      }
      res.json({ items, unread: items.filter((n) => n.ts > seen).length, seen });
    } catch (e) {
      console.error("NOTIFICATIONS ERROR:", e.message);
      res.status(500).json({ message: "Could not load notifications." });
    }
  });

  app.post("/api/notifications/read", async (req, res) => {
    let user;
    try { user = await authUser(req); } catch { return unauth(res); }
    try {
      await db.collection("users").doc(user.uid).set({ notifSeen: Date.now() }, { merge: true });
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Could not save." });
    }
  });

  // ---------- admin ----------
  app.post("/api/admin/notify", requireAdmin, async (req, res) => {
    try {
      const title = String(req.body?.title || "").trim().slice(0, 80);
      const body = String(req.body?.body || "").trim().slice(0, 400);
      const kind = KINDS.includes(req.body?.kind) ? req.body.kind : "info";
      const audience = AUDIENCES.includes(req.body?.audience) ? req.body.audience : "all";
      if (!title) return res.status(400).json({ message: "Add a title." });
      const ref = await db.collection("notifications").add({ title, body, kind, audience, ts: Date.now() });
      await logEvent("admin_notification", req.admin, { kind, audience });
      res.json({ id: ref.id });
    } catch (e) {
      console.error("NOTIFY ERROR:", e.message);
      res.status(500).json({ message: "Could not send the notification." });
    }
  });

  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const snap = await db.collection("notifications").orderBy("ts", "desc").limit(60).get();
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((n) => !n.toUid)
        .map((n) => ({ id: n.id, title: n.title, body: n.body || "", kind: n.kind, audience: n.audience, ts: n.ts }));
      res.json({ items });
    } catch (e) {
      console.error("ADMIN NOTIFS ERROR:", e.message);
      res.status(500).json({ message: "Could not load notifications." });
    }
  });

  app.post("/api/admin/notify/delete", requireAdmin, async (req, res) => {
    try {
      await db.collection("notifications").doc(String(req.body?.id || "")).delete();
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Could not delete it." });
    }
  });

  // Same as the older users route, plus each person's plan. Registered first, so it wins.
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const list = await auth.listUsers(1000);
      const snap = await db.collection("users").limit(1000).get().catch(() => ({ docs: [] }));
      const info = {};
      snap.docs.forEach((d) => { info[d.id] = d.data(); });
      const toMs = (s) => (s ? Date.parse(s) || 0 : 0);
      const users = list.users
        .map((u) => {
          const x = info[u.uid] || {};
          const active = x.plan === "premium" && (!x.premiumUntil || x.premiumUntil > Date.now());
          return {
            uid: u.uid, email: u.email || "", name: u.displayName || "",
            created: toMs(u.metadata.creationTime), lastSignIn: toMs(u.metadata.lastSignInTime),
            disabled: u.disabled, admin: isAdmin(u.email),
            plan: active ? "premium" : "free", premiumUntil: active ? x.premiumUntil || 0 : 0,
            premiumRequested: x.premiumRequestedAt || 0,
          };
        })
        .sort((a, b) => b.created - a.created);
      res.json({ users });
    } catch (e) {
      console.error("ADMIN USERS ERROR:", e);
      res.status(500).json({ message: "Could not load users." });
    }
  });

  app.post("/api/admin/users/plan", requireAdmin, async (req, res) => {
    try {
      const { uid, plan, days } = req.body || {};
      if (typeof uid !== "string" || !["premium", "free"].includes(plan)) return res.status(400).json({ message: "Invalid request." });
      const premiumUntil = plan === "premium" && Number(days) > 0 ? Date.now() + Math.min(Number(days), 3650) * DAY : 0;
      let email = "";
      try { email = (await auth.getUser(uid)).email || ""; } catch { /* ignore */ }
      await db.collection("users").doc(uid).set({ email, plan, premiumUntil, planUpdatedAt: Date.now() }, { merge: true });
      cache.delete(uid);
      await db.collection("notifications").add({
        toUid: uid, audience: "user", kind: "premium", ts: Date.now(),
        title: plan === "premium" ? "Premium unlocked" : "Premium ended",
        body: plan === "premium"
          ? "All Premium features are now on for your account." + (premiumUntil ? ` Valid until ${new Date(premiumUntil).toDateString()}.` : "")
          : "Your account is back on the free plan.",
      });
      await logEvent(plan === "premium" ? "admin_gave_premium" : "admin_removed_premium", req.admin, { target: email || uid, days: Number(days) > 0 ? Number(days) : 0 });
      res.json({ ok: true, premiumUntil });
    } catch (e) {
      console.error("PLAN ERROR:", e.message);
      res.status(500).json({ message: "Could not change the plan." });
    }
  });
}
