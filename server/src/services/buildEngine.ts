import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export async function checkDocker(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("docker", ["info"], { stdio: "pipe" });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

export async function cloneRepo(
  url: string,
  onLog: (line: string) => void
): Promise<string> {
  const tmpDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "mcp-bridge-")
  );

  return new Promise((resolve, reject) => {
    onLog(`Cloning ${url} ...`);
    const proc = spawn("git", ["clone", "--depth", "1", url, tmpDir], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    proc.stdout.on("data", (data: Buffer) => {
      data
        .toString()
        .split("\n")
        .filter(Boolean)
        .forEach((line) => onLog(line));
    });

    proc.stderr.on("data", (data: Buffer) => {
      data
        .toString()
        .split("\n")
        .filter(Boolean)
        .forEach((line) => onLog(line));
    });

    proc.on("close", (code) => {
      if (code === 0) {
        onLog("Clone complete.");
        resolve(tmpDir);
      } else {
        reject(new Error(`git clone exited with code ${code}`));
      }
    });

    proc.on("error", (err) => reject(err));
  });
}

export async function findDockerfile(
  dir: string,
  serverName?: string
): Promise<string | null> {
  // Collect ALL Dockerfiles in the repo, then pick the best match
  const found: string[] = [];
  const queue = [dir];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = await fs.promises.readdir(current, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (entry.name === "Dockerfile" && entry.isFile()) {
        found.push(current);
      }
    }

    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules"
      ) {
        queue.push(path.join(current, entry.name));
      }
    }
  }

  if (found.length === 0) return null;
  if (found.length === 1) return found[0];

  // Score each Dockerfile location for MCP relevance
  const name = serverName?.toLowerCase() ?? "";
  const scored = found.map((dockerfileDir) => {
    const relative = path.relative(dir, dockerfileDir).toLowerCase();
    let score = 0;

    const hasMcp = relative.includes("mcp");
    const hasName = name && relative.includes(name);

    if (hasMcp && hasName) score = 3; // e.g. packages/markitdown-mcp/
    else if (hasMcp) score = 2;       // e.g. packages/some-mcp/
    else if (hasName) score = 1;      // e.g. packages/markitdown/
    // root Dockerfile stays at score 0

    return { dockerfileDir, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].dockerfileDir;
}

export async function buildImage(
  dockerfileDir: string,
  imageName: string,
  onLog: (line: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    onLog(`Building image ${imageName} from ${dockerfileDir} ...`);
    const proc = spawn("docker", ["build", "-t", imageName, "."], {
      cwd: dockerfileDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    proc.stdout.on("data", (data: Buffer) => {
      data
        .toString()
        .split("\n")
        .filter(Boolean)
        .forEach((line) => onLog(line));
    });

    proc.stderr.on("data", (data: Buffer) => {
      data
        .toString()
        .split("\n")
        .filter(Boolean)
        .forEach((line) => onLog(line));
    });

    proc.on("close", (code) => {
      if (code === 0) {
        onLog("Build complete!");
        resolve();
      } else {
        reject(new Error(`docker build exited with code ${code}`));
      }
    });

    proc.on("error", (err) => reject(err));
  });
}
