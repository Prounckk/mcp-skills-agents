/**
 * Custom fields discovery and management tools
 */

import { getApiClient } from "../services/api.js";
import { CUSTOM_FIELD_FIELDS } from "../constants.js";
import type {
  CustomFieldDefinition,
  CustomFieldsListResult,
  ResponseFormat
} from "../types.js";
import type {
  ListCustomFieldsInput,
  GetCustomFieldInput
} from "../schemas/index.js";

/**
 * Format custom field as markdown
 */
function formatCustomFieldMarkdown(field: CustomFieldDefinition): string {
  const lines: string[] = [];

  lines.push(`# ${field.name}`);
  if (field.localizedName && field.localizedName !== field.name) {
    lines.push(`*Localized: ${field.localizedName}*`);
  }
  lines.push("");
  lines.push(`**ID**: ${field.id}`);
  lines.push(`**Type**: ${field.fieldType.valueType}`);
  lines.push(`**Public**: ${field.isPublic ? "Yes" : "No"}`);
  lines.push(`**Read-only**: ${field.isReadOnly ? "Yes" : "No"}`);
  lines.push(`**Auto-attached**: ${field.isAutoAttached ? "Yes" : "No"}`);
  lines.push("");

  // Show possible values if it's an enum field
  if (field.bundle?.values && field.bundle.values.length > 0) {
    lines.push(`## Possible Values`);
    lines.push("");
    for (const value of field.bundle.values) {
      let line = `- **${value.name}**`;
      if (value.description) {
        line += `: ${value.description}`;
      }
      lines.push(line);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format custom fields list as markdown
 */
function formatCustomFieldsListMarkdown(result: CustomFieldsListResult): string {
  const lines: string[] = [];

  lines.push(`# Custom Fields`);
  lines.push("");
  lines.push(`Total fields: ${result.total}`);
  lines.push("");

  // Group by type
  const fieldsByType = new Map<string, CustomFieldDefinition[]>();
  for (const field of result.fields) {
    const type = field.fieldType.valueType;
    if (!fieldsByType.has(type)) {
      fieldsByType.set(type, []);
    }
    fieldsByType.get(type)!.push(field);
  }

  for (const [type, fields] of fieldsByType.entries()) {
    lines.push(`## ${type} Fields`);
    lines.push("");
    for (const field of fields) {
      lines.push(`### ${field.name}`);
      lines.push(`- **ID**: ${field.id}`);
      lines.push(`- **Public**: ${field.isPublic ? "Yes" : "No"}`);
      lines.push(`- **Read-only**: ${field.isReadOnly ? "Yes" : "No"}`);

      if (field.bundle?.values && field.bundle.values.length > 0) {
        const valueNames = field.bundle.values.map(v => v.name).slice(0, 5);
        if (field.bundle.values.length > 5) {
          valueNames.push(`... (${field.bundle.values.length - 5} more)`);
        }
        lines.push(`- **Values**: ${valueNames.join(", ")}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * List all custom fields
 */
export async function listCustomFields(params: ListCustomFieldsInput): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent?: any }> {
  try {
    const client = getApiClient();

    const fields = await client.get<CustomFieldDefinition[]>(
      "/admin/customFieldSettings/customFields",
      { fields: CUSTOM_FIELD_FIELDS }
    );

    const result: CustomFieldsListResult = {
      total: fields.length,
      count: fields.length,
      fields: fields.sort((a, b) => a.ordinal - b.ordinal)
    };

    const output = {
      total: result.total,
      fields: result.fields.map(f => ({
        id: f.id,
        name: f.name,
        type: f.fieldType.valueType,
        isPublic: f.isPublic,
        isReadOnly: f.isReadOnly,
        possibleValues: f.bundle?.values?.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description
        }))
      }))
    };

    const textContent = params.response_format === "markdown"
      ? formatCustomFieldsListMarkdown(result)
      : JSON.stringify(output, null, 2);

    return {
      content: [{ type: "text", text: textContent }],
      structuredContent: output
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error listing custom fields: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

/**
 * Get a specific custom field by ID or name
 */
export async function getCustomField(params: GetCustomFieldInput): Promise<{ content: Array<{ type: "text"; text: string }>; structuredContent?: any }> {
  try {
    const client = getApiClient();

    // Try to get field by ID or name
    let field: CustomFieldDefinition;
    try {
      // First try as ID
      field = await client.get<CustomFieldDefinition>(
        `/admin/customFieldSettings/customFields/${params.field_id_or_name}`,
        { fields: CUSTOM_FIELD_FIELDS }
      );
    } catch (error) {
      // If failed, search by name
      const allFields = await client.get<CustomFieldDefinition[]>(
        "/admin/customFieldSettings/customFields",
        { fields: CUSTOM_FIELD_FIELDS }
      );

      const matchedField = allFields.find(f =>
        f.name.toLowerCase() === params.field_id_or_name.toLowerCase()
      );

      if (!matchedField) {
        throw new Error(`Custom field not found: ${params.field_id_or_name}`);
      }

      field = matchedField;
    }

    const output = {
      id: field.id,
      name: field.name,
      localizedName: field.localizedName,
      type: field.fieldType.valueType,
      isPublic: field.isPublic,
      isReadOnly: field.isReadOnly,
      isAutoAttached: field.isAutoAttached,
      ordinal: field.ordinal,
      possibleValues: field.bundle?.values?.map(v => ({
        id: v.id,
        name: v.name,
        description: v.description,
        ordinal: v.ordinal
      }))
    };

    const textContent = params.response_format === "markdown"
      ? formatCustomFieldMarkdown(field)
      : JSON.stringify(output, null, 2);

    return {
      content: [{ type: "text", text: textContent }],
      structuredContent: output
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error getting custom field: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}
