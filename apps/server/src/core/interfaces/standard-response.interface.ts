export interface StandardResponse<T> {
  success: boolean;
  data: T;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId: string;
}
