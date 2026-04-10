import { useEffect, useState } from "react";
import type { ServerInfo } from "../types";

interface Props {
  refreshKey: number;
  onSelectServer: (name: string) => void;
}

export default function ServerList({ refreshKey, onSelectServer }: Props) {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServers = () => {
    setLoading(true);
    fetch("/api/servers")
      .then((r) => r.json())
      .then((data) => setServers(data))
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServers();
  }, [refreshKey]);

  const handleRemove = async (name: string) => {
    if (!confirm(`Remove server "${name}" from configuration?`)) return;

    try {
      const res = await fetch(`/api/servers/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to remove server");
        return;
      }
      fetchServers();
    } catch {
      alert("Failed to remove server");
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Active Servers</h2>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Active Servers</h2>
      {servers.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No MCP servers configured. Add one above.
        </p>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => (
            <div
              key={server.name}
              className="bg-gray-700 rounded p-3 flex items-center justify-between"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onSelectServer(server.name)}
              >
                <div className="text-white font-medium">{server.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  <span className="mr-4">Image: {server.image}</span>
                  {server.volumePath && (
                    <span>Volume: {server.volumePath}</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(server.name);
                }}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded hover:bg-gray-600 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
