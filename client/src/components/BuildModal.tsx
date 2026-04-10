import { useEffect, useRef, useState } from "react";
import type { BuildRequest } from "../types";

interface Props {
  request: BuildRequest;
  onClose: () => void;
  onComplete: () => void;
}

export default function BuildModal({ request, onClose, onComplete }: Props) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"building" | "success" | "error">("building");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/servers/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              setLogs((prev) => [...prev, data]);
            } else if (line.startsWith("event: error")) {
              setStatus("error");
            } else if (line.startsWith("event: complete")) {
              setStatus("success");
              onComplete();
            }
          }
        }

        if (status === "building") {
          setStatus("success");
          onComplete();
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setLogs((prev) => [...prev, `Error: ${err.message}`]);
          setStatus("error");
        }
      }
    })();

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">
            Building: {request.serverName}
          </h3>
          <span
            className={`text-sm px-2 py-1 rounded ${
              status === "building"
                ? "bg-yellow-600 text-yellow-100"
                : status === "success"
                  ? "bg-green-600 text-green-100"
                  : "bg-red-600 text-red-100"
            }`}
          >
            {status === "building" ? "In Progress" : status === "success" ? "Complete" : "Failed"}
          </span>
        </div>
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-xs text-green-400 bg-gray-900 space-y-0.5"
        >
          {logs.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {status === "building" && (
            <div className="text-gray-500 animate-pulse">Waiting for output...</div>
          )}
        </div>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={status === "building"}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2 px-4 rounded transition-colors"
          >
            {status === "building" ? "Building..." : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
