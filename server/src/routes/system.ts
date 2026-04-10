import { Router } from "express";
import { checkDocker } from "../services/buildEngine.js";

const router = Router();

router.get("/check", async (_req, res) => {
  const dockerRunning = await checkDocker();
  res.json({ docker: dockerRunning });
});

export default router;
