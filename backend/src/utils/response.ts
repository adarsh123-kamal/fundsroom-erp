import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  const response: ApiResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: string[]
): Response {
  const response: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(response);
}
