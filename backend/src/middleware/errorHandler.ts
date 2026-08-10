import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err);

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      sendError(res, `A record with this ${field} already exists`, 409);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Invalid data provided', 400);
    return;
  }

  // Generic error
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  sendError(res, message, statusCode);
}

export function notFound(req: Request, res: Response): void {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
}
