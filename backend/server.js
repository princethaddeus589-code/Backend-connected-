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
  // For production (Render/Railway) - use environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // For local development - use the JSON file
    serviceAccount = (await import("./serviceAccountKey.json", { with: { type: "json" } })).default;
  }
} catch (err) {
  console.error("Firebase credentials missing. Add serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env variable.");
  process.exit(1);
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
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await auth.createUser({
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    res.status(201).json({
      message: "Account created successfully",
      uid: user.uid,
      name: user.displayName,
      email: user.email,
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ message: "This email is already registered" });
    }
    console.error(error);
    res.status(400).json({ message: "Unable to create account" });
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

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
