# 🔴 Redlib MCP Server

[![Docker Pulls](https://img.shields.io/docker/pulls/alfafadock/mcp-redlib?label=docker%20pulls)](https://hub.docker.com/r/alfafadock/mcp-redlib)
[![Docker Image Size](https://img.shields.io/docker/image-size/alfafadock/mcp-redlib/latest)](https://hub.docker.com/r/alfafadock/mcp-redlib)

A **Model Context Protocol (MCP) server** that enables AI agents to interact with Reddit through your private **Redlib** instance. No Reddit API keys required - just a running Redlib instance!

---

## 📑 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Available Tools](#️-available-tools)
- [Integration with AI Clients](#-integration-with-ai-clients)
  - [Claude Desktop](#claude-desktop)
  - [Cursor](#cursor)
  - [VS Code / GitHub Copilot](#vs-code--github-copilot)
  - [OpenAI Codex](#openai-codex)
  - [ForgeCode](#forgecode)
  - [KiloCode](#kilocode)
- [Docker Compose](#-docker-compose)
- [Security: Default vs Hardened](#-security-default-vs-hardened)
- [Development](#-development)
- [Example Usage with AI](#-example-usage-with-ai)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Links](#-links)

---


## ✨ Features

- 🔒 **Privacy-First** - Uses your self-hosted Redlib, no tracking or API keys
- 🛠️ **3 Powerful Tools** - Search posts, get hot posts, fetch full post details with comments
- 🐳 **Docker Ready** - Both simple and hardened Docker images available
- 🧩 **Easy Setup** - Works with Claude Desktop, Cursor, VS Code, Codex, ForgeCode, KiloCode and any MCP-compatible client
- 📊 **Structured Output** - Returns clean JSON instead of raw HTML

---

## 📋 Prerequisites

Before using this MCP server, you need:

1. **Redlib Instance** - A running Redlib instance (default: `http://localhost:8080`)
   - [Redlib GitHub](https://github.com/redlib-org/redlib)
   - [Redlib Docker Setup](https://github.com/redlib-org/redlib#docker)

2. **MCP Client** - One of:
   - [Claude Desktop](https://claude.ai/download)
   - [Cursor](https://cursor.sh/)
   - [VS Code](https://code.visualstudio.com/) with GitHub Copilot
   - [OpenAI Codex](https://openai.com/index/introducing-codex/)
   - [ForgeCode](https://github.com/tailcallhq/forgecode)
   - [KiloCode](https://kilo.ai/)

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Pull and run the default version
docker run -i --rm \
  --network host \
  -e REDLIB_URL=http://localhost:8080 \
  alfafadock/mcp-redlib:latest
```

### Option 2: Hardened Docker (Security-Focused)

```bash
# Uses non-root user and minimal privileges
docker run -i --rm \
  --network host \
  --cap-drop=ALL \
  --security-opt no-new-privileges:true \
  -e REDLIB_URL=http://localhost:8080 \
  alfafadock/mcp-redlib:hardened
```

### Option 3: Local Development

```bash
# Clone and setup
git clone https://github.com/Devthatdoes/redlib-mcp-server.git
cd redlib-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

---

## 🐳 Docker Compose

<details>
<summary>Click to expand Docker Compose setup</summary>

Create `docker-compose.yml`:

```yaml
# Redlib MCP Server - Production Setup
#
# USAGE:
#   docker compose up -d    # Start the service
#   docker compose logs -f  # View logs
#   docker compose down      # Stop the service
#
# FOR REVERSE PROXY (nginx, Traefik, Caddy):
#   This MCP server uses STDIO transport (not HTTP), so it doesn't need
#   traditional reverse proxy setup. The server communicates via
#   standard input/output when launched by an MCP client (Claude, Cursor, etc.)
#
# If you want to expose this as an HTTP endpoint (for remote clients),
# you would need an MCP-to-HTTP proxy like @modelcontextprotocol/server-http-proxy

services:
  redlib-mcp:
    image: alfafadock/mcp-redlib:latest
    container_name: redlib-mcp
    
    # NETWORK MODE:
    #   "host" = Uses host network (recommended for local MCP clients)
    #   Remove this line to use Docker's default bridge network
    network_mode: "host"
    
    # ENVIRONMENT VARIABLES:
    environment:
      # URL of your Redlib instance (change if using custom port)
      - REDLIB_URL=http://localhost:8080
      
      # Example: Custom Redlib port (e.g., 8085)
      # - REDLIB_URL=http://localhost:8085
      
      # Example: Remote Redlib instance
      # - REDLIB_URL=http://192.168.1.100:8080
    
    # RESTART POLICY:
    #   unless-stopped = Restart unless manually stopped
    #   always         = Always restart (even after manual stop + system reboot)
    restart: unless-stopped
    
    # RUNTIME SECURITY (Optional):
    # Uncomment below for hardened security:
    # cap_drop:
    #   - ALL
    # security_opt:
    #   - no-new-privileges:true
    # user: "1000:1000"  # Run as non-root user (requires image support)
```
</details>

---
---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDLIB_URL` | `http://localhost:8080` | URL of your Redlib instance |

### Custom Redlib Port Example

If your Redlib runs on a different port (e.g., 8085):

```bash
docker run -i --rm \
  --network host \
  -e REDLIB_URL=http://localhost:8085 \
  alfafadock/mcp-redlib:latest
```

### Example `.env` File

Copy `.env.example` to `.env` and modify as needed:

```bash
cp .env.example .env
```

---

## 🛠️ Available Tools

### 1. `search_reddit`
Search Reddit posts using your private Redlib instance.

**Parameters:**
- `query` (required) - Search query string
- `subreddit` (optional) - Limit search to specific subreddit

**Example:**
```json
{
  "query": "rust programming",
  "subreddit": "rust"
}
```

**Returns:** JSON with post IDs, titles, authors, scores, and comment counts.

---

### 2. `get_subreddit_hot`
Get hot posts from a specific subreddit.

**Parameters:**
- `subreddit` (required) - Subreddit name (without r/)
- `limit` (optional) - Number of posts (default: 25)

**Example:**
```json
{
  "subreddit": "rust",
  "limit": 10
}
```

---

### 3. `get_post`
Get a specific post with its comments.

**Parameters:**
- `subreddit` (required) - Subreddit name
- `postId` (required) - Reddit post ID (from search results)

**Example:**
```json
{
  "subreddit": "rust",
  "postId": "abc123"
}
```

**Returns:** Full post body, score, and up to 10 top comments.

---

## 🔌 Integration with AI Clients

### Claude Desktop

Edit `~/.config/claude/claude_desktop_config.json` (Linux/macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "redlib": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "--network", "host",
        "-e", "REDLIB_URL=http://localhost:8080",
        "alfafadock/mcp-redlib:latest"
      ]
    }
  }
}
```

**For custom Redlib port (e.g., 8085):**
```json
{
  "mcpServers": {
    "redlib": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "--network", "host",
        "-e", "REDLIB_URL=http://localhost:8085",
        "alfafadock/mcp-redlib:latest"
      ]
    }
  }
}
```

**After updating:** Restart Claude Desktop. You should see a hammer icon (🔨) indicating MCP tools are available.

*Reference: [Claude Desktop MCP Docs](https://modelcontextprotocol.io/docs/develop/connect-local-servers)*

---

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project level):

```json
{
  "mcpServers": {
    "redlib": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--network", "host", "-e", "REDLIB_URL=http://localhost:8080", "alfafadock/mcp-redlib:latest"]
    }
  }
}
```

**Project-level setup:** Create `.cursor/mcp.json` in your project root.

**After updating:** Cursor will automatically detect the changes. Use the Command Palette (Cmd/Ctrl+Shift+P) and search for "MCP" to manage servers.

*Reference: [Cursor MCP Documentation](https://cursor.com/docs/mcp)*

---

### VS Code / GitHub Copilot

#### Option A: Workspace Configuration
Create `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "redlib": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--network", "host", "-e", "REDLIB_URL=http://localhost:8080", "alfafadock/mcp-redlib:latest"]
    }
  }
}
```

#### Option B: User Configuration (Global)
Use Command Palette (Cmd/Ctrl+Shift+P) → "MCP: Open User Configuration"

```json
{
  "mcp": {
    "servers": {
      "redlib": {
        "command": "docker",
        "args": ["run", "-i", "--rm", "--network", "host", "-e", "REDLIB_URL=http://localhost:8080", "alfafadock/mcp-redlib:latest"]
      }
    }
  }
}
```

**After updating:** Reload VS Code. The tools will appear in GitHub Copilot's Agent Mode.

*Reference: [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)*

---

### OpenAI Codex

Edit `~/.codex/config.toml` (global) or `.codex/config.toml` (project):

```toml
[mcp_servers.redlib]
command = "docker"
args = ["run", "-i", "--rm", "--network", "host", "-e", "REDLIB_URL=http://localhost:8080", "alfafadock/mcp-redlib:latest"]
```

**Project-level setup:** Create `.codex/config.toml` in your project root.

**After updating:** Restart Codex. Use `codex mcp list` to verify the server is loaded.

*Reference: [Codex MCP Documentation](https://developers.openai.com/codex/mcp)*

---

### ForgeCode

ForgeCode supports MCP servers via the **`forge mcp`** command for easy import.

#### Option A: Quick Import (Recommended)

Use the built-in MCP import functionality:

```bash
# Import the Redlib MCP server
forge mcp import alfafadock/mcp-redlib:latest

# List imported servers
forge mcp list

# Reload to apply changes
forge mcp reload
```

#### Option B: Project Configuration
Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "redlib": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--network", "host", "-e", "REDLIB_URL=http://localhost:8080", "alfafadock/mcp-redlib:latest"]
    }
  }
}
```

#### Option C: Global Configuration
Edit ForgeCode's config directory (check extension settings for the exact path).

**After updating:** Reload the ForgeCode extension using `forge mcp reload`. The MCP tools should appear in the AI assistant interface.

*Reference: [ForgeCode Documentation](https://forgecode.dev/docs/mcp-integration/)*

---

### KiloCode

#### Option A: Global Configuration
Edit `~/.config/kilo/kilo.jsonc` or use Settings → MCP in KiloCode:

```json
{
  "mcpServers": {
    "redlib": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--network", "host", "-e", "REDLIB_URL=http://localhost:8080", "alfafadock/mcp-redlib:latest"]
    }
  }
}
```

#### Option B: Project Configuration
Create `.kilocode/mcp.json` or `kilo.jsonc` in your project root:

```json
{
  "mcpServers": {
    "redlib": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--network", "host", "-e", "REDLIB_URL=http://localhost:8080", "alfafadock/mcp-redlib:latest"]
    }
  }
}
```

**After updating:** Open KiloCode Settings → MCP → Add Server, or edit the config file directly.

*Reference: [KiloCode MCP Documentation](https://kilo.ai/docs/automate/mcp/using-in-kilo-code)*

---

## 🔒 Security: Default vs Hardened
| Feature | Default (`latest`) | Hardened (`hardened`) |
|---------|-------------------|---------------------|
| **User** | root | Non-root (mcpuser) |
| **File Ownership** | root | mcpuser |
| **Build Stages** | Single | Multi-stage (smaller) |
| **Runtime Caps** | Default | Requires `--cap-drop=ALL` |
| **Use Case** | Development, testing | Production |

### Using Hardened Image

```bash
docker run -i --rm \
  --cap-drop=ALL \
  --security-opt no-new-privileges:true \
  --network host \
  -e REDLIB_URL=http://localhost:8080 \
  alfafadock/mcp-redlib:hardened
```

---

## 💻 Development

### Project Structure

```
redlib-mcp-server/
├── src/
│   └── index.ts          # Main server code
├── dist/                  # Compiled JavaScript (gitignored)
├── Dockerfile             # Default Docker image
├── Dockerfile.hardened    # Hardened Docker image
├── docker-compose.yml     # Production compose
├── package.json
├── tsconfig.json
└── README.md
```

### Build from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
npm start
```

### Build Custom Docker Images

```bash
# Default version
docker build -t redlib-mcp-server .

# Hardened version
docker build -f Dockerfile.hardened -t redlib-mcp-server:hardened .
```

---

## 📝 Example Usage with AI

Once connected to your AI client (e.g., Claude), you can:

```
User: "Search Reddit for 'home lab setup' and summarize the top results"

AI uses search_reddit tool →
Returns structured JSON with posts →
AI summarizes the findings for you
```

```
User: "Get the full post and comments for that Rust tutorial I searched earlier"

AI uses get_post with postId →
Returns post body + comments →
AI provides detailed analysis
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📄 License

MIT License - feel free to use this project however you want!

---

## 🙏 Acknowledgments

- [Redlib](https://github.com/redlib-org/redlib) - The private Reddit front-end this server interfaces with
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol that makes this integration possible
- [Cheerio](https://github.com/cheeriojs/cheerio) - HTML parsing library used to extract structured data

---

## 🔗 Links

- **Docker Hub**: [alfafadock/mcp-redlib](https://hub.docker.com/r/alfafadock/mcp-redlib)
- **Issues**: [GitHub Issues](https://github.com/Devthatdoes/redlib-mcp-server/issues)
- **Redlib**: [github.com/redlib-org/redlib](https://github.com/redlib-org/redlib)

---

<p align="center">Made with ❤️ for the privacy-conscious Reddit community</p>
