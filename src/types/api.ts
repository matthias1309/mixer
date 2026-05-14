// API Response types

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}
