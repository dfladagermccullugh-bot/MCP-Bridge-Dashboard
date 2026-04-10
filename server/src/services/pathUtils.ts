/**
 * Converts all backslashes to forward slashes for safe use in JSON and Docker volume args.
 */
export function normalizeWindowsPath(p: string): string {
  return p.replace(/\\/g, "/");
}

/**
 * Builds a Docker -v volume argument string with normalized paths.
 * Example: "C:/Users/me/docs:/workdir"
 */
export function buildVolumeArg(
  windowsPath: string,
  containerPath: string = "/workdir"
): string {
  return `${normalizeWindowsPath(windowsPath)}:${containerPath}`;
}
