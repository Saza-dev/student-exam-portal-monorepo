/**
 * API Response Envelope
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: number;
    message: string;
    request_id?: string;
    details?: Record<string, any>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Success Response Helper Type
 */
export interface SuccessResponse<T = any> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Error Response Helper Type
 */
export interface ErrorResponseType {
  error: {
    code: number;
    message: string;
    request_id?: string;
    details?: Record<string, any>;
  };
}

/**
 * Standard HTTP Error Codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  RATE_LIMIT = 429,
  INTERNAL_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Standardized Error Codes
 */
export enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_EXISTS = 'USER_EXISTS',
  PAPER_NOT_FOUND = 'PAPER_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Authenticated User Type
 */
export interface AuthUser {
  user_id: string;
  email: string;
  role: string;
}

/**
 * Auth Response from backend
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * User Domain Model
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  role?: string;
}

/**
 * Paper Domain Model
 */
export interface Paper {
  id: string;
  title: string;
  subject: string;
  type: 'past_paper' | 'model_paper';
}

/**
 * Exam Session Domain Model
 */
export interface ExamSession {
  id: string;
  userId: string;
  paperId: string;
  status: 'in_progress' | 'submitted' | 'expired';
}

/**
 * Purchase Record Domain Model
 */
export interface PurchaseRecord {
  id: string;
  userId: string;
  paperId: string;
  amountPaid: number;
}
