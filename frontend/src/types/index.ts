// ─── Auth ─────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─── API Response ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Customer ──────────────────────────────────────────────────────────────
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { challans: number; followUps: number };
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; role: Role };
}

// ─── Product ───────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  location?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason?: string | null;
  reference?: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  createdBy: { id: string; name: string; role: Role };
}

// ─── Challan ───────────────────────────────────────────────────────────────
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  product?: { id: string; name: string; sku: string; currentStock: number };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount: number;
  notes?: string | null;
  createdById: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; mobile: string; businessName?: string | null };
  createdBy: { id: string; name: string; role: Role };
  items: ChallanItem[];
  _count?: { items: number };
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  draftChallans: number;
  confirmedChallans: number;
  totalStock: number;
  recentChallans: Array<{
    id: string;
    challanNumber: string;
    status: ChallanStatus;
    totalAmount: number;
    totalQuantity: number;
    createdAt: string;
    customer: { id: string; name: string };
    createdBy: { id: string; name: string };
  }>;
}
