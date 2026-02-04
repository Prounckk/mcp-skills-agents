/**
 * TypeScript type definitions for YouTrack API
 */

// Response format enum
export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

// Base types
export interface YouTrackUser {
  id: string;
  login?: string;
  fullName?: string;
  email?: string;
  $type?: string;
}

export interface YouTrackProject {
  id: string;
  name: string;
  shortName: string;
  $type?: string;
}

// Custom field value types
export interface CustomFieldValue {
  $type: string;
  id?: string;
  name?: string;
  value?: string | number | boolean;
  text?: string;
  minutes?: number;
  presentation?: string;
  [key: string]: any;
}

export interface IssueCustomField {
  $type: string;
  id: string;
  name: string;
  value: CustomFieldValue | CustomFieldValue[] | null;
  projectCustomField?: {
    id: string;
    field: {
      id: string;
      name: string;
    };
  };
}

// Issue types
export interface YouTrackIssue {
  $type: string;
  id: string;
  idReadable: string;
  summary: string;
  description?: string;
  created: number;
  updated: number;
  resolved?: number;
  numberInProject: number;
  project: YouTrackProject;
  reporter?: YouTrackUser;
  updater?: YouTrackUser;
  customFields?: IssueCustomField[];
  [key: string]: any;
}

export interface IssueSearchResult {
  total: number;
  count: number;
  offset: number;
  issues: YouTrackIssue[];
  has_more: boolean;
  next_offset?: number;
  truncated?: boolean;
  truncation_message?: string;
}

// Custom field definition types
export interface FieldType {
  id: string;
  valueType: string;
  $type?: string;
}

export interface CustomFieldDefinition {
  $type: string;
  id: string;
  name: string;
  localizedName?: string;
  fieldType: FieldType;
  isPublic: boolean;
  isReadOnly: boolean;
  isAutoAttached: boolean;
  ordinal: number;
  bundle?: {
    id: string;
    isUpdateable: boolean;
    values?: Array<{
      id: string;
      name: string;
      description?: string;
      ordinal?: number;
    }>;
  };
}

export interface CustomFieldsListResult {
  total: number;
  count: number;
  fields: CustomFieldDefinition[];
}

// API error type
export interface YouTrackError {
  error: string;
  error_description?: string;
  error_code?: string;
}

// Create/Update issue types
export interface CreateIssueInput {
  project: {
    id: string;
  };
  summary: string;
  description?: string;
  customFields?: Array<{
    name: string;
    $type: string;
    value: any;
  }>;
}

export interface UpdateIssueInput {
  summary?: string;
  description?: string;
  customFields?: Array<{
    name: string;
    $type: string;
    value: any;
  }>;
}
