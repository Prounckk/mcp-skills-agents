#!/usr/bin/env node
/**
 * YouTrack MCP Server
 *
 * Provides comprehensive integration with YouTrack REST API including:
 * - Issue CRUD operations with full custom fields support
 * - JQL-based search with pagination
 * - Custom field discovery and management
 * - Support for all YouTrack field types
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeApiClient } from "./services/api.js";
import { getIssue, searchIssues, createIssue, updateIssue } from "./tools/issues.js";
import { listCustomFields, getCustomField } from "./tools/fields.js";
import {
  GetIssueInputSchema,
  SearchIssuesInputSchema,
  CreateIssueInputSchema,
  UpdateIssueInputSchema,
  ListCustomFieldsInputSchema,
  GetCustomFieldInputSchema
} from "./schemas/index.js";

// Validate environment variables
function validateEnvironment(): { baseUrl: string; token: string } {
  const baseUrl = process.env.YOUTRACK_URL;
  const token = process.env.YOUTRACK_TOKEN;

  if (!baseUrl) {
    console.error("ERROR: YOUTRACK_URL environment variable is required");
    console.error("Example: export YOUTRACK_URL=https://youtrack.example.com");
    process.exit(1);
  }

  if (!token) {
    console.error("ERROR: YOUTRACK_TOKEN environment variable is required");
    console.error("Example: export YOUTRACK_TOKEN=perm:your_permanent_token");
    process.exit(1);
  }

  return { baseUrl, token };
}

// Main function
async function main() {
  // Validate and get configuration
  const { baseUrl, token } = validateEnvironment();

  // Initialize API client
  initializeApiClient(baseUrl, token);

  // Create MCP server
  const server = new McpServer({
    name: "youtrack-mcp-server",
    version: "1.0.0"
  });

  // Register tool: Get Issue
  server.registerTool(
    "youtrack_get_issue",
    {
      title: "Get YouTrack Issue",
      description: `Retrieve detailed information about a specific YouTrack issue by ID.

Returns complete issue details including summary, description, project, reporter, timestamps, and all custom field values. This is useful when you need full details about a specific issue, including custom fields like Stage, Priority, Kanban State, etc.

Args:
  - issue_id (string): Issue ID, either human-readable (e.g., "DEV-516") or entity ID
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "issue": {
      "id": string,              // Entity ID
      "idReadable": string,      // Human-readable ID (e.g., "DEV-516")
      "summary": string,         // Issue title
      "description": string,     // Issue description
      "project": {
        "id": string,
        "name": string,
        "shortName": string
      },
      "reporter": {
        "id": string,
        "login": string,
        "fullName": string,
        "email": string
      },
      "created": number,         // Unix timestamp
      "updated": number,         // Unix timestamp
      "resolved": number,        // Unix timestamp (optional)
      "numberInProject": number, // Issue number
      "customFields": [
        {
          "name": string,        // e.g., "Stage", "Priority", "Kanban State"
          "value": any,          // Field value (varies by type)
          "type": string         // Field type (e.g., "SingleEnumIssueCustomField")
        }
      ]
    }
  }

Examples:
  - Use when: "Get details for issue DEV-516" -> params with issue_id="DEV-516"
  - Use when: "Show me issue PROJ-123" -> params with issue_id="PROJ-123"
  - Don't use when: You need to search for issues (use youtrack_search_issues instead)`,
      inputSchema: GetIssueInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    getIssue
  );

  // Register tool: Search Issues
  server.registerTool(
    "youtrack_search_issues",
    {
      title: "Search YouTrack Issues",
      description: `Search for YouTrack issues using JQL (YouTrack Query Language).

Supports full JQL syntax for complex queries including project filters, custom field filters, text search, and logical operators. Returns paginated results with issue details and custom fields.

Args:
  - query (string): JQL query string (e.g., "project: DEV State: Open", "Kanban State: Ready to pull")
  - limit (number): Maximum results to return (1-100, default: 20)
  - offset (number): Number of results to skip for pagination (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

JQL Examples:
  - By project: "project: DEV"
  - By state: "State: Open"
  - By custom field: "Kanban State: {Ready to pull}" or "Stage: Todo"
  - By assignee: "for: me" or "Assignee: john.doe"
  - Combined: "project: DEV State: Open Kanban State: {Ready to pull}"
  - Text search: "summary: authentication bug"
  - Date filters: "created: Today" or "updated: {Last week}"

Returns:
  For JSON format: Structured data with schema:
  {
    "total": number,           // Total matching issues
    "count": number,           // Number in this response
    "offset": number,          // Current pagination offset
    "issues": [
      {
        "id": string,
        "idReadable": string,
        "summary": string,
        "project": object,
        "customFields": array
      }
    ],
    "has_more": boolean,       // Whether more results available
    "next_offset": number,     // Offset for next page (if has_more)
    "truncated": boolean,      // Whether results were truncated
    "truncation_message": string
  }

Examples:
  - Use when: "Find all issues in DEV project" -> query="project: DEV"
  - Use when: "Show open issues ready to pull" -> query="State: Open Kanban State: {Ready to pull}"
  - Use when: "Search for authentication bugs" -> query="summary: authentication State: Open"
  - Don't use when: You have a specific issue ID (use youtrack_get_issue instead)`,
      inputSchema: SearchIssuesInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    searchIssues
  );

  // Register tool: Create Issue
  server.registerTool(
    "youtrack_create_issue",
    {
      title: "Create YouTrack Issue",
      description: `Create a new issue in YouTrack with custom field values.

Creates an issue with the specified summary, description, and custom fields. Supports all custom field types including State, Priority, Stage, Kanban State, etc.

Args:
  - project_id (string): Project ID or short name (e.g., "DEV", "PROJ")
  - summary (string): Issue title/summary (required, max 500 chars)
  - description (string): Issue description (optional, supports markdown)
  - parent_issue_id (string): Parent issue ID for subtasks (optional, e.g., "DEV-516")
  - custom_fields (array): Array of custom field values (optional)
    Each field object has:
    - name (string): Field name (e.g., "Stage", "Priority", "Kanban State")
    - value (string | number | object): Field value
      - For enum fields: string name (e.g., "Todo", "Normal")
      - For numeric fields: number
      - For complex fields: object with id/name
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "success": boolean,
    "issue": {
      "id": string,
      "idReadable": string,
      "summary": string,
      "project": object,
      "customFields": array
    }
  }

Examples:
  - Simple: project_id="DEV", summary="Fix authentication bug"
  - With fields: project_id="DEV", summary="New feature", custom_fields=[
      {"name": "Stage", "value": "Todo"},
      {"name": "Priority", "value": "Normal"},
      {"name": "Kanban State", "value": "Ready to pull"}
    ]
  - With parent: project_id="DEV", summary="Subtask", parent_issue_id="DEV-516"`,
      inputSchema: CreateIssueInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    createIssue
  );

  // Register tool: Update Issue
  server.registerTool(
    "youtrack_update_issue",
    {
      title: "Update YouTrack Issue",
      description: `Update an existing YouTrack issue's summary, description, or custom fields.

Updates the specified issue with new values. You can update summary, description, custom fields, or any combination. Only provided fields will be updated; others remain unchanged.

Args:
  - issue_id (string): Issue ID to update (e.g., "DEV-516")
  - summary (string): New summary/title (optional, max 500 chars)
  - description (string): New description (optional, supports markdown)
  - custom_fields (array): Array of custom field values to update (optional)
    Each field object has:
    - name (string): Field name (e.g., "Stage", "Priority", "Kanban State")
    - value (string | number | object): New field value
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "success": boolean,
    "issue": {
      "id": string,
      "idReadable": string,
      "summary": string,
      "updated": number,
      "customFields": array
    }
  }

Examples:
  - Update summary: issue_id="DEV-516", summary="New title"
  - Update state: issue_id="DEV-516", custom_fields=[{"name": "Stage", "value": "Done"}]
  - Update multiple: issue_id="DEV-516", custom_fields=[
      {"name": "Kanban State", "value": "In Progress"},
      {"name": "Priority", "value": "High"}
    ]`,
      inputSchema: UpdateIssueInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    updateIssue
  );

  // Register tool: List Custom Fields
  server.registerTool(
    "youtrack_list_custom_fields",
    {
      title: "List YouTrack Custom Fields",
      description: `List all available custom fields in YouTrack with their configurations.

Returns a complete list of custom fields including their types, possible values (for enum fields), and settings. This is useful for discovering what custom fields are available and their valid values before creating or updating issues.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "total": number,
    "fields": [
      {
        "id": string,
        "name": string,          // e.g., "Stage", "Priority", "Kanban State"
        "type": string,          // Field type (e.g., "enum[1]", "state[1]")
        "isPublic": boolean,
        "isReadOnly": boolean,
        "possibleValues": [      // For enum/state fields
          {
            "id": string,
            "name": string,      // e.g., "Todo", "Done", "Normal", "High"
            "description": string
          }
        ]
      }
    ]
  }

Examples:
  - Use when: "What custom fields are available?"
  - Use when: "What are the valid values for Priority?"
  - Use when: "Show me all custom fields" -> Get comprehensive list
  - Don't use when: You need details about a specific field (use youtrack_get_custom_field instead)`,
      inputSchema: ListCustomFieldsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    listCustomFields
  );

  // Register tool: Get Custom Field
  server.registerTool(
    "youtrack_get_custom_field",
    {
      title: "Get YouTrack Custom Field",
      description: `Get detailed information about a specific custom field by ID or name.

Returns complete configuration for a custom field including its type, possible values (for enum fields), and settings. Useful for understanding what values are valid for a specific field.

Args:
  - field_id_or_name (string): Field ID or name (e.g., "Stage", "Priority", "Kanban State")
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format: Structured data with schema:
  {
    "id": string,
    "name": string,
    "localizedName": string,
    "type": string,
    "isPublic": boolean,
    "isReadOnly": boolean,
    "isAutoAttached": boolean,
    "ordinal": number,
    "possibleValues": [
      {
        "id": string,
        "name": string,
        "description": string,
        "ordinal": number
      }
    ]
  }

Examples:
  - Use when: "What are the valid values for Stage?" -> field_id_or_name="Stage"
  - Use when: "Show me Priority field details" -> field_id_or_name="Priority"
  - Use when: "Get Kanban State configuration" -> field_id_or_name="Kanban State"`,
      inputSchema: GetCustomFieldInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    getCustomField
  );

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("YouTrack MCP Server running on stdio");
  console.error(`Connected to: ${baseUrl}`);
}

// Run the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
