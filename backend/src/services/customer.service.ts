import { Prisma, CustomerStatus, CustomerType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { parsePagination, getPaginationMeta } from '../utils/pagination';

interface CustomerFilters {
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
  page?: number;
  limit?: number;
}

export async function listCustomers(filters: CustomerFilters) {
  const { page, limit } = parsePagination(filters);
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = { isActive: true };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { mobile: { contains: filters.search } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { businessName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.status) where.status = filters.status;
  if (filters.customerType) where.customerType = filters.customerType;

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { challans: true, followUps: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data: customers, pagination: getPaginationMeta(total, page, limit) };
}

export async function getCustomerById(id: string) {
  return prisma.customer.findFirst({
    where: { id, isActive: true },
    include: {
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      },
      challans: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          challanNumber: true,
          status: true,
          totalAmount: true,
          totalQuantity: true,
          createdAt: true,
        },
      },
      _count: { select: { challans: true, followUps: true } },
    },
  });
}

export async function createCustomer(data: Prisma.CustomerCreateInput) {
  return prisma.customer.create({ data });
}

export async function updateCustomer(id: string, data: Prisma.CustomerUpdateInput) {
  return prisma.customer.update({ where: { id }, data });
}

export async function softDeleteCustomer(id: string) {
  return prisma.customer.update({ where: { id }, data: { isActive: false } });
}

export async function addFollowUp(
  customerId: string,
  createdById: string,
  note: string,
  followUpDate?: string
) {
  return prisma.$transaction(async (tx) => {
    const followUp = await tx.customerFollowUp.create({
      data: {
        customerId,
        createdById,
        note,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Update the customer's follow-up date if provided
    if (followUpDate) {
      await tx.customer.update({
        where: { id: customerId },
        data: { followUpDate: new Date(followUpDate) },
      });
    }

    return followUp;
  });
}

export async function getFollowUps(customerId: string) {
  return prisma.customerFollowUp.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });
}
