# MCP Bridge Dashboard

A local web dashboard that automates the installation, Docker building, and configuration of [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers for **Claude Desktop** and **Claude Code** on Windows.

## Problem

Setting up MCP servers on Windows involves recurring friction:

- **Path translation errors** — Windows backslashes (`\`) in Docker volume mounts break Claude's JSON parser or Docker itself.
- **Python buffering timeouts** — Python-based MCP servers buffer stdout, causing Claude Desktop to time out waiting for responses.
- **Manual JSON editing** — Hand-editing `claude_desktop_config.json` leads to syntax errors and accidental overwrites.

MCP Bridge Dashboard eliminates all three by providing a point-and-click interface with built-in guardrails.

## Features

- **One-click Build & Install** — Paste a GitHub repo URL, pick a name, and the dashboard clones, finds the Dockerfile, builds the image, and writes the config entry automatically.
- **Real-time build streaming** — Watch Docker build logs live in a terminal-style modal via Server-Sent Events.
- **Safe config management** — Reads and writes `claude_desktop_config.json` with automatic `.bak` backups before every mutation.
- **Active server management** — View all installed MCP servers, see their Docker images and mounted volumes, and remove entries with one click.
- **Prompt generator** — Copy-paste usage prompts with the correct `file:///workdir/...` URI format for each server.

### Built-in Guardrails

| Guardrail | What it does |
|-----------|-------------|
| Forward-slash normalization | Converts all `\` to `/` in paths written to the Claude config JSON |
| `PYTHONUNBUFFERED=1` | Automatically injected into every server's Docker run args |
| `MCP_DOCKER` protection | The Docker Desktop gateway entry is never modified or deleted |
| Config backup | A timestamped `.bak` copy is created before every config write |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, Vite, TailwindCSS |
| Validation | Zod |
| System | Docker CLI, Git CLI via `child_process` |

## Project Structure

```
├── server/                    # Express backend
│   └── src/
│       ├── index.ts           # App entry point (port 3001)
│       ├── routes/
│       │   ├── config.ts      # GET/PUT /api/config
│       │   ├── servers.ts     # GET/POST/DELETE /api/servers
│       │   └── system.ts      # GET /api/system/check
│       ├── services/
│       │   ├── configManager.ts   # Config read/write/backup/mutate
│       │   ├── buildEngine.ts     # Git clone, Dockerfile finder, Docker build
│       │   └── pathUtils.ts       # Windows path normalization
│       └── types.ts
└── client/                    # React frontend
    └── src/
        ├── App.tsx
        └── components/
            ├── AddServerForm.tsx  # Repo URL, name, volume path form
            ├── BuildModal.tsx     # Live build log terminal
            ├── ServerList.tsx     # Active servers with remove
            ├── PromptGuide.tsx    # Usage prompt generator
            └── SystemStatus.tsx   # Docker status indicator
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- [Git](https://git-scm.com/)

### Installation

```bash
git clone https://github.com/dfladagermccullugh-bot/MCP-Bridge-Dashboard.git
cd MCP-Bridge-Dashboard

# Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Development

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently. The Vite dev server proxies `/api` requests to the Express backend.

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Configuration

By default the backend looks for the Claude Desktop config at `%APPDATA%\Claude\claude_desktop_config.json`. To override (e.g. for development on Linux/macOS):

```bash
CLAUDE_CONFIG_PATH=/path/to/claude_desktop_config.json npm run dev:server
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/system/check` | Check if Docker is running |
| `GET` | `/api/config` | Read Claude Desktop config |
| `PUT` | `/api/config` | Write Claude Desktop config |
| `GET` | `/api/servers` | List installed MCP servers |
| `POST` | `/api/servers/build` | Build & install a server (SSE stream) |
| `DELETE` | `/api/servers/:name` | Remove a server from config |

## License

[AGPL-3.0](LICENSE)
