import { useState } from "react";
import SystemStatus from "./components/SystemStatus";
import AddServerForm from "./components/AddServerForm";
import ServerList from "./components/ServerList";
import BuildModal from "./components/BuildModal";
import PromptGuide from "./components/PromptGuide";
import type { BuildRequest } from "./types";

export default function App() {
  const [buildRequest, setBuildRequest] = useState<BuildRequest | null>(null);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">MCP Bridge Dashboard</h1>
        <SystemStatus />
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <AddServerForm onBuild={(req) => setBuildRequest(req)} />
        <ServerList
          refreshKey={refreshKey}
          onSelectServer={(name) => setSelectedServer(name)}
        />
      </main>

      {buildRequest && (
        <BuildModal
          request={buildRequest}
          onClose={() => setBuildRequest(null)}
          onComplete={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {selectedServer && (
        <PromptGuide
          serverName={selectedServer}
          onClose={() => setSelectedServer(null)}
        />
      )}
    </div>
  );
}
