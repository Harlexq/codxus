export interface StandardResponse<T> {
  success: boolean;
  data: T;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId: string;
}

export interface ErrorResponse {
  success: boolean;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId: string;
}
