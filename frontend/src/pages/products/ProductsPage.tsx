import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as ProductService from '../../services/product.service';
import { Product, PaginatedData } from '../../types';
import { PageSpinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export function ProductsPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaginatedData<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ProductService.getProducts({ search, category: category || undefined, page, limit: 15 });
      setResult(data);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setIsLoading(false); }
  }, [search, category, page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await ProductService.deleteProduct(deleteId);
      toast.success('Product deleted');
      setDeleteId(null);
      load();
    } catch (e) { toast.error(getApiErrorMessage(e)); }
    finally { setIsDeleting(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalogue</p>
        </div>
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <Link to="/products/new" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Product
          </Link>
        )}
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" className="form-input search-input" placeholder="Search name, SKU, category…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <input type="text" className="form-input" style={{ width: 'auto', minWidth: 150 }}
            placeholder="Filter by category" value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }} />
          <Link to="/low-stock" className="btn btn-secondary btn-sm">
            ⚠ Low Stock
          </Link>
        </div>

        {isLoading ? <PageSpinner /> : error ? (
          <div className="alert alert-error">{error}</div>
        ) : !result?.data.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No products found</div>
            <div className="empty-state-sub">{search || category ? 'Try different search terms.' : 'Add your first product.'}</div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name / SKU</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Stock</th>
                    <th>Min Stock</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((p) => {
                    const isLow = p.currentStock <= p.minimumStock;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>
                        </td>
                        <td className="td-muted">{p.category || '—'}</td>
                        <td>₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={isLow ? 'stock-low' : 'stock-ok'}>{p.currentStock}</span>
                          {isLow && <span title="Low stock" style={{ marginLeft: 4 }}>⚠</span>}
                        </td>
                        <td className="td-muted">{p.minimumStock}</td>
                        <td className="td-muted">{p.location || '—'}</td>
                        <td>
                          <div className="td-actions">
                            {hasRole('ADMIN', 'WAREHOUSE') && (
                              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/products/${p.id}/edit`)} title="Edit">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                            )}
                            {hasRole('ADMIN') && (
                              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(p.id)} title="Delete" style={{ color: 'var(--danger)' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={result.pagination.limit} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Product" message="Are you sure you want to delete this product? This cannot be undone." confirmLabel="Delete" isLoading={isDeleting} />
    </div>
  );
}
