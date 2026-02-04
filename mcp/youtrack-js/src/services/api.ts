/**
 * YouTrack API client with authentication and error handling
 */

import axios, { AxiosError, AxiosInstance } from "axios";
import { API_TIMEOUT, ERROR_CODES } from "../constants.js";
import type { YouTrackError } from "../types.js";

export class YouTrackApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.client = axios.create({
      baseURL: `${this.baseUrl}/api`,
      timeout: API_TIMEOUT,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic PATCH request (for partial updates)
   */
  async patch<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.patch<T>(endpoint, data, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<YouTrackError>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        switch (status) {
          case 400:
            return new Error(
              `Validation error: ${data?.error_description || data?.error || "Invalid request parameters. Check your input and try again."}`
            );
          case 401:
            return new Error(
              `Authentication failed: Invalid or expired token. Please check your YOUTRACK_TOKEN environment variable.`
            );
          case 403:
            return new Error(
              `Permission denied: You don't have access to this resource. Check your YouTrack permissions.`
            );
          case 404:
            return new Error(
              `Resource not found: The requested issue, project, or field does not exist. Please verify the ID.`
            );
          case 429:
            return new Error(
              `Rate limit exceeded: Too many requests. Please wait a moment and try again.`
            );
          case 500:
          case 502:
          case 503:
          case 504:
            return new Error(
              `YouTrack server error (${status}): The service is temporarily unavailable. Please try again later.`
            );
          default:
            return new Error(
              `API request failed with status ${status}: ${data?.error_description || data?.error || "Unknown error"}`
            );
        }
      } else if (axiosError.code === "ECONNABORTED") {
        return new Error(
          `Request timeout: The YouTrack server took too long to respond. Please try again.`
        );
      } else if (axiosError.code === "ENOTFOUND" || axiosError.code === "ECONNREFUSED") {
        return new Error(
          `Connection error: Unable to reach YouTrack server at ${this.baseUrl}. Please check the YOUTRACK_URL.`
        );
      }

      return new Error(
        `Network error: ${axiosError.message}. Please check your connection and try again.`
      );
    }

    return error instanceof Error
      ? error
      : new Error(`Unexpected error: ${String(error)}`);
  }
}

// Singleton instance
let apiClient: YouTrackApiClient | null = null;

export function initializeApiClient(baseUrl: string, token: string): YouTrackApiClient {
  apiClient = new YouTrackApiClient(baseUrl, token);
  return apiClient;
}

export function getApiClient(): YouTrackApiClient {
  if (!apiClient) {
    throw new Error("API client not initialized. Call initializeApiClient first.");
  }
  return apiClient;
}
