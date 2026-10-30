import { auth } from "../firebase.js";

// SIGN UP — creates user with Firebase Admin
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
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
    console.error("Signup error:", error.code || error.message);

    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        message: "This email is already registered",
      });
    }

    return res.status(400).json({
      message: "Unable to create account",
    });
  }
};

// SIGN IN — accepts either Firebase idToken OR email+password
export const signin = async (req, res) => {
  try {
    const { idToken, email, password } = req.body || {};

    // Path A: client already has a Firebase ID token
    if (idToken) {
      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await auth.getUser(decodedToken.uid);

      return res.status(200).json({
        message: "Sign in successful",
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        token: idToken,
      });
    }

    // Path B: email + password via Firebase Auth REST API
    if (email && password) {
      const apiKey = process.env.FIREBASE_WEB_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          message:
            "FIREBASE_WEB_API_KEY is not set on the server. Add it to enable email/password sign-in.",
        });
      }

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(email).trim().toLowerCase(),
            password: String(password),
            returnSecureToken: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const code = data?.error?.message || "";
        if (
          code.includes("INVALID_PASSWORD") ||
          code.includes("EMAIL_NOT_FOUND") ||
          code.includes("INVALID_LOGIN_CREDENTIALS")
        ) {
          return res.status(401).json({
            message: "Email or password is incorrect",
          });
        }
        return res.status(401).json({
          message: data?.error?.message || "Sign in failed",
        });
      }

      let displayName = data.displayName || "";
      try {
        const user = await auth.getUser(data.localId);
        displayName = user.displayName || displayName;
      } catch {
        // ignore
      }

      return res.status(200).json({
        message: "Sign in successful",
        uid: data.localId,
        name: displayName || String(email).split("@")[0],
        email: data.email,
        token: data.idToken,
      });
    }

    return res.status(400).json({
      message: "Provide either idToken or email and password",
    });
  } catch (error) {
    console.error("Signin error:", error.code || error.message);
    return res.status(401).json({
      message: "Invalid or expired authentication",
    });
  }
};
