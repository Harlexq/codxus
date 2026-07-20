import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import type { StandardResponse, ErrorResponse } from 'codxus-shared';
import { api } from './axios';

export const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: process.env.NEXT_PUBLIC_API_URL! }
  ): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
    },
    unknown,
    ErrorResponse
  > =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await api<StandardResponse<unknown>>({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError<ErrorResponse>;
      return {
        error: err.response?.data ?? {
          success: false,
          statusCode: err.response?.status ?? 500,
          error: 'NetworkError',
          message: err.message,
          timestamp: new Date().toISOString(),
          path: url,
          requestId: '',
        },
      };
    }
  };
