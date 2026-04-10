import fs from "node:fs";
import path from "node:path";
import type { ClaudeConfig, McpServerEntry, ServerInfo } from "../types.js";
import { normalizeWindowsPath, buildVolumeArg } from "./pathUtils.js";

const PROTECTED_KEYS = ["MCP_DOCKER"];

function getConfigPath(): string {
  const override = process.env.CLAUDE_CONFIG_PATH;
  if (override) return override;

  const appData = process.env.APPDATA;
  if (!appData) {
    throw new Error(
      "APPDATA environment variable not set. Set CLAUDE_CONFIG_PATH for non-Windows environments."
    );
  }
  return path.join(appData, "Claude", "claude_desktop_config.json");
}

function backup(): void {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const bakPath = `${configPath}.${timestamp}.bak`;
  fs.copyFileSync(configPath, bakPath);
}

export function readConfig(): ClaudeConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return { mcpServers: {} };
  }
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as ClaudeConfig;
}

export function writeConfig(config: ClaudeConfig): void {
  backup();
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function addServer(
  name: string,
  volumePath: string,
  imageName: string
): void {
  const config = readConfig();
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  const normalizedVolume = buildVolumeArg(volumePath);

  const entry: McpServerEntry = {
    command: "docker",
    args: [
      "run",
      "--rm",
      "-i",
      "-e",
      "PYTHONUNBUFFERED=1",
      "-v",
      normalizedVolume,
      imageName,
    ],
  };

  config.mcpServers[name] = entry;
  writeConfig(config);
}

export function removeServer(name: string): void {
  if (PROTECTED_KEYS.includes(name)) {
    throw new Error(`Cannot remove protected server: ${name}`);
  }

  const config = readConfig();
  if (!config.mcpServers || !(name in config.mcpServers)) {
    throw new Error(`Server "${name}" not found in configuration`);
  }

  delete config.mcpServers[name];
  writeConfig(config);
}

export function listServers(): ServerInfo[] {
  const config = readConfig();
  if (!config.mcpServers) return [];

  return Object.entries(config.mcpServers).map(([name, entry]) => {
    let image = "";
    let volumePath: string | null = null;

    const args = entry.args || [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-v" && i + 1 < args.length) {
        const parts = args[i + 1].split(":");
        if (parts.length >= 2) {
          volumePath = parts[0];
        }
      }
    }

    // Image is typically the last argument
    const lastArg = args[args.length - 1];
    if (lastArg && !lastArg.startsWith("-")) {
      image = lastArg;
    }

    return { name, image, volumePath };
  });
}
