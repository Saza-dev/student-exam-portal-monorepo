import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export interface ErrorResponse {
  error: {
    code: number;
    message: string;
    request_id?: string;
    details?: Record<string, any>;
  };
}

export interface ErrorHandlerEnv {
  Bindings: {
    ENVIRONMENT?: "development" | "production";
  };
}

/**
 * Standardized API Error Response
 */
export const createErrorResponse = (
  code: number,
  message: string,
  requestId?: string,
  details?: Record<string, any>,
): ErrorResponse => {
  return {
    error: {
      code,
      message,
      ...(requestId && { request_id: requestId }),
      ...(details && { details }),
    },
  };
};

/**
 * Error Handler Middleware
 * Catches errors and returns standardized error responses
 */
export const errorHandler = async (
  err: Error | HTTPException,
  c: Context<ErrorHandlerEnv>,
) => {
  const requestId = c.req.header("X-Request-ID") || "unknown";
  const isDevelopment = c.env.ENVIRONMENT === "development";

  if (err instanceof HTTPException) {
    const status = err.status;
    return c.json(createErrorResponse(status, err.message, requestId), status);
  }

  const statusCode = (err as any).statusCode || 500;
  const isDatabaseError =
    err.message.includes("database") || err.message.includes("db");
  const isValidationError =
    err.message.includes("validation") || err.message.includes("parse");

  let message = "Internal Server Error";
  if (isValidationError) {
    message = "Validation Error";
  } else if (isDatabaseError) {
    message = isDevelopment ? err.message : "Database Error";
  } else {
    message = isDevelopment ? err.message : "An error occurred";
  }

  return c.json(
    createErrorResponse(
      statusCode,
      message,
      requestId,
      isDevelopment ? { error: err.message } : undefined,
    ),
    statusCode,
  );
};
