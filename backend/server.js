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

      // Config problems are not the user's fault - show them clearly
      if (code.startsWith("API_KEY") || code === "OPERATION_NOT_ALLOWED") {
        return res.status(500).json({ message: "Server config error: " + code });
      }
      if (code === "EMAIL_NOT_FOUND") {
        return res.status(401).json({ message: "No account found with this email" });
      }
            return res.status(401).json({ message: "Email or password is incorrect (" + code + ")" });
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
