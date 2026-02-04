# Secure Credential Setup for YouTrack MCP Server

This guide explains how to securely store your YouTrack credentials using macOS keychain and `~/.zshenv`.

## Why This Approach?

**Security Benefits:**
- ✅ Token stored in encrypted macOS keychain, not plain text
- ✅ Credentials not visible in config files or git repos
- ✅ Easy to update or revoke without editing multiple files
- ✅ Works seamlessly with Claude Desktop and other apps

**How It Works:**
1. Your YouTrack permanent token is stored securely in macOS keychain
2. `~/.zshenv` retrieves the token from keychain when needed
3. Claude Desktop automatically loads `~/.zshenv` on startup
4. No credentials stored in `claude_desktop_config.json`

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
cd /path/to/youtrack-js
./setup-keychain.sh
```

This interactive script will:
1. Prompt for your YouTrack URL
2. Prompt for your permanent token
3. Store token in macOS keychain
4. Update `~/.zshenv` automatically
5. Verify the setup works

### Option 2: Manual Setup

#### Step 1: Store Token in Keychain

```bash
security add-generic-password \
  -a "$USER" \
  -s "youtrack-mcp-token" \
  -w "perm:your_permanent_token_here"
```

#### Step 2: Configure ~/.zshenv

Create or edit `~/.zshenv`:

```bash
nano ~/.zshenv
```

Add these lines:

```bash
# YouTrack MCP Configuration
export YOUTRACK_URL="https://youtrack.example.com"
export YOUTRACK_TOKEN="$(security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w 2>/dev/null)"
```

#### Step 3: Reload Environment

```bash
source ~/.zshenv
```

#### Step 4: Verify

```bash
echo "URL: $YOUTRACK_URL"
echo "Token: ${YOUTRACK_TOKEN:0:10}..."
```

You should see your URL and the first 10 characters of your token.

## Claude Desktop Configuration

With credentials in `~/.zshenv`, your Claude Desktop config can be simple:

**File:** `~/Library/Application Support/Claude/claude_desktop_config.json`

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

**No `env` block needed!** Claude Desktop automatically loads `~/.zshenv`.

## Managing Credentials

### View Token

```bash
# Show the token
security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w
```

### Update Token

```bash
# Delete old token
security delete-generic-password -a "$USER" -s "youtrack-mcp-token"

# Add new token
security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "perm:new_token"

# Or run the setup script again
./setup-keychain.sh
```

### Remove Token

```bash
# Remove from keychain
security delete-generic-password -a "$USER" -s "youtrack-mcp-token"

# Optionally remove from ~/.zshenv
sed -i.bak '/YOUTRACK/d' ~/.zshenv
```

## Troubleshooting

### Token not loading

```bash
# Check if token is in keychain
security find-generic-password -a "$USER" -s "youtrack-mcp-token"

# Check if environment variable is set
echo $YOUTRACK_TOKEN

# Reload zshenv
source ~/.zshenv
```

### Claude Desktop not seeing variables

1. **Restart Claude Desktop** after updating `~/.zshenv`
2. Verify `~/.zshenv` contains the exports (not `~/.zshrc`)
3. Make sure there are no syntax errors in `~/.zshenv`

### Permission denied errors

```bash
# Make sure setup script is executable
chmod +x setup-keychain.sh

# Check keychain access
security find-generic-password -a "$USER" -s "youtrack-mcp-token"
```

## Security Best Practices

### ✅ DO:
- Use keychain for storing tokens
- Keep `~/.zshenv` with proper permissions (chmod 600)
- Use permanent tokens instead of session tokens
- Revoke and regenerate tokens periodically
- Use the automated setup script for consistent configuration

### ❌ DON'T:
- Store tokens in git repositories
- Share your `~/.zshenv` file
- Put tokens in shell history (use the setup script instead)
- Store tokens in `claude_desktop_config.json` if using keychain
- Copy tokens to multiple places (single source of truth)

## Files Reference

| File | Purpose |
|------|---------|
| `.zshenv.example` | Example zshenv configuration |
| `setup-keychain.sh` | Automated setup script |
| `claude_desktop_config.json.example` | Example Claude config |
| `SECURITY-SETUP.md` | This file - security documentation |

## Why ~/.zshenv?

**Why not `~/.zshrc` or `~/.bash_profile`?**

- `~/.zshenv` is loaded for **all** shell sessions (interactive and non-interactive)
- GUI apps like Claude Desktop can access variables from `~/.zshenv`
- `~/.zshrc` only loads for interactive shells
- `~/.bash_profile` only loads for login shells and bash users

**Cross-platform note:**
- This setup is designed for macOS with zsh (default since macOS Catalina)
- For bash users, use `~/.bashrc` or `~/.bash_profile` instead
- For Linux, similar keychain tools exist (e.g., `gnome-keyring`, `secret-tool`)

## Example Workflow

1. **Initial Setup**
   ```bash
   cd /path/to/youtrack-js
   ./setup-keychain.sh
   ```

2. **Configure Claude Desktop** (one-time)
   - Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Add simple config without `env` block
   - Restart Claude Desktop

3. **Use MCP**
   - Claude can now access YouTrack
   - Credentials loaded automatically from keychain

4. **Update Token** (when token expires)
   ```bash
   ./setup-keychain.sh  # Will update existing token
   ```

## Support

For issues or questions:
- See main [README.md](README.md) for full documentation
- See [QUICKSTART.md](QUICKSTART.md) for quick setup
- Check [Troubleshooting](#troubleshooting) section above
