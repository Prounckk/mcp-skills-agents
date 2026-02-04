/**
 * Zod schemas for input validation
 */

import { z } from "zod";
import { ResponseFormat } from "../types.js";
import { MAX_ISSUES_PER_PAGE, DEFAULT_ISSUES_PER_PAGE } from "../constants.js";

// Response format schema
export const ResponseFormatSchema = z.nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable");

// Pagination schemas
export const LimitSchema = z.number()
  .int()
  .min(1, "Limit must be at least 1")
  .max(MAX_ISSUES_PER_PAGE, `Limit cannot exceed ${MAX_ISSUES_PER_PAGE}`)
  .default(DEFAULT_ISSUES_PER_PAGE)
  .describe("Maximum number of results to return");

export const OffsetSchema = z.number()
  .int()
  .min(0, "Offset cannot be negative")
  .default(0)
  .describe("Number of results to skip for pagination");

// Get issue schema
export const GetIssueInputSchema = z.object({
  issue_id: z.string()
    .min(1, "Issue ID is required")
    .describe("Issue ID (e.g., 'DEV-516' or entity ID)"),
  response_format: ResponseFormatSchema
}).strict();

// Search issues schema
export const SearchIssuesInputSchema = z.object({
  query: z.string()
    .min(1, "Query is required")
    .describe("JQL (YouTrack Query Language) search query (e.g., 'project: DEV State: Open')"),
  limit: LimitSchema,
  offset: OffsetSchema,
  response_format: ResponseFormatSchema
}).strict();

// Custom field value schema (flexible for different field types)
const CustomFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    value: z.union([z.string(), z.number(), z.boolean()]).optional()
  }).passthrough(),
  z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional()
  }).passthrough())
]);

// Custom field input schema
const CustomFieldInputSchema = z.object({
  name: z.string()
    .min(1, "Field name is required")
    .describe("Custom field name (e.g., 'Stage', 'Priority', 'Kanban State')"),
  value: CustomFieldValueSchema
    .describe("Field value - can be string, number, or object with id/name for enum fields")
}).strict();

// Create issue schema
export const CreateIssueInputSchema = z.object({
  project_id: z.string()
    .min(1, "Project ID is required")
    .describe("Project ID or short name (e.g., 'DEV', 'PROJ-123')"),
  summary: z.string()
    .min(1, "Summary is required")
    .max(500, "Summary cannot exceed 500 characters")
    .describe("Issue summary/title"),
  description: z.string()
    .optional()
    .describe("Issue description (supports markdown)"),
  parent_issue_id: z.string()
    .optional()
    .describe("Parent issue ID for subtasks (e.g., 'DEV-516')"),
  custom_fields: z.array(CustomFieldInputSchema)
    .optional()
    .describe("Array of custom field values to set"),
  response_format: ResponseFormatSchema
}).strict();

// Update issue schema
export const UpdateIssueInputSchema = z.object({
  issue_id: z.string()
    .min(1, "Issue ID is required")
    .describe("Issue ID to update (e.g., 'DEV-516')"),
  summary: z.string()
    .min(1, "Summary cannot be empty")
    .max(500, "Summary cannot exceed 500 characters")
    .optional()
    .describe("New issue summary/title"),
  description: z.string()
    .optional()
    .describe("New issue description (supports markdown)"),
  custom_fields: z.array(CustomFieldInputSchema)
    .optional()
    .describe("Array of custom field values to update"),
  response_format: ResponseFormatSchema
}).strict();

// List custom fields schema
export const ListCustomFieldsInputSchema = z.object({
  response_format: ResponseFormatSchema
}).strict();

// Get custom field schema
export const GetCustomFieldInputSchema = z.object({
  field_id_or_name: z.string()
    .min(1, "Field ID or name is required")
    .describe("Custom field ID or name (e.g., 'Stage', 'Priority')"),
  response_format: ResponseFormatSchema
}).strict();

// Type exports
export type GetIssueInput = z.infer<typeof GetIssueInputSchema>;
export type SearchIssuesInput = z.infer<typeof SearchIssuesInputSchema>;
export type CreateIssueInput = z.infer<typeof CreateIssueInputSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueInputSchema>;
export type ListCustomFieldsInput = z.infer<typeof ListCustomFieldsInputSchema>;
export type GetCustomFieldInput = z.infer<typeof GetCustomFieldInputSchema>;
