# Security Updates - YouTrack MCP Server

## Summary

Updated the YouTrack MCP server documentation and configuration to use **macOS keychain** for secure credential storage instead of plain-text environment variables.

## Changes Made

### 📄 Documentation Updates

#### 1. **README.md** - Major Updates
- ✅ Added "Secure Credential Storage" section with keychain instructions
- ✅ Added automated setup script documentation
- ✅ Updated Claude Desktop configuration examples (simple vs explicit)
- ✅ Added "Managing Keychain Credentials" section with:
  - View stored token
  - Update token
  - Remove token
  - Verify configuration
- ✅ Added keychain troubleshooting subsection
- ✅ Explained why `~/.zshenv` is used over other shell config files

#### 2. **QUICKSTART.md** - Enhanced Security Setup
- ✅ Added "Quick Setup (Automated)" section pointing to setup script
- ✅ Renamed "Configure Environment Variables" to emphasize security
- ✅ Added keychain + zshenv as recommended method
- ✅ Moved direct export and .env to "Alternative Options" with warnings
- ✅ Updated Claude Desktop config to show simpler version (no env block)
- ✅ Added security notes about plain-text storage

### 🆕 New Files Created

#### 3. **setup-keychain.sh** (Executable Script)
Interactive setup script that:
- ✅ Prompts for YouTrack URL and token
- ✅ Validates input (checks for perm: prefix)
- ✅ Stores token securely in macOS keychain
- ✅ Backs up existing `~/.zshenv` before modifying
- ✅ Adds configuration to `~/.zshenv` automatically
- ✅ Reloads environment and verifies setup
- ✅ Displays next steps with example config
- ✅ Includes error handling and user-friendly messages

#### 4. **.zshenv.example**
Example `~/.zshenv` configuration showing:
- ✅ How to set YOUTRACK_URL
- ✅ How to retrieve token from keychain
- ✅ Comments explaining each line
- ✅ Optional PATH configuration

#### 5. **claude_desktop_config.json.example**
Example Claude Desktop configuration with:
- ✅ Recommended config (uses ~/.zshenv)
- ✅ Alternative explicit config (with env block)
- ✅ Detailed comments explaining each approach
- ✅ Setup instructions in comments
- ✅ Security notes

#### 6. **SECURITY-SETUP.md**
Comprehensive security documentation:
- ✅ Why keychain approach is more secure
- ✅ How the security system works
- ✅ Quick automated setup vs manual setup
- ✅ Managing credentials (view/update/remove)
- ✅ Troubleshooting common issues
- ✅ Security best practices (DO/DON'T)
- ✅ Explanation of why `~/.zshenv` is used
- ✅ Example workflow from setup to usage
- ✅ Cross-platform notes

#### 7. **UPDATES.md** (This File)
Change log documenting all updates

## Security Improvements

### Before (Insecure)
```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "YOUTRACK_TOKEN": "perm:token_visible_in_plain_text"
      }
    }
  }
}
```
❌ Token visible in config file
❌ Token in plain text
❌ Could be committed to git
❌ Visible in process list

### After (Secure)

**~/.zshenv:**
```bash
export YOUTRACK_TOKEN="$(security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w 2>/dev/null)"
```

**claude_desktop_config.json:**
```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/path/to/dist/index.js"]
    }
  }
}
```
✅ Token stored in encrypted keychain
✅ Not visible in config files
✅ Safe to commit config to git
✅ Retrieved dynamically when needed

## Usage

### Quick Start (Recommended)
```bash
cd /path/to/youtrack-js
./setup-keychain.sh
```

### Manual Setup
```bash
# Store token
security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "perm:your_token"

# Add to ~/.zshenv
echo 'export YOUTRACK_URL="https://youtrack.example.com"' >> ~/.zshenv
echo 'export YOUTRACK_TOKEN="$(security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w 2>/dev/null)"' >> ~/.zshenv

# Reload
source ~/.zshenv
```

### Verify
```bash
echo "URL: $YOUTRACK_URL"
echo "Token: ${YOUTRACK_TOKEN:0:10}..."
```

## Benefits

1. **🔒 Security**
   - Tokens encrypted in keychain
   - No plain-text credentials
   - Follows macOS security best practices

2. **🎯 Simplicity**
   - One-line setup with automated script
   - Simple Claude Desktop config
   - No `env` block needed

3. **🔄 Maintainability**
   - Update token in one place (keychain)
   - No need to update multiple config files
   - Easy to revoke/rotate tokens

4. **✅ Best Practices**
   - Follows macOS security guidelines
   - Prevents accidental token exposure
   - Compatible with version control

## Backward Compatibility

The explicit configuration method still works:
```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://youtrack.example.com",
        "YOUTRACK_TOKEN": "perm:your_token"
      }
    }
  }
}
```

However, the keychain method is **strongly recommended** for production use.

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `README.md` | Main documentation | Updated ✅ |
| `QUICKSTART.md` | Quick start guide | Updated ✅ |
| `setup-keychain.sh` | Automated setup | New ✅ |
| `.zshenv.example` | Example config | New ✅ |
| `claude_desktop_config.json.example` | Example Claude config | New ✅ |
| `SECURITY-SETUP.md` | Security guide | New ✅ |
| `UPDATES.md` | Change log | New ✅ |

## Testing

Script syntax validated:
```bash
bash -n setup-keychain.sh
# ✅ Script syntax is valid
```

Permissions set:
```bash
chmod +x setup-keychain.sh
# ✅ Executable
```

## Next Steps for Users

1. **Review** the updated [README.md](README.md)
2. **Run** `./setup-keychain.sh` for automated setup
3. **Read** [SECURITY-SETUP.md](SECURITY-SETUP.md) for detailed info
4. **Update** Claude Desktop config to simple version
5. **Restart** Claude Desktop

## Support

For questions or issues with the new security setup:
- See [SECURITY-SETUP.md](SECURITY-SETUP.md) for detailed guidance
- See [README.md](README.md) for full documentation
- See [QUICKSTART.md](QUICKSTART.md) for quick setup
- Check troubleshooting sections in above docs

---

**Updated:** February 4, 2026
**Version:** 1.0.0 → 1.1.0 (Security Enhancement)
