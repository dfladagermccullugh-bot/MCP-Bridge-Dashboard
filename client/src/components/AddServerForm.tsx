import { useState } from "react";
import type { BuildRequest } from "../types";

interface Props {
  onBuild: (req: BuildRequest) => void;
}

export default function AddServerForm({ onBuild }: Props) {
  const [repoUrl, setRepoUrl] = useState("");
  const [serverName, setServerName] = useState("");
  const [volumePath, setVolumePath] = useState("");
  const [dockerCommand, setDockerCommand] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl || !serverName || !volumePath) return;
    onBuild({
      repoUrl,
      serverName,
      volumePath,
      ...(dockerCommand ? { dockerCommand } : {}),
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Add New MCP Server</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Repository URL</label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/microsoft/markitdown"
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Server Name</label>
          <input
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            placeholder="markitdown"
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Local Volume Mount Path</label>
          <input
            type="text"
            value={volumePath}
            onChange={(e) => setVolumePath(e.target.value)}
            placeholder="C:\Users\you\Documents\project"
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Docker Command <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={dockerCommand}
            onChange={(e) => setDockerCommand(e.target.value)}
            placeholder="e.g. python -m markitdown.mcp"
            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Override the container's default entrypoint. Leave blank if the Dockerfile already sets the correct CMD.
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Build &amp; Install
        </button>
      </form>
    </div>
  );
}
