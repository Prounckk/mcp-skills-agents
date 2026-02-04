#!/usr/bin/env python3
"""
YouTrack MCP Server
Model Context Protocol server for JetBrains YouTrack integration.
"""

import os
import json
import asyncio
from typing import Optional, Any, Dict
import httpx
from mcp.server import Server
from mcp.types import (
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel
)
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
YOUTRACK_URL = os.getenv("YOUTRACK_URL", "")
YOUTRACK_TOKEN = os.getenv("YOUTRACK_API_TOKEN", "")
YOUTRACK_CLOUD = os.getenv("YOUTRACK_CLOUD", "true").lower() == "true"


class YouTrackClient:
    """Client for interacting with YouTrack API."""
    
    def __init__(self, base_url: str, token: str, is_cloud: bool = True):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.is_cloud = is_cloud
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    
    async def search_issues(self, query: str, max_results: int = 20) -> Dict[str, Any]:
        """Search for issues using YouTrack query language."""
        async with httpx.AsyncClient() as client:
            params = {
                "query": query,
                "max": max_results,
                "fields": "id,summary,description,created,updated,resolved,customFields(name,value(name))"
            }
            response = await client.get(
                f"{self.base_url}/api/issues",
                params=params,
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_issue(self, issue_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific issue."""
        async with httpx.AsyncClient() as client:
            params = {
                "fields": "id,summary,description,created,updated,resolved,reporter(name),customFields(name,value(name)),comments(text,author(name),created)"
            }
            response = await client.get(
                f"{self.base_url}/api/issues/{issue_id}",
                params=params,
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def create_issue(self, project_id: str, summary: str, description: str = "") -> Dict[str, Any]:
        """Create a new issue."""
        async with httpx.AsyncClient() as client:
            data = {
                "project": {"id": project_id},
                "summary": summary,
                "description": description
            }
            response = await client.post(
                f"{self.base_url}/api/issues",
                json=data,
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def update_issue(self, issue_id: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing issue."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/issues/{issue_id}",
                json=fields,
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return {"success": True, "issue_id": issue_id}
    
    async def add_comment(self, issue_id: str, comment_text: str) -> Dict[str, Any]:
        """Add a comment to an issue."""
        async with httpx.AsyncClient() as client:
            data = {"text": comment_text}
            response = await client.post(
                f"{self.base_url}/api/issues/{issue_id}/comments",
                json=data,
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def list_projects(self) -> Dict[str, Any]:
        """List all accessible projects."""
        async with httpx.AsyncClient() as client:
            params = {"fields": "id,name,shortName,description"}
            response = await client.get(
                f"{self.base_url}/api/admin/projects",
                params=params,
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()


# Initialize MCP server
app = Server("youtrack-mcp")

# Initialize YouTrack client
youtrack_client = YouTrackClient(YOUTRACK_URL, YOUTRACK_TOKEN, YOUTRACK_CLOUD)


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="search_issues",
            description="Search for issues using YouTrack query language (e.g., 'project: MyProject state: Open')",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "YouTrack search query"
                    },
                    "max_results": {
                        "type": "number",
                        "description": "Maximum number of results to return (default: 20)",
                        "default": 20
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_issue",
            description="Get detailed information about a specific issue by ID (e.g., 'PROJ-123')",
            inputSchema={
                "type": "object",
                "properties": {
                    "issue_id": {
                        "type": "string",
                        "description": "Issue ID (e.g., 'PROJ-123')"
                    }
                },
                "required": ["issue_id"]
            }
        ),
        Tool(
            name="create_issue",
            description="Create a new issue in YouTrack",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_id": {
                        "type": "string",
                        "description": "Project ID where the issue will be created"
                    },
                    "summary": {
                        "type": "string",
                        "description": "Issue summary/title"
                    },
                    "description": {
                        "type": "string",
                        "description": "Detailed issue description",
                        "default": ""
                    }
                },
                "required": ["project_id", "summary"]
            }
        ),
        Tool(
            name="update_issue",
            description="Update fields of an existing issue",
            inputSchema={
                "type": "object",
                "properties": {
                    "issue_id": {
                        "type": "string",
                        "description": "Issue ID to update"
                    },
                    "fields": {
                        "type": "object",
                        "description": "Fields to update (e.g., {\"summary\": \"New title\"})"
                    }
                },
                "required": ["issue_id", "fields"]
            }
        ),
        Tool(
            name="add_comment",
            description="Add a comment to an issue",
            inputSchema={
                "type": "object",
                "properties": {
                    "issue_id": {
                        "type": "string",
                        "description": "Issue ID to comment on"
                    },
                    "comment": {
                        "type": "string",
                        "description": "Comment text"
                    }
                },
                "required": ["issue_id", "comment"]
            }
        ),
        Tool(
            name="list_projects",
            description="List all accessible projects in YouTrack",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls."""
    try:
        if name == "search_issues":
            query = arguments.get("query")
            max_results = arguments.get("max_results", 20)
            result = await youtrack_client.search_issues(query, max_results)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "get_issue":
            issue_id = arguments.get("issue_id")
            result = await youtrack_client.get_issue(issue_id)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "create_issue":
            project_id = arguments.get("project_id")
            summary = arguments.get("summary")
            description = arguments.get("description", "")
            result = await youtrack_client.create_issue(project_id, summary, description)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "update_issue":
            issue_id = arguments.get("issue_id")
            fields = arguments.get("fields")
            result = await youtrack_client.update_issue(issue_id, fields)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "add_comment":
            issue_id = arguments.get("issue_id")
            comment = arguments.get("comment")
            result = await youtrack_client.add_comment(issue_id, comment)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "list_projects":
            result = await youtrack_client.list_projects()
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]


async def main():
    """Run the MCP server."""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
