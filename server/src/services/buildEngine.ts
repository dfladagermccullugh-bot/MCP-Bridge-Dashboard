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
  dir: string
): Promise<string | null> {
  // Breadth-first search for Dockerfile
  const queue = [dir];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = await fs.promises.readdir(current, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (entry.name === "Dockerfile" && entry.isFile()) {
        return current;
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

  return null;
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
