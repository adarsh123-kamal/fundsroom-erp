export interface PaginationOptions {
  page: number;
  limit: number;
}

export function parsePagination(query: { page?: number; limit?: number }): PaginationOptions {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  return { page, limit };
}

export function getPaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
