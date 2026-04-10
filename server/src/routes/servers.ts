import { Router } from "express";
import {
  listServers,
  addServer,
  removeServer,
} from "../services/configManager.js";
import {
  checkDocker,
  cloneRepo,
  findDockerfile,
  buildImage,
} from "../services/buildEngine.js";
import { BuildRequestSchema } from "../types.js";

const router = Router();

router.get("/", (_req, res) => {
  try {
    const servers = listServers();
    res.json(servers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:name", (req, res) => {
  try {
    removeServer(req.params.name);
    res.json({ success: true });
  } catch (err: any) {
    const status = err.message.includes("protected") ? 403 : 404;
    res.status(status).json({ error: err.message });
  }
});

// SSE endpoint for build + install
router.post("/build", async (req, res) => {
  // Validate input
  const parsed = BuildRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { repoUrl, serverName, volumePath } = parsed.data;
  const imageName = `${serverName}-mcp:latest`;

  // Set up SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const sendEvent = (type: string, data: string) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Check Docker
    const dockerOk = await checkDocker();
    if (!dockerOk) {
      sendEvent("error", "Docker is not running. Please start Docker Desktop.");
      res.end();
      return;
    }
    sendEvent("status", "Docker is running.");

    // Clone
    sendEvent("status", "Cloning repository...");
    const cloneDir = await cloneRepo(repoUrl, (line) =>
      sendEvent("log", line)
    );

    // Find Dockerfile
    sendEvent("status", "Locating Dockerfile...");
    const dockerfileDir = await findDockerfile(cloneDir);
    if (!dockerfileDir) {
      sendEvent("error", "No Dockerfile found in the repository.");
      res.end();
      return;
    }
    sendEvent("status", `Found Dockerfile in ${dockerfileDir}`);

    // Build
    sendEvent("status", "Building Docker image...");
    await buildImage(dockerfileDir, imageName, (line) =>
      sendEvent("log", line)
    );

    // Update config
    sendEvent("status", "Updating Claude configuration...");
    addServer(serverName, volumePath, imageName);
    sendEvent("status", "Configuration updated successfully!");

    sendEvent("complete", `Server "${serverName}" installed successfully!`);
  } catch (err: any) {
    sendEvent("error", err.message || "An unknown error occurred.");
  } finally {
    res.end();
  }
});

export default router;
