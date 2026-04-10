import { useState } from "react";

interface Props {
  serverName: string;
  onClose: () => void;
}

export default function PromptGuide({ serverName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const prompt = `Please call the ${serverName} tool. Pass 'file:///workdir/<filename>' as the URI parameter. CRITICAL: Do not attempt to read, verify, or locate this file yourself using your native bash tools or Python. The file is securely mounted inside the tool's container. Pass the URI directly to the tool.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">
            Usage Guide: {serverName}
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-400">
            Copy the prompt below and paste it into Claude to use this MCP server:
          </p>
          <div className="bg-gray-900 rounded p-3 text-sm text-gray-200 font-mono leading-relaxed">
            {prompt}
          </div>
          <button
            onClick={handleCopy}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
        </div>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
