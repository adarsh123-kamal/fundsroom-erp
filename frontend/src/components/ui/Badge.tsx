import { ChallanStatus, CustomerStatus, MovementType, Role } from '../../types';

export function ChallanStatusBadge({ status }: { status: ChallanStatus }) {
  const map: Record<ChallanStatus, string> = {
    DRAFT: 'badge badge-yellow',
    CONFIRMED: 'badge badge-green',
    CANCELLED: 'badge badge-gray',
  };
  return <span className={map[status]}>{status}</span>;
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const map: Record<CustomerStatus, string> = {
    LEAD: 'badge badge-blue',
    ACTIVE: 'badge badge-green',
    INACTIVE: 'badge badge-gray',
  };
  return <span className={map[status]}>{status}</span>;
}

export function MovementTypeBadge({ type }: { type: MovementType }) {
  return (
    <span className={`badge ${type === 'IN' ? 'badge-green' : 'badge-orange'}`}>{type}</span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, string> = {
    ADMIN: 'badge badge-purple',
    SALES: 'badge badge-blue',
    WAREHOUSE: 'badge badge-orange',
    ACCOUNTS: 'badge badge-teal',
  };
  return <span className={map[role] ?? 'badge badge-gray'}>{role}</span>;
}
