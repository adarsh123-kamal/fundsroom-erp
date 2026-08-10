import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as ChallanService from '../../services/challan.service';
import { Challan, PaginatedData, ChallanStatus } from '../../types';
import { PageSpinner } from '../../components/ui/Spinner';
import { ChallanStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';
import { format } from 'date-fns';

export function ChallansPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [result, setResult] = useState<PaginatedData<Challan> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ChallanService.getChallans({
        search: search || undefined,
        status: statusFilter as ChallanStatus || undefined,
        page, limit: 15,
      });
      setResult(data);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setIsLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  function handleStatusChange(val: string) {
    setStatusFilter(val);
    setPage(1);
    if (val) setSearchParams({ status: val }); else setSearchParams({});
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Challans</h1>
          <p className="page-subtitle">Manage sales delivery challans</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <Link to="/challans/new" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Challan
          </Link>
        )}
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" className="form-input search-input" placeholder="Search challan # or customer…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {isLoading ? <PageSpinner /> : error ? (
          <div className="alert alert-error">{error}</div>
        ) : !result?.data.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No challans found</div>
            <div className="empty-state-sub">
              {search || statusFilter ? 'Try adjusting your filters.' : 'Create your first challan.'}
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Total Qty</th>
                    <th>Total Amount</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/challans/${c.id}`} style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}>
                          {c.challanNumber}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.customer.name}</div>
                        {c.customer.businessName && <div className="td-muted">{c.customer.businessName}</div>}
                      </td>
                      <td><ChallanStatusBadge status={c.status} /></td>
                      <td className="td-muted">{c._count?.items ?? '—'}</td>
                      <td>{c.totalQuantity}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(c.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="td-muted">{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/challans/${c.id}`)} title="View">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={result.pagination.limit} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
