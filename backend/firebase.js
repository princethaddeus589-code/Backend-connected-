import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

const app = initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth(app);

export { auth };
