import { useEffect, useState } from "react";

export default function SystemStatus() {
  const [dockerOk, setDockerOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/system/check")
      .then((r) => r.json())
      .then((data) => setDockerOk(data.docker))
      .catch(() => setDockerOk(false));
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`inline-block w-3 h-3 rounded-full ${
          dockerOk === null
            ? "bg-gray-400"
            : dockerOk
              ? "bg-green-500"
              : "bg-red-500"
        }`}
      />
      <span className="text-gray-300">
        Docker: {dockerOk === null ? "Checking..." : dockerOk ? "Running" : "Not Running"}
      </span>
    </div>
  );
}
