import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload, AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';
import { Role } from '@prisma/client';

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
}

export function authorize(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'You do not have permission to perform this action', 403);
      return;
    }

    next();
  };
}
