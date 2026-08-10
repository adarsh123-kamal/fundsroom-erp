import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import * as ChallanService from '../services/challan.service';
import { ChallanStatus } from '@prisma/client';

export async function listChallans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { status, customerId, search, page, limit } = req.query;

  const result = await ChallanService.listChallans({
    status: status as ChallanStatus | undefined,
    customerId: customerId as string | undefined,
    search: search as string | undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  sendSuccess(res, result);
}

export async function getChallan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const challan = await ChallanService.getChallanById(req.params.id);

  if (!challan) {
    sendError(res, 'Challan not found', 404);
    return;
  }

  sendSuccess(res, challan);
}

export async function createChallan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { customerId, items, notes } = req.body;

  try {
    const challan = await ChallanService.createChallan(
      customerId,
      items,
      req.user!.userId,
      notes
    );
    sendSuccess(res, challan, 'Challan created as draft', 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create challan';
    sendError(res, message, 400);
  }
}

export async function updateChallan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { customerId, items, notes } = req.body;

  try {
    const challan = await ChallanService.updateChallan(
      req.params.id,
      customerId,
      items,
      notes
    );
    sendSuccess(res, challan, 'Challan updated');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update challan';
    const code = message.includes('not found') ? 404 : 400;
    sendError(res, message, code);
  }
}

export async function confirmChallan(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const challan = await ChallanService.confirmChallan(req.params.id, req.user!.userId);
    sendSuccess(res, challan, 'Challan confirmed and stock deducted');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to confirm challan';
    const code =
      message.includes('Insufficient stock') ? 409 :
      message.includes('not found') ? 404 : 400;
    sendError(res, message, code);
  }
}

export async function cancelChallan(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const challan = await ChallanService.cancelChallan(req.params.id);
    sendSuccess(res, challan, 'Challan cancelled');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel challan';
    const code = message.includes('not found') ? 404 : 400;
    sendError(res, message, code);
  }
}

export async function getDashboardStats(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const stats = await ChallanService.getDashboardStats();
  sendSuccess(res, stats);
}
