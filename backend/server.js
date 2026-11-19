import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

    res.json({
      message: "Sign in successful",
      uid: data.localId,
      name,
      email: data.email,
      token: data.idToken,
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

app.post("/api/ai/write", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Please sign in again." });

    let uid;
    try {
      uid = (await auth.verifyIdToken(token)).uid;
    } catch {
      return res.status(401).json({ message: "Your session expired. Please sign out and sign in again." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "AI is not set up yet. Add GEMINI_API_KEY on the server." });
    }

    const { tool, input, tone } = req.body || {};
    if (!AI_TASKS[tool] || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({ message: "Please add some notes first." });
    }

    const now = Date.now();
    const hits = (AI_HITS.get(uid) || []).filter((t) => now - t < 3600000);
    if (hits.length >= 20) {
      return res.status(429).json({ message: "You reached the hourly AI limit. Try again later." });
    }
    hits.push(now);
    AI_HITS.set(uid, hits);

    const safeTone = ["Professional", "Friendly", "Confident"].includes(tone) ? tone : "Professional";
    const model = process.env.AI_MODEL || "gemini-2.5-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: AI_SYSTEM }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${AI_TASKS[tool]}\nTone: ${safeTone}\n\nUser details:\n${input.trim().slice(0, 2000)}`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || String(response.status);
      console.error("AI ERROR:", response.status, msg);
      if (response.status === 429) {
        return res.status(429).json({ message: "The free AI limit was reached for now. Please try again in a minute." });
      }
      if (response.status === 404) {
        return res.status(502).json({ message: "AI model not found. Set AI_MODEL to a model listed in Google AI Studio." });
      }
      if (response.status === 400 || response.status === 403) {
        return res.status(502).json({ message: "AI key problem. Check GEMINI_API_KEY on the server." });
      }
      return res.status(502).json({ message: "The AI service could not answer right now. Please try again." });
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();

    if (!text) {
      return res.status(502).json({ message: "The AI returned no text. Try rephrasing your notes." });
    }

    res.json({ text });
  } catch (error) {
    console.error("AI ROUTE ERROR:", error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
