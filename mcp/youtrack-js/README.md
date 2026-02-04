# YouTrack MCP Server

A comprehensive Model Context Protocol (MCP) server for YouTrack integration. Enables AI assistants to read and write YouTrack issues with full support for custom fields.

## Features

- **Complete Issue Management**: Create, read, update, and search issues
- **Full Custom Fields Support**: Work with all YouTrack custom field types
- **JQL Search**: Powerful query language for finding issues
- **Custom Field Discovery**: Explore available fields and their valid values
- **Type-Safe**: Built with TypeScript for reliability
- **Flexible Output**: Choose between Markdown (human-readable) or JSON (machine-readable)

## Installation

### Prerequisites

- Node.js 18 or higher
- YouTrack instance (cloud or self-hosted)
- YouTrack permanent token

### Setup

1. **Clone or download this repository**

```bash
cd youtrack-mcp-server
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Get your YouTrack credentials**
   - **URL**: Your YouTrack instance URL (e.g., `https://youtrack.example.com`)
   - **Token**: Create a permanent token in YouTrack:
     1. Go to your YouTrack profile settings
     2. Navigate to "Authentication" → "Tokens"
     3. Click "New token"
     4. Give it a name and required permissions
     5. Copy the token (format: `perm:xxx...`)

## Configuration

### Secure Credential Storage (Recommended)

For security, store your YouTrack token in the macOS keychain instead of plain text files.

#### Quick Setup (Automated)

Run the included setup script for guided configuration:

```bash
./setup-keychain.sh
```

This script will:
- Prompt for your YouTrack URL and token
- Store the token securely in macOS keychain
- Configure `~/.zshenv` automatically
- Verify the setup works

#### Manual Setup

If you prefer manual setup, follow these steps:

#### Step 1: Store Token in Keychain

```bash
# Store your YouTrack token securely in keychain
security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "perm:your_permanent_token_here"
```

#### Step 2: Configure Environment Variables

Add to your `~/.zshenv` file (create if it doesn't exist):

```bash
# YouTrack MCP Configuration
export YOUTRACK_URL="https://youtrack.example.com"
export YOUTRACK_TOKEN="$(security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w 2>/dev/null)"
```

**Why `.zshenv`?** This file is loaded for all shell sessions (interactive and non-interactive), ensuring the variables are available to GUI applications like Claude Desktop.

#### Step 3: Reload Environment

```bash
# Reload zsh configuration
source ~/.zshenv

# Verify it works (should print your token)
echo $YOUTRACK_TOKEN
```

### Alternative: Direct Environment Variables

If you prefer not to use keychain, set these environment variables:

```bash
export YOUTRACK_URL="https://youtrack.example.com"
export YOUTRACK_TOKEN="perm:your_permanent_token_here"
```

**Note:** This stores your token in plain text. For better security, use the keychain method above.

### Claude Desktop Integration

Since Claude Desktop loads `~/.zshenv` automatically on macOS, you can use a simpler configuration:

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

Environment variables (`YOUTRACK_URL` and `YOUTRACK_TOKEN`) will be automatically loaded from `~/.zshenv`.

**Alternative (explicit configuration):**

If you prefer to specify environment variables directly in the config:

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/absolute/path/to/youtrack-js/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://youtrack.example.com",
        "YOUTRACK_TOKEN": "perm:your_permanent_token"
      }
    }
  }
}
```

### Other MCP Clients

For other MCP clients, use stdio transport with the following command:

```bash
node /path/to/dist/index.js
```

## Available Tools

### 1. youtrack_get_issue

Get detailed information about a specific issue.

**Parameters:**
- `issue_id` (string): Issue ID (e.g., "DEV-516")
- `response_format` (string): "markdown" or "json" (default: "markdown")

**Example:**
```
Get issue DEV-516
```

### 2. youtrack_search_issues

Search for issues using JQL (YouTrack Query Language).

**Parameters:**
- `query` (string): JQL query (e.g., "project: DEV State: Open")
- `limit` (number): Max results (1-100, default: 20)
- `offset` (number): Pagination offset (default: 0)
- `response_format` (string): "markdown" or "json"

**JQL Examples:**
```
project: DEV
State: Open
Kanban State: {Ready to pull}
project: DEV State: Open Priority: High
for: me State: {In Progress}
created: Today
summary: authentication
```

**Example:**
```
Find all issues in DEV project that are ready to pull
```

### 3. youtrack_create_issue

Create a new issue with custom fields.

**Parameters:**
- `project_id` (string): Project ID or short name (e.g., "DEV")
- `summary` (string): Issue title (required)
- `description` (string): Issue description (optional)
- `parent_issue_id` (string): Parent issue for subtasks (optional)
- `custom_fields` (array): Custom field values (optional)
- `response_format` (string): "markdown" or "json"

**Example:**
```
Create an issue in DEV project with summary "Fix authentication bug",
set Stage to Todo, Priority to Normal, and Kanban State to Ready to pull
```

### 4. youtrack_update_issue

Update an existing issue.

**Parameters:**
- `issue_id` (string): Issue ID to update (e.g., "DEV-516")
- `summary` (string): New summary (optional)
- `description` (string): New description (optional)
- `custom_fields` (array): Custom field values to update (optional)
- `response_format` (string): "markdown" or "json"

**Example:**
```
Update issue DEV-516: set Stage to Done and Kanban State to Deployed
```

### 5. youtrack_list_custom_fields

List all available custom fields and their configurations.

**Parameters:**
- `response_format` (string): "markdown" or "json"

**Example:**
```
What custom fields are available?
```

### 6. youtrack_get_custom_field

Get details about a specific custom field.

**Parameters:**
- `field_id_or_name` (string): Field name (e.g., "Stage", "Priority")
- `response_format` (string): "markdown" or "json"

**Example:**
```
What are the valid values for the Stage field?
```

## Custom Fields

The server fully supports YouTrack custom fields. Here's how to work with them:

### Field Types

- **State/Enum Fields**: Use field name and value name
  ```json
  {"name": "Stage", "value": "Todo"}
  {"name": "Priority", "value": "Normal"}
  {"name": "Kanban State", "value": "Ready to pull"}
  ```

- **Text Fields**: Simple string values
  ```json
  {"name": "Code Location", "value": "Portal"}
  ```

- **Numeric Fields**: Number values
  ```json
  {"name": "Story Points", "value": 5}
  ```

- **Date Fields**: Timestamp values
  ```json
  {"name": "Due Date", "value": 1704067200000}
  ```

### Example: Creating Issue with Custom Fields

```json
{
  "project_id": "DEV",
  "summary": "Implement authentication",
  "description": "Add OAuth2 support",
  "parent_issue_id": "DEV-516",
  "custom_fields": [
    {"name": "Stage", "value": "Todo"},
    {"name": "Priority", "value": "Normal"},
    {"name": "Type", "value": "Task"},
    {"name": "Kanban State", "value": "Ready to pull"},
    {"name": "Code Location", "value": "Portal"},
    {"name": "Allocation", "value": "2026 - Infra"}
  ]
}
```

## Usage Examples

### Example Workflow

```
User: Show me all open issues in the DEV project

Claude uses: youtrack_search_issues
  query: "project: DEV State: Open"

User: Create a task for fixing the login bug, set it to high priority

Claude uses: youtrack_create_issue
  project_id: "DEV"
  summary: "Fix login bug"
  custom_fields: [{"name": "Priority", "value": "High"}, {"name": "Type", "value": "Task"}]

User: Update DEV-520 to mark it as done

Claude uses: youtrack_update_issue
  issue_id: "DEV-520"
  custom_fields: [{"name": "Stage", "value": "Done"}]
```

## Development

### Project Structure

```
youtrack-mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── types.ts              # TypeScript type definitions
│   ├── constants.ts          # Configuration constants
│   ├── schemas/
│   │   └── index.ts          # Zod validation schemas
│   ├── services/
│   │   └── api.ts            # YouTrack API client
│   └── tools/
│       ├── issues.ts         # Issue management tools
│       └── fields.ts         # Custom field tools
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npm run build      # Build TypeScript to JavaScript
npm run dev        # Development mode with auto-reload
npm run clean      # Remove build artifacts
```

### Testing

```bash
# Run the server
npm start

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Troubleshooting

### Authentication Errors

```
Error: Authentication failed: Invalid or expired token
```

**Solution**: Verify your `YOUTRACK_TOKEN` is correct and has not expired. Generate a new permanent token if needed.

### Connection Errors

```
Error: Unable to reach YouTrack server
```

**Solution**: Check that `YOUTRACK_URL` is correct and accessible. Ensure there are no firewall or network issues.

### Permission Errors

```
Error: Permission denied: You don't have access to this resource
```

**Solution**: Ensure your YouTrack token has the necessary permissions:
- Read issues
- Create issues
- Update issues
- Read custom fields

### Rate Limit Errors

```
Error: Rate limit exceeded
```

**Solution**: Wait a moment before making more requests. Consider adding delays between operations.

### Custom Field Errors

```
Error: Custom field not found
```

**Solution**: Use `youtrack_list_custom_fields` to see available fields and their exact names. Field names are case-sensitive.

### Keychain Issues (macOS)

**Token not loading from keychain:**

```bash
# Verify token is stored
security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w

# If not found, add it again
security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "perm:your_token"
```

**Environment variable not set:**

```bash
# Check if YOUTRACK_TOKEN is set
echo $YOUTRACK_TOKEN

# If empty, reload zshenv
source ~/.zshenv

# Verify it's in your zshenv
grep YOUTRACK ~/.zshenv
```

## Managing Keychain Credentials

### View Stored Token

```bash
# Display the token
security find-generic-password -a "$USER" -s "youtrack-mcp-token" -w

# View full keychain entry (opens Keychain Access)
security find-generic-password -a "$USER" -s "youtrack-mcp-token"
```

### Update Token

```bash
# Delete old token
security delete-generic-password -a "$USER" -s "youtrack-mcp-token"

# Add new token
security add-generic-password -a "$USER" -s "youtrack-mcp-token" -w "perm:your_new_token"

# Or use the setup script
./setup-keychain.sh
```

### Remove Token

```bash
# Delete from keychain
security delete-generic-password -a "$USER" -s "youtrack-mcp-token"

# Remove from ~/.zshenv (optional)
nano ~/.zshenv  # Remove YOUTRACK_* lines
```

### Verify Configuration

```bash
# Check environment variables
echo "URL: $YOUTRACK_URL"
echo "Token: ${YOUTRACK_TOKEN:0:10}..."  # Shows first 10 chars only

# Test the server
cd /path/to/youtrack-js
npm start
```

## API Documentation

For more information about YouTrack's REST API, see:
- [YouTrack REST API Documentation](https://www.jetbrains.com/help/youtrack/devportal/youtrack-rest-api.html)
- [Custom Fields in REST API](https://www.jetbrains.com/help/youtrack/devportal/api-concept-custom-fields.html)
- [JQL Query Syntax](https://www.jetbrains.com/help/youtrack/server/Query-Syntax.html)

## License

MIT

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the maintainer.
