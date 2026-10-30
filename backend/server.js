import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Portfolia Auth API is running",
    routes: {
      signup: "POST /api/signup",
      signin: "POST /api/signin",
    },
  });
});

app.use("/api", authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
