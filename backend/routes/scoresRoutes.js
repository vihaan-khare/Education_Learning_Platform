import express from "express";
import { storeScore } from "../controllers/scoresController.js";

const router = express.Router();

router.post("/", storeScore);

export default router;
