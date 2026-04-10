import { Router } from "express";
import { readConfig, writeConfig } from "../services/configManager.js";

const router = Router();

router.get("/", (_req, res) => {
  try {
    const config = readConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", (req, res) => {
  try {
    writeConfig(req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
