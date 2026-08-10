import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import * as CustomerService from '../services/customer.service';
import { CustomerStatus, CustomerType } from '@prisma/client';

export async function listCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { search, status, customerType, page, limit } = req.query;

  const result = await CustomerService.listCustomers({
    search: search as string | undefined,
    status: status as CustomerStatus | undefined,
    customerType: customerType as CustomerType | undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  sendSuccess(res, result);
}

export async function getCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const customer = await CustomerService.getCustomerById(req.params.id);

  if (!customer) {
    sendError(res, 'Customer not found', 404);
    return;
  }

  sendSuccess(res, customer);
}

export async function createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = req.body;

  const customer = await CustomerService.createCustomer({
    name: data.name,
    mobile: data.mobile,
    email: data.email || null,
    businessName: data.businessName || null,
    gstNumber: data.gstNumber || null,
    customerType: data.customerType,
    address: data.address || null,
    status: data.status || 'LEAD',
    followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    notes: data.notes || null,
  });

  sendSuccess(res, customer, 'Customer created successfully', 201);
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const existing = await CustomerService.getCustomerById(req.params.id);

  if (!existing) {
    sendError(res, 'Customer not found', 404);
    return;
  }

  const data = req.body;
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.mobile !== undefined) updateData.mobile = data.mobile;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.businessName !== undefined) updateData.businessName = data.businessName || null;
  if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber || null;
  if (data.customerType !== undefined) updateData.customerType = data.customerType;
  if (data.address !== undefined) updateData.address = data.address || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.followUpDate !== undefined)
    updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const customer = await CustomerService.updateCustomer(req.params.id, updateData);
  sendSuccess(res, customer, 'Customer updated successfully');
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const existing = await CustomerService.getCustomerById(req.params.id);

  if (!existing) {
    sendError(res, 'Customer not found', 404);
    return;
  }

  await CustomerService.softDeleteCustomer(req.params.id);
  sendSuccess(res, null, 'Customer deleted successfully');
}

export async function addFollowUp(req: AuthenticatedRequest, res: Response): Promise<void> {
  const customer = await CustomerService.getCustomerById(req.params.id);

  if (!customer) {
    sendError(res, 'Customer not found', 404);
    return;
  }

  const { note, followUpDate } = req.body;
  const followUp = await CustomerService.addFollowUp(
    req.params.id,
    req.user!.userId,
    note,
    followUpDate
  );

  sendSuccess(res, followUp, 'Follow-up added successfully', 201);
}

export async function getFollowUps(req: AuthenticatedRequest, res: Response): Promise<void> {
  const customer = await CustomerService.getCustomerById(req.params.id);

  if (!customer) {
    sendError(res, 'Customer not found', 404);
    return;
  }

  const followUps = await CustomerService.getFollowUps(req.params.id);
  sendSuccess(res, followUps);
}
