import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as CustomerService from '../../services/customer.service';
import { Customer, PaginatedData } from '../../types';
import { PageSpinner } from '../../components/ui/Spinner';
import { CustomerStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export function CustomersPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [result, setResult] = useState<PaginatedData<Customer> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await CustomerService.getCustomers({ search, status: statusFilter || undefined, customerType: typeFilter || undefined, page, limit: 15 });
      setResult(data);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setIsLoading(false); }
  }, [search, statusFilter, typeFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await CustomerService.deleteCustomer(deleteId);
      toast.success('Customer deleted');
      setDeleteId(null);
      load();
    } catch (e) { toast.error(getApiErrorMessage(e)); }
    finally { setIsDeleting(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer relationships</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <Link to="/customers/new" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Customer
          </Link>
        )}
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search name, mobile, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>

        {isLoading ? <PageSpinner /> : error ? (
          <div className="alert alert-error">{error}</div>
        ) : !result?.data.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">No customers found</div>
            <div className="empty-state-sub">
              {search || statusFilter || typeFilter ? 'Try adjusting your filters.' : 'Add your first customer to get started.'}
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name / Business</th>
                    <th>Mobile</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Follow-up</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          <Link to={`/customers/${c.id}`} style={{ color: 'var(--primary)' }}>{c.name}</Link>
                        </div>
                        {c.businessName && <div className="td-muted">{c.businessName}</div>}
                      </td>
                      <td>{c.mobile}</td>
                      <td><span className="badge badge-blue">{c.customerType}</span></td>
                      <td><CustomerStatusBadge status={c.status} /></td>
                      <td className="td-muted">
                        {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/customers/${c.id}`)} title="View">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>
                          {hasRole('ADMIN', 'SALES') && (
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/customers/${c.id}/edit`)} title="Edit">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                          )}
                          {hasRole('ADMIN') && (
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(c.id)} title="Delete" style={{ color: 'var(--danger)' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={result.pagination.page}
              totalPages={result.pagination.totalPages}
              total={result.pagination.total}
              limit={result.pagination.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
