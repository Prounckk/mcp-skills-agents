# YouTrack MCP Server - Quick Start Guide

Get your YouTrack MCP server running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd youtrack-js
npm install
```

## Step 2: Build the Project

```bash
npm run build
```

## Step 3: Get Your YouTrack Credentials

### YouTrack URL
Your YouTrack instance URL. Examples:
- Cloud: `https://yourcompany.youtrack.cloud`
- Self-hosted: `https://youtrack.yourcompany.com`

### Permanent Token
1. Log in to YouTrack
2. Click your avatar → Profile settings
3. Go to **Authentication** → **Tokens**
4. Click **New token**
5. Name it (e.g., "MCP Server")
6. Select scopes (or use default "YouTrack")
7. Click **Create**
8. Copy the token (starts with `perm:`)

## Step 4: Configure Environment Variables (Secure Method)

### Quick Setup (Automated - Recommended)

Run the setup script for guided configuration:

```bash
./setup-keychain.sh
```

This will prompt for your URL and token, store them securely, and configure everything automatically. **Skip to Step 5 if you use this.**

---

### Manual Setup: Keychain + zshenv (macOS)

**Step 4a: Store token in keychain**

```bash
security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "perm:your_token_here"
```

**Step 4b: Add to ~/.zshenv**

```bash
# Open or create ~/.zshenv
nano ~/.zshenv

# Add these lines:
export YOUTRACK_URL="https://youtrack.example.com"
export YOUTRACK_TOKEN="$(security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w 2>/dev/null)"

# Save and reload
source ~/.zshenv
```

**Step 4c: Verify**

```bash
echo $YOUTRACK_TOKEN  # Should show your token
```

### Alternative Options

**Option A: Direct export (Temporary - not secure)**

```bash
export YOUTRACK_URL="https://youtrack.example.com"
export YOUTRACK_TOKEN="perm:your_token_here"
```

**Option B: .env file (Development only - not for production)**

Create `.env` in project root:

```
YOUTRACK_URL=https://youtrack.example.com
YOUTRACK_TOKEN=perm:your_token_here
```

## Step 5: Test the Server

Run the server:

```bash
npm start
```

You should see:
```
YouTrack MCP Server running on stdio
Connected to: https://youtrack.example.com
```

## Step 6: Configure Your MCP Client

### For Claude Desktop (macOS)

**If you used the keychain + zshenv method (recommended):**

1. Open configuration file: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add the YouTrack server (simple version - uses ~/.zshenv):

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/absolute/path/to/youtrack-js/dist/index.js"]
    }
  }
}
```

3. Replace `/absolute/path/to/` with the actual path (e.g., `/Users/yourname/mcp-skills-agents/mcp/youtrack-js/dist/index.js`)
4. Restart Claude Desktop

**Why this works:** Claude Desktop on macOS automatically loads `~/.zshenv`, so your `YOUTRACK_URL` and `YOUTRACK_TOKEN` are already available.

---

**Alternative (explicit credentials - less secure):**

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/absolute/path/to/youtrack-js/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://youtrack.example.com",
        "YOUTRACK_TOKEN": "perm:your_token_here"
      }
    }
  }
}
```

**Note:** This stores your token in plain text in the config file. The keychain method is more secure.

### For Other MCP Clients

Use stdio transport with:

```bash
node /path/to/youtrack-js/dist/index.js
```

## Step 7: Try It Out!

In Claude, try these commands:

1. **List custom fields**:
   ```
   What custom fields are available in YouTrack?
   ```

2. **Search for issues**:
   ```
   Show me all open issues in the DEV project
   ```

3. **Get specific issue**:
   ```
   Get details for issue DEV-516
   ```

4. **Create an issue**:
   ```
   Create a task in DEV project: "Test the authentication flow"
   Set Priority to Normal and Stage to Todo
   ```

## Quick Reference

### Common JQL Queries

```
project: DEV
State: Open
for: me
Kanban State: {Ready to pull}
project: DEV State: Open Priority: High
created: Today
updated: {Last week}
```

### Custom Field Examples

```json
{"name": "Stage", "value": "Todo"}
{"name": "Priority", "value": "High"}
{"name": "Kanban State", "value": "In Progress"}
{"name": "Type", "value": "Task"}
{"name": "Code Location", "value": "Portal"}
```

## Troubleshooting

### "Authentication failed"
- Check your token hasn't expired
- Verify `YOUTRACK_TOKEN` is correct
- Regenerate token if needed

### "Unable to reach YouTrack server"
- Verify `YOUTRACK_URL` is correct (no trailing slash)
- Check network connectivity
- Verify firewall settings

### "Permission denied"
- Ensure token has required permissions:
  - Read issues
  - Create issues
  - Update issues
  - Read custom fields

### "Custom field not found"
- Run `youtrack_list_custom_fields` to see available fields
- Field names are case-sensitive
- Use exact field names

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore [YouTrack's JQL syntax](https://www.jetbrains.com/help/youtrack/server/Query-Syntax.html)
- Review [YouTrack REST API docs](https://www.jetbrains.com/help/youtrack/devportal/youtrack-rest-api.html)

## Need Help?

Check the main README.md for:
- Detailed API documentation
- Advanced usage examples
- Complete troubleshooting guide
- Custom field type reference
