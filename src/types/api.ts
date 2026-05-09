// API types

export interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ApiError {
  status: number;
  error: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  status: 400;
  error: 'Validation failed';
  details: ValidationError[];
}
