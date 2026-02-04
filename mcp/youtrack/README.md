# YouTrack MCP Server

Model Context Protocol (MCP) server for integrating with JetBrains YouTrack issue tracking system.

## Overview

This MCP server enables AI assistants to interact with YouTrack, providing capabilities for:
- Searching and filtering issues
- Creating and updating issues
- Managing comments and attachments
- Querying project information
- Working with custom fields and workflows

## Setup

### Prerequisites
- Python 3.8 or higher
- YouTrack instance (Cloud or Server)
- YouTrack API token

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
export YOUTRACK_URL=https://your-instance.youtrack.cloud
export YOUTRACK_API_TOKEN=perm:your-api-token
export YOUTRACK_CLOUD=true  # Set to false for self-hosted
```

### Configuration

You can also use a configuration file `config.json`:
```json
{
  "youtrack_url": "https://your-instance.youtrack.cloud",
  "youtrack_token": "perm:your-api-token",
  "is_cloud": true
}
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/.config/claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "youtrack": {
      "command": "python",
      "args": ["/path/to/mcp/youtrack/server.py"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_API_TOKEN": "perm:your-api-token"
      }
    }
  }
}
```

### With Cursor IDE

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "youtrack": {
      "type": "stdio",
      "command": "python",
      "args": ["/path/to/mcp/youtrack/server.py"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_API_TOKEN": "perm:your-api-token"
      }
    }
  }
}
```

### Standalone

Run the server directly:
```bash
python server.py
```

## Available Tools

### search_issues
Search for issues using YouTrack query language.
- **Parameters**: 
  - `query` (string): YouTrack search query
  - `max_results` (number, optional): Maximum results to return (default: 20)

### get_issue
Get detailed information about a specific issue.
- **Parameters**:
  - `issue_id` (string): Issue ID (e.g., "PROJ-123")

### create_issue
Create a new issue in YouTrack.
- **Parameters**:
  - `project_id` (string): Project ID
  - `summary` (string): Issue summary
  - `description` (string, optional): Issue description

### update_issue
Update an existing issue.
- **Parameters**:
  - `issue_id` (string): Issue ID
  - `fields` (object): Fields to update

### add_comment
Add a comment to an issue.
- **Parameters**:
  - `issue_id` (string): Issue ID
  - `comment` (string): Comment text

### list_projects
List all accessible projects.

## Resources

The server exposes issue data as resources that can be read by AI assistants:
- `youtrack://issue/{issue_id}` - Individual issue details
- `youtrack://project/{project_id}` - Project information

## Development

### Testing
```bash
python -m pytest tests/
```

### Code Style
```bash
black server.py
pylint server.py
```

## Security Notes

- Never commit your API token to version control
- Use environment variables or secure configuration management
- Implement rate limiting for production use
- Review and audit API access regularly

## License

MIT License - See LICENSE file for details
