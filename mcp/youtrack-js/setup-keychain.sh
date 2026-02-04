#!/bin/bash
# Helper script to set up YouTrack MCP Server with keychain storage

set -e

echo "🔐 YouTrack MCP Server - Secure Keychain Setup"
echo "=============================================="
echo

# Check if on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This script is for macOS only (uses keychain)"
    echo "For other platforms, use environment variables directly"
    exit 1
fi

# Get YouTrack URL
echo "📍 Step 1: YouTrack URL"
read -p "Enter your YouTrack URL (e.g., https://youtrack.example.com): " YOUTRACK_URL

if [[ -z "$YOUTRACK_URL" ]]; then
    echo "❌ Error: URL is required"
    exit 1
fi

# Get YouTrack token
echo
echo "🎫 Step 2: YouTrack Token"
echo "Get your token from: $YOUTRACK_URL/users/me?tab=authentication"
read -s -p "Enter your YouTrack permanent token (perm:...): " YOUTRACK_TOKEN
echo

if [[ -z "$YOUTRACK_TOKEN" ]]; then
    echo "❌ Error: Token is required"
    exit 1
fi

if [[ ! "$YOUTRACK_TOKEN" =~ ^perm: ]]; then
    echo "⚠️  Warning: Token should start with 'perm:'"
    read -p "Continue anyway? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        exit 1
    fi
fi

# Store in keychain
echo
echo "💾 Step 3: Storing token in keychain..."
security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "$YOUTRACK_TOKEN" 2>/dev/null || {
    # If it already exists, update it
    echo "Token already exists, updating..."
    security delete-generic-password -a "$USER" -s "youtrack-mcp-token" 2>/dev/null
    security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "$YOUTRACK_TOKEN"
}

echo "✅ Token stored securely in keychain"

# Update or create ~/.zshenv
echo
echo "📝 Step 4: Configuring ~/.zshenv..."

ZSHENV="$HOME/.zshenv"
BACKUP="$HOME/.zshenv.backup.$(date +%Y%m%d_%H%M%S)"

# Backup existing .zshenv if it exists
if [[ -f "$ZSHENV" ]]; then
    cp "$ZSHENV" "$BACKUP"
    echo "📦 Backed up existing .zshenv to: $BACKUP"
fi

# Remove old YouTrack configuration if exists
if [[ -f "$ZSHENV" ]]; then
    sed -i.tmp '/# YouTrack MCP/d' "$ZSHENV"
    sed -i.tmp '/YOUTRACK_URL=/d' "$ZSHENV"
    sed -i.tmp '/YOUTRACK_TOKEN=/d' "$ZSHENV"
    rm -f "$ZSHENV.tmp"
fi

# Add new configuration
cat >> "$ZSHENV" << EOF

# YouTrack MCP Configuration (added $(date +%Y-%m-%d))
export YOUTRACK_URL="$YOUTRACK_URL"
export YOUTRACK_TOKEN="\$(security find-generic-password -a "\$USER" -s "youtrack-mcp-token" -w 2>/dev/null)"
EOF

echo "✅ Configuration added to ~/.zshenv"

# Reload
echo
echo "🔄 Step 5: Reloading environment..."
source "$ZSHENV"

# Verify
echo
echo "🧪 Step 6: Verifying setup..."
if [[ -n "$YOUTRACK_TOKEN" ]]; then
    echo "✅ YOUTRACK_URL is set: $YOUTRACK_URL"
    echo "✅ YOUTRACK_TOKEN is set: ${YOUTRACK_TOKEN:0:10}..."
else
    echo "❌ Error: Environment variables not loaded correctly"
    echo "Try running: source ~/.zshenv"
    exit 1
fi

echo
echo "✅ Setup complete!"
echo
echo "Next steps:"
echo "1. Restart Claude Desktop (if running)"
echo "2. Add YouTrack MCP to your Claude Desktop config:"
echo
PWD_PATH="$(pwd)/dist/index.js"
cat << ENDCONFIG
   {
     "mcpServers": {
       "youtrack": {
         "command": "node",
         "args": ["$PWD_PATH"]
       }
     }
   }
ENDCONFIG
echo
echo "3. Test with: npm start"
echo
