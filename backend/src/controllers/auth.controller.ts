import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );

  sendSuccess(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, user);
}
