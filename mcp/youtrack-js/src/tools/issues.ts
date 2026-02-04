/**
 * Issue management tools for YouTrack
 */

import { getApiClient } from "../services/api.js";
import { CHARACTER_LIMIT, ISSUE_FIELDS } from "../constants.js";
import type {
  YouTrackIssue,
  IssueSearchResult,
  ResponseFormat,
  IssueCustomField,
  CustomFieldValue
} from "../types.js";
import type {
  GetIssueInput,
  SearchIssuesInput,
  CreateIssueInput,
  UpdateIssueInput
} from "../schemas/index.js";

/**
 * Format a custom field value for display
 */
function formatCustomFieldValue(field: IssueCustomField): string {
  if (!field.value) return "Not set";

  const value = field.value;

  // Handle array values (multi-enum, multi-user, etc.)
  if (Array.isArray(value)) {
    return value.map((v: CustomFieldValue) => v.name || v.id || String(v)).join(", ");
  }

  // Handle object values (enum, user, state, etc.)
  if (typeof value === "object") {
    return value.name || value.id || value.text || String(value.value) || "Unknown";
  }

  // Handle primitive values
  return String(value);
}

/**
 * Format issue as markdown
 */
function formatIssueMarkdown(issue: YouTrackIssue): string {
  const lines: string[] = [];

  lines.push(`# ${issue.idReadable}: ${issue.summary}`);
  lines.push("");
  lines.push(`**Project**: ${issue.project.name} (${issue.project.shortName})`);
  lines.push(`**Number**: #${issue.numberInProject}`);
  lines.push(`**ID**: ${issue.id}`);
  lines.push("");

  if (issue.description) {
    lines.push(`## Description`);
    lines.push(issue.description);
    lines.push("");
  }

  // Reporter and dates
  if (issue.reporter) {
    lines.push(`**Reporter**: ${issue.reporter.fullName || issue.reporter.login || issue.reporter.id}`);
  }
  lines.push(`**Created**: ${new Date(issue.created).toLocaleString()}`);
  lines.push(`**Updated**: ${new Date(issue.updated).toLocaleString()}`);
  if (issue.resolved) {
    lines.push(`**Resolved**: ${new Date(issue.resolved).toLocaleString()}`);
  }
  lines.push("");

  // Custom fields
  if (issue.customFields && issue.customFields.length > 0) {
    lines.push(`## Custom Fields`);
    lines.push("");
    for (const field of issue.customFields) {
      const value = formatCustomFieldValue(field);
      lines.push(`- **${field.name}**: ${value}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format multiple issues as markdown
 */
function formatIssuesMarkdown(result: IssueSearchResult, query?: string): string {
  const lines: string[] = [];

  if (query) {
    lines.push(`# Search Results: "${query}"`);
  } else {
    lines.push(`# Issues`);
  }
  lines.push("");
  lines.push(`Found ${result.total} issues (showing ${result.count})`);
  lines.push("");

  for (const issue of result.issues) {
    lines.push(`## ${issue.idReadable}: ${issue.summary}`);
    lines.push(`- **Project**: ${issue.project.shortName}`);
    lines.push(`- **Updated**: ${new Date(issue.updated).toLocaleString()}`);

    // Show key custom fields
    if (issue.customFields) {
      const keyFields = issue.customFields.filter(f =>
        ["State", "Stage", "Priority", "Type", "Kanban State"].includes(f.name)
      );
      if (keyFields.length > 0) {
        const fieldValues = keyFields.map(f => `${f.name}: ${formatCustomFieldValue(f)}`).join(", ");
        lines.push(`- ${fieldValues}`);
      }
    }
    lines.push("");
  }

  if (result.has_more) {
    lines.push(`*More results available. Use offset=${result.next_offset} to see more.*`);
  }

  if (result.truncated && result.truncation_message) {
    lines.push("");
    lines.push(`⚠️ ${result.truncation_message}`);
  }

  return lines.join("\n");
}

/**
 * Get a single issue by ID
 */
export async function getIssue(params: GetIssueInput): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent?: any }> {
  try {
    const client = getApiClient();

    const issue = await client.get<YouTrackIssue>(
      `/issues/${params.issue_id}`,
      { fields: ISSUE_FIELDS }
    );

    const output = {
      issue: {
        id: issue.id,
        idReadable: issue.idReadable,
        summary: issue.summary,
        description: issue.description,
        project: issue.project,
        reporter: issue.reporter,
        created: issue.created,
        updated: issue.updated,
        resolved: issue.resolved,
        numberInProject: issue.numberInProject,
        customFields: issue.customFields?.map(f => ({
          name: f.name,
          value: f.value,
          type: f.$type
        }))
      }
    };

    const textContent = params.response_format === "markdown"
      ? formatIssueMarkdown(issue)
      : JSON.stringify(output, null, 2);

    return {
      content: [{ type: "text", text: textContent }],
      structuredContent: output
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error retrieving issue: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

/**
 * Search issues using JQL
 */
export async function searchIssues(params: SearchIssuesInput): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent?: any }> {
  try {
    const client = getApiClient();

    const response = await client.get<YouTrackIssue[]>(
      "/issues",
      {
        query: params.query,
        fields: ISSUE_FIELDS,
        $skip: params.offset,
        $top: params.limit
      }
    );

    const issues = Array.isArray(response) ? response : [];
    const total = issues.length; // Note: YouTrack doesn't return total count in basic search

    const result: IssueSearchResult = {
      total,
      count: issues.length,
      offset: params.offset,
      issues,
      has_more: issues.length === params.limit,
      next_offset: issues.length === params.limit ? params.offset + params.limit : undefined
    };

    // Check character limit
    let textContent = params.response_format === "markdown"
      ? formatIssuesMarkdown(result, params.query)
      : JSON.stringify(result, null, 2);

    if (textContent.length > CHARACTER_LIMIT) {
      // Truncate results
      const truncatedIssues = issues.slice(0, Math.max(1, Math.floor(issues.length / 2)));
      result.issues = truncatedIssues;
      result.count = truncatedIssues.length;
      result.truncated = true;
      result.truncation_message = `Response truncated from ${issues.length} to ${truncatedIssues.length} issues. Use 'offset' or add more specific filters to your query.`;

      textContent = params.response_format === "markdown"
        ? formatIssuesMarkdown(result, params.query)
        : JSON.stringify(result, null, 2);
    }

    return {
      content: [{ type: "text", text: textContent }],
      structuredContent: result
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error searching issues: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

/**
 * Create a new issue
 */
export async function createIssue(params: CreateIssueInput): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent?: any }> {
  try {
    const client = getApiClient();

    // Build request body
    const body: any = {
      project: {
        id: params.project_id
      },
      summary: params.summary
    };

    if (params.description) {
      body.description = params.description;
    }

    // Add custom fields
    if (params.custom_fields && params.custom_fields.length > 0) {
      body.customFields = params.custom_fields.map(field => {
        // Determine field type based on value
        let fieldValue: any;
        let fieldType = "SimpleIssueCustomField"; // Default type

        if (typeof field.value === "string") {
          // Try to determine if it's an enum by checking if it's a single word/name
          fieldType = "SingleEnumIssueCustomField";
          fieldValue = { name: field.value };
        } else if (typeof field.value === "number") {
          fieldType = "SimpleIssueCustomField";
          fieldValue = field.value;
        } else if (typeof field.value === "object" && field.value !== null) {
          // Complex value
          fieldValue = field.value;
          fieldType = "SingleEnumIssueCustomField";
        }

        return {
          name: field.name,
          $type: fieldType,
          value: fieldValue
        };
      });
    }

    const issue = await client.post<YouTrackIssue>(
      "/issues",
      body,
      { fields: ISSUE_FIELDS }
    );

    // Set parent issue if specified (must be done after creation)
    if (params.parent_issue_id) {
      try {
        await client.post(
          `/issues/${issue.id}/links`,
          {
            issues: [{ id: params.parent_issue_id }],
            linkType: { name: "Subtask" }
          }
        );
      } catch (linkError) {
        // Continue even if parent linking fails
        console.error("Warning: Failed to set parent issue:", linkError);
      }
    }

    const output = {
      success: true,
      issue: {
        id: issue.id,
        idReadable: issue.idReadable,
        summary: issue.summary,
        project: issue.project,
        customFields: issue.customFields?.map(f => ({
          name: f.name,
          value: f.value
        }))
      }
    };

    const textContent = params.response_format === "markdown"
      ? `# Issue Created Successfully\n\n**ID**: ${issue.idReadable}\n**Summary**: ${issue.summary}\n**Project**: ${issue.project.name}\n\nView at: ${client["baseUrl"]}/issue/${issue.idReadable}`
      : JSON.stringify(output, null, 2);

    return {
      content: [{ type: "text", text: textContent }],
      structuredContent: output
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error creating issue: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

/**
 * Update an existing issue
 */
export async function updateIssue(params: UpdateIssueInput): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent?: any }> {
  try {
    const client = getApiClient();

    // Build request body
    const body: any = {};

    if (params.summary) {
      body.summary = params.summary;
    }

    if (params.description !== undefined) {
      body.description = params.description;
    }

    // Update basic fields first
    if (params.summary || params.description !== undefined) {
      await client.post(
        `/issues/${params.issue_id}`,
        body,
        { fields: ISSUE_FIELDS }
      );
    }

    // Update custom fields separately
    if (params.custom_fields && params.custom_fields.length > 0) {
      for (const field of params.custom_fields) {
        let fieldValue: any;

        if (typeof field.value === "string") {
          fieldValue = { name: field.value };
        } else if (typeof field.value === "number") {
          fieldValue = field.value;
        } else {
          fieldValue = field.value;
        }

        // Update each custom field individually
        await client.post(
          `/issues/${params.issue_id}/customFields/${field.name}`,
          { value: fieldValue }
        );
      }
    }

    // Fetch updated issue
    const issue = await client.get<YouTrackIssue>(
      `/issues/${params.issue_id}`,
      { fields: ISSUE_FIELDS }
    );

    const output = {
      success: true,
      issue: {
        id: issue.id,
        idReadable: issue.idReadable,
        summary: issue.summary,
        updated: issue.updated,
        customFields: issue.customFields?.map(f => ({
          name: f.name,
          value: f.value
        }))
      }
    };

    const textContent = params.response_format === "markdown"
      ? `# Issue Updated Successfully\n\n**ID**: ${issue.idReadable}\n**Summary**: ${issue.summary}\n**Updated**: ${new Date(issue.updated).toLocaleString()}`
      : JSON.stringify(output, null, 2);

    return {
      content: [{ type: "text", text: textContent }],
      structuredContent: output
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error updating issue: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}
