import { useEffect, useState, useCallback } from 'react';
import * as ProductService from '../../services/product.service';
import { StockMovement, PaginatedData } from '../../types';
import { PageSpinner, Spinner } from '../../components/ui/Spinner';
import { MovementTypeBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function InventoryPage() {
  const { hasRole } = useAuth();
  const [result, setResult] = useState<PaginatedData<StockMovement> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; currentStock: number }[]>([]);
  const [form, setForm] = useState({ productId: '', quantity: '', movementType: 'IN', reason: '', reference: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ProductService.getStockMovements({ movementType: movementTypeFilter || undefined, page, limit: 20 });
      setResult(data);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setIsLoading(false); }
  }, [movementTypeFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function openModal() {
    // Load products for dropdown
    const data = await ProductService.getProducts({ limit: 100 });
    setProducts(data.data.map((p) => ({ id: p.id, name: p.name, sku: p.sku, currentStock: p.currentStock })));
    setForm({ productId: '', quantity: '', movementType: 'IN', reason: '', reference: '' });
    setFormErrors({});
    setShowModal(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.productId) errs.productId = 'Select a product';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
      errs.quantity = 'Quantity must be at least 1';
    if (!form.movementType) errs.movementType = 'Select movement type';
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setIsSaving(true);
    try {
      await ProductService.createStockMovement({
        productId: form.productId,
        quantity: Number(form.quantity),
        movementType: form.movementType as 'IN' | 'OUT',
        reason: form.reason || undefined,
        reference: form.reference || undefined,
      });
      toast.success('Stock movement recorded');
      setShowModal(false);
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === form.productId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Movements</h1>
          <p className="page-subtitle">Track all inventory IN / OUT movements</p>
        </div>
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <button className="btn btn-primary" onClick={openModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Record Movement
          </button>
        )}
      </div>

      <div className="card">
        <div className="filters-bar">
          <select className="form-select" style={{ width: 'auto' }} value={movementTypeFilter} onChange={(e) => { setMovementTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="IN">Stock IN</option>
            <option value="OUT">Stock OUT</option>
          </select>
        </div>

        {isLoading ? <PageSpinner /> : error ? (
          <div className="alert alert-error">{error}</div>
        ) : !result?.data.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No stock movements</div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>Reference</th>
                    <th>By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.product.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{m.product.sku}</div>
                      </td>
                      <td><MovementTypeBadge type={m.movementType} /></td>
                      <td style={{ fontWeight: 600, color: m.movementType === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                        {m.movementType === 'IN' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="td-muted">{m.reason || '—'}</td>
                      <td className="td-muted" style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.reference || '—'}</td>
                      <td className="td-muted">{m.createdBy.name}</td>
                      <td className="td-muted">{format(new Date(m.createdAt), 'dd MMM yyyy, hh:mm a')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={result.pagination.limit} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Stock Movement">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Product <span className="required">*</span></label>
            <select className={`form-select${formErrors.productId ? ' error' : ''}`}
              value={form.productId} onChange={(e) => setForm((p) => ({ ...p, productId: e.target.value }))}>
              <option value="">— Select product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.currentStock}</option>
              ))}
            </select>
            {formErrors.productId && <span className="form-error">{formErrors.productId}</span>}
          </div>

          {selectedProduct && (
            <div className="alert alert-info" style={{ margin: 0 }}>
              Current stock: <strong>{selectedProduct.currentStock} units</strong>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Movement Type <span className="required">*</span></label>
              <select className="form-select" value={form.movementType} onChange={(e) => setForm((p) => ({ ...p, movementType: e.target.value }))}>
                <option value="IN">Stock IN</option>
                <option value="OUT">Stock OUT</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity <span className="required">*</span></label>
              <input type="number" className={`form-input${formErrors.quantity ? ' error' : ''}`}
                value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} min="1" step="1" />
              {formErrors.quantity && <span className="form-error">{formErrors.quantity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <input type="text" className="form-input"
              value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="e.g. Purchase order received" />
          </div>

          <div className="form-group">
            <label className="form-label">Reference</label>
            <input type="text" className="form-input"
              value={form.reference} onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} placeholder="e.g. PO-2026-001" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Spinner size={14} /> Saving…</> : 'Record Movement'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
