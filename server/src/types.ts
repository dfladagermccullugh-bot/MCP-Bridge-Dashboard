import { z } from "zod";

export interface McpServerEntry {
  command: string;
  args: string[];
}

export interface ClaudeConfig {
  mcpServers?: Record<string, McpServerEntry>;
  [key: string]: unknown;
}

export const BuildRequestSchema = z.object({
  repoUrl: z
    .string()
    .url()
    .refine((u) => u.includes("github.com"), "Must be a GitHub URL"),
  serverName: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_-]+$/i, "Alphanumeric, hyphens, underscores only"),
  volumePath: z.string().min(1),
  dockerCommand: z.string().optional(),
});

export type BuildRequest = z.infer<typeof BuildRequestSchema>;

export interface ServerInfo {
  name: string;
  image: string;
  volumePath: string | null;
}
