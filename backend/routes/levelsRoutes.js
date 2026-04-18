import express from "express";
import { fetchLevels } from "../controllers/levelsController.js";

const router = express.Router();

router.get("/", fetchLevels);

export default router;
