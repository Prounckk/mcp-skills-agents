# 🤖 MCP Skills Agents

A centralized repository for **Model Context Protocol (MCP)** servers, **AI Skills**, and **Autonomous Agents**. This project aims to bridge the gap between AI models and real-world tools, providing a standardized way to extend AI capabilities.

---

## 🏗 Project Structure

The repository is organized into three core pillars:

### 🔌 [MCP Servers](./mcp)
Implementations of the Model Context Protocol that allow AI agents to interact with external services and data sources.
*   **YouTrack**: Available in two flavors:
    *   **[Python Version](./mcp/youtrack)**: The original Python implementation.
    *   **[Node.js Version](./mcp/youtrack-js)**: A TypeScript/Node.js implementation with enhanced setup guides.

### 🧠 [Skills](./skills)
Domain-specific knowledge and best practices formatted for AI consumption. These provide the "mental model" for agents to perform specialized tasks.
*   **[Golang](./skills/golang)**: A comprehensive guide to idiomatic Go development, covering concurrency, error handling, interfaces, and more.

### 🤖 [Agents](./agents)
Autonomous and semi-autonomous systems that leverage MCP servers and Skills to execute complex workflows.
*   **[Code Reviewer](./agents/code-review)**: An automated reviewer that applies domain-specific skills (like Go best practices) to analyze code and diffs.
*   *Planned*: Deployment Manager, Documentation Architect.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (for MCP servers)
- **Node.js** (for web-based components)
- **Claude Desktop** or **Cursor IDE** (recommended for MCP integration)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Prounckk/mcp-skills-agents.git
    cd mcp-skills-agents
    ```

2.  **Explore the components:**
    - Navigate to `mcp/youtrack` to set up the YouTrack integration.
    - Check `skills/golang` to enhance your agent's Go programming capabilities.

---


## 🔐 Security & Configuration

We strongly recommend using **macOS Keychain** combined with `.zshenv` for secure credential storage, rather than hardcoding API tokens in configuration files.

**Quick Setup:**
1.  Store your token securely:
    ```bash
    security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "perm:your-token"
    ```
2.  Expose it via `~/.zshenv`:
    ```bash
    export YOUTRACK_API_TOKEN="$(security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w)"
    ```
3.  Claude Desktop will automatically pick up these environment variables.

---

## 🔗 Connect to AI (Claude & Cursor)

To fully leverage this repository, you should connect it to your AI assistant's environment.

### 1. Symlink Skills (for Context-Aware Agents)
If your AI tool (e.g., Antigravity, custom agents) scans a specific directory for skills, **symlink** this repository's `skills` folder. This ensures your AI always uses the latest version of your skills without manual copying.

```bash
# Example: Link to your personal skills directory
# Replace ~/.gemini/antigravity/skills with your actual agent's skill path
ln -s "$(pwd)/skills/golang" ~/.gemini/antigravity/skills/golang-expert
ln -s "$(pwd)/skills/htmx-go" ~/.gemini/antigravity/skills/htmx-go
```

### 2. Configure MCP for Claude Desktop
Update your `claude_desktop_config.json` to include both the YouTrack server and the Code Reviewer agent.

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/mcp-skills-agents/mcp/youtrack-js/dist/index.js"]
    },
    "code-reviewer": {
      "command": "python",
      "args": ["/ABSOLUTE/PATH/TO/mcp-skills-agents/agents/code-review/reviewer.py"],
      "args": ["--report-to-youtrack"] 
    }
  }
}
```
*Note: Run `pwd` in the repo root to get the absolute path.*

### 3. Cursor IDE Setup
1.  Open **Settings** (`Cmd+,`) > **Features** > **MCP**.
2.  Add a new MCP Server:
    *   **Name**: `youtrack`
    *   **Command**: `node /absolute/path/to/mcp/youtrack-js/dist/index.js`
3.  (Optional) Add the Code Reviewer as a second MCP server using the python command above.

---

## 🤝 Contributing

We welcome contributions! Whether it's a new MCP server, a set of skills for a specific domain, or a new agent implementation:

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/amazing-skill`)
3.  Commit your changes (`git commit -m 'Add amazing skill'`)
4.  Push to the branch (`git push origin feature/amazing-skill`)
5.  Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the individual directories for specific details.
