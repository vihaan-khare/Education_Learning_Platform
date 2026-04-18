import express from "express";
import cors from "cors";
import levelsRoutes from "./routes/levelsRoutes.js";
import scoresRoutes from "./routes/scoresRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", module: "NeuroLearn Play" });
});

app.use("/api/levels", levelsRoutes);
app.use("/api/scores", scoresRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.listen(PORT, () => {
  console.log(`NeuroLearn Play backend running on port ${PORT}`);
});
