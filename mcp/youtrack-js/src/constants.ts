/**
 * Constants and configuration for YouTrack MCP Server
 */

// Response size limits
export const CHARACTER_LIMIT = 25000;
export const MAX_ISSUES_PER_PAGE = 100;
export const DEFAULT_ISSUES_PER_PAGE = 20;

// API Configuration
export const API_TIMEOUT = 30000; // 30 seconds

// Common YouTrack field types
export const FIELD_TYPES = {
  STATE: "StateIssueCustomField",
  ENUM: "SingleEnumIssueCustomField",
  MULTI_ENUM: "MultiEnumIssueCustomField",
  TEXT: "SimpleIssueCustomField",
  DATE: "DateIssueCustomField",
  PERIOD: "PeriodIssueCustomField",
  INTEGER: "SimpleIssueCustomField",
  FLOAT: "SimpleIssueCustomField",
  BUILD: "SingleBuildIssueCustomField",
  VERSION: "SingleVersionIssueCustomField",
  OWN_OWNED: "SingleOwnedIssueCustomField",
  USER: "SingleUserIssueCustomField",
  MULTI_USER: "MultiUserIssueCustomField",
  GROUP: "SingleGroupIssueCustomField"
} as const;

// Error codes
export const ERROR_CODES = {
  AUTHENTICATION: "AUTHENTICATION_ERROR",
  NOT_FOUND: "RESOURCE_NOT_FOUND",
  VALIDATION: "VALIDATION_ERROR",
  RATE_LIMIT: "RATE_LIMIT_EXCEEDED",
  NETWORK: "NETWORK_ERROR",
  UNKNOWN: "UNKNOWN_ERROR"
} as const;

// Common query fields for issues
export const ISSUE_FIELDS = [
  "$type",
  "id",
  "idReadable",
  "summary",
  "description",
  "created",
  "updated",
  "resolved",
  "numberInProject",
  "project(id,name,shortName)",
  "reporter(id,login,fullName,email)",
  "updater(id,login,fullName,email)",
  "customFields(id,name,value,$type)"
].join(",");

// Common query fields for custom fields
export const CUSTOM_FIELD_FIELDS = [
  "$type",
  "id",
  "name",
  "localizedName",
  "fieldType(id,valueType)",
  "isPublic",
  "isReadOnly",
  "isAutoAttached",
  "ordinal"
].join(",");
