import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import * as ProductService from '../../services/product.service';
import { Product } from '../../types';
import { PageSpinner, Spinner } from '../../components/ui/Spinner';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '', sku: '', category: '', unitPrice: '',
    currentStock: '0', minimumStock: '0', location: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    ProductService.getProduct(id!)
      .then((p: Product) => {
        setForm({
          name: p.name, sku: p.sku, category: p.category || '',
          unitPrice: String(p.unitPrice), currentStock: String(p.currentStock),
          minimumStock: String(p.minimumStock), location: p.location || '',
        });
      })
      .catch((e) => toast.error(getApiErrorMessage(e)))
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.unitPrice || isNaN(Number(form.unitPrice)) || Number(form.unitPrice) <= 0)
      errs.unitPrice = 'Unit price must be a positive number';
    if (isNaN(Number(form.currentStock)) || Number(form.currentStock) < 0)
      errs.currentStock = 'Current stock must be 0 or more';
    if (isNaN(Number(form.minimumStock)) || Number(form.minimumStock) < 0)
      errs.minimumStock = 'Minimum stock must be 0 or more';
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category || undefined,
        unitPrice: Number(form.unitPrice),
        currentStock: isEdit ? undefined : Number(form.currentStock), // can't change stock directly in edit
        minimumStock: Number(form.minimumStock),
        location: form.location || undefined,
      };

      if (isEdit) {
        await ProductService.updateProduct(id!, payload);
        toast.success('Product updated');
        navigate('/products');
      } else {
        await ProductService.createProduct(payload);
        toast.success('Product created');
        navigate('/products');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update product details' : 'Add a new product to inventory'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Product Name <span className="required">*</span></label>
              <input type="text" className={`form-input${errors.name ? ' error' : ''}`}
                value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Basmati Rice Premium" />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">SKU / Code <span className="required">*</span></label>
              <input type="text" className={`form-input${errors.sku ? ' error' : ''}`}
                value={form.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} placeholder="e.g. RICE-BAS-001" />
              {errors.sku && <span className="form-error">{errors.sku}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input type="text" className="form-input"
                value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Grains" />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price (₹) <span className="required">*</span></label>
              <input type="number" className={`form-input${errors.unitPrice ? ' error' : ''}`}
                value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} min="0.01" step="0.01" placeholder="120.00" />
              {errors.unitPrice && <span className="form-error">{errors.unitPrice}</span>}
            </div>

            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Initial Stock</label>
                <input type="number" className={`form-input${errors.currentStock ? ' error' : ''}`}
                  value={form.currentStock} onChange={(e) => set('currentStock', e.target.value)} min="0" step="1" />
                <span className="form-hint">Use Stock Movements to adjust stock later</span>
                {errors.currentStock && <span className="form-error">{errors.currentStock}</span>}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Minimum Stock Alert</label>
              <input type="number" className={`form-input${errors.minimumStock ? ' error' : ''}`}
                value={form.minimumStock} onChange={(e) => set('minimumStock', e.target.value)} min="0" step="1" />
              <span className="form-hint">Alert when stock falls to this level</span>
              {errors.minimumStock && <span className="form-error">{errors.minimumStock}</span>}
            </div>

            {isEdit && (
              <div className="form-group">
                <label className="form-label">Location / Warehouse</label>
                <input type="text" className="form-input"
                  value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Rack A-1" />
              </div>
            )}

            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Location / Warehouse</label>
                <input type="text" className="form-input"
                  value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Rack A-1" />
              </div>
            )}
          </div>

          {isEdit && (
            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              Current stock cannot be changed directly. Use <Link to="/inventory" style={{ fontWeight: 600, color: 'var(--info)' }}>Stock Movements</Link> to adjust inventory.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <><Spinner size={16} /> Saving…</> : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
