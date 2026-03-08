import {
  ApiResponse,
  SuccessResponse,
  ErrorResponseType,
} from "@assessment/types";

/**
 * Create a successful API response
 */
export function successResponse<T = any>(
  data: T,
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  },
): SuccessResponse<T> {
  return {
    data,
    ...(meta && { meta }),
  };
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: number,
  message: string,
  requestId?: string,
  details?: Record<string, any>,
): ErrorResponseType {
  return {
    error: {
      code,
      message,
      ...(requestId && { request_id: requestId }),
      ...(details && { details }),
    },
  };
}

/**
 * Parse API response
 */
export function parseResponse<T = any>(response: ApiResponse<T>): T | null {
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data ?? null;
}
