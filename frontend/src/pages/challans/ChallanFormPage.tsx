import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import * as ChallanService from '../../services/challan.service';
import * as CustomerService from '../../services/customer.service';
import * as ProductService from '../../services/product.service';
import { Customer, Product } from '../../types';
import { PageSpinner, Spinner } from '../../components/ui/Spinner';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

interface LineItem {
  productId: string;
  quantity: number;
  // display helpers (not sent to API)
  productName: string;
  productSku: string;
  unitPrice: number;
  totalPrice: number;
  currentStock: number;
}

export function ChallanFormPage() {
  const navigate = useNavigate();

  const [isInit, setIsInit] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // For adding a new line
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newQty, setNewQty] = useState('1');

  useEffect(() => {
    Promise.all([
      CustomerService.getCustomers({ limit: 100 }),
      ProductService.getProducts({ limit: 100 }),
    ])
      .then(([c, p]) => {
        setCustomers(c.data);
        setProducts(p.data);
      })
      .catch((e) => toast.error(getApiErrorMessage(e)))
      .finally(() => setIsInit(false));
  }, []);

  function addLine() {
    if (!selectedProductId) { toast.error('Select a product'); return; }
    const qty = parseInt(newQty);
    if (!qty || qty < 1) { toast.error('Quantity must be at least 1'); return; }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Check if already in list
    const existing = items.findIndex((i) => i.productId === selectedProductId);
    if (existing >= 0) {
      setItems((prev) => prev.map((item, idx) => idx === existing ? {
        ...item,
        quantity: item.quantity + qty,
        totalPrice: (item.quantity + qty) * item.unitPrice,
      } : item));
    } else {
      setItems((prev) => [...prev, {
        productId: product.id,
        quantity: qty,
        productName: product.name,
        productSku: product.sku,
        unitPrice: Number(product.unitPrice),
        totalPrice: qty * Number(product.unitPrice),
        currentStock: product.currentStock,
      }]);
    }
    setSelectedProductId('');
    setNewQty('1');
    setErrors((prev) => { const n = { ...prev }; delete n.items; return n; });
  }

  function updateItemQty(index: number, qty: number) {
    if (qty < 1) return;
    setItems((prev) => prev.map((item, i) => i === index ? {
      ...item, quantity: qty, totalPrice: qty * item.unitPrice,
    } : item));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.totalPrice, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!customerId) errs.customerId = 'Select a customer';
    if (items.length === 0) errs.items = 'Add at least one product';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSaving(true);
    try {
      const challan = await ChallanService.createChallan({
        customerId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        notes: notes || undefined,
      });
      toast.success('Challan created as draft');
      navigate(`/challans/${challan.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (isInit) return <PageSpinner />;

  // Filter out products already added
  const availableProducts = products.filter((p) => !items.find((i) => i.productId === p.id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Challan</h1>
          <p className="page-subtitle">New sales challan — saved as draft until confirmed</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Customer */}
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: 14 }}>Customer</h2>
              <div className="form-group">
                <label className="form-label">Select Customer <span className="required">*</span></label>
                <select className={`form-select${errors.customerId ? ' error' : ''}`}
                  value={customerId} onChange={(e) => { setCustomerId(e.target.value); setErrors((p) => { const n = {...p}; delete n.customerId; return n; }); }}>
                  <option value="">— Choose customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` — ${c.businessName}` : ''}</option>
                  ))}
                </select>
                {errors.customerId && <span className="form-error">{errors.customerId}</span>}
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for this challan" />
              </div>
            </div>

            {/* Products */}
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: 14 }}>Products</h2>

              {/* Add product row */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <select className="form-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                    <option value="">— Select product to add —</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — ₹{Number(p.unitPrice).toFixed(2)} — Stock: {p.currentStock}
                      </option>
                    ))}
                  </select>
                </div>
                <input type="number" className="form-input" style={{ width: 80 }} min="1" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
                <button type="button" className="btn btn-secondary" onClick={addLine}>+ Add</button>
              </div>

              {errors.items && <span className="form-error" style={{ marginBottom: 10, display: 'block' }}>{errors.items}</span>}

              {items.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state-text">No products added yet</div>
                  <div className="empty-state-sub">Select a product above and click Add</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="challan-items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Unit Price</th>
                        <th>Stock</th>
                        <th>Quantity</th>
                        <th className="text-right">Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.productId}>
                          <td style={{ fontWeight: 600 }}>{item.productName}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.productSku}</td>
                          <td>₹{item.unitPrice.toFixed(2)}</td>
                          <td><span className={item.quantity > item.currentStock ? 'stock-low' : 'stock-ok'}>{item.currentStock}</span></td>
                          <td>
                            <input type="number" className="form-input" style={{ width: 72 }}
                              min="1" value={item.quantity}
                              onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 1)} />
                          </td>
                          <td className="text-right" style={{ fontWeight: 600 }}>₹{item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>
                            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeItem(idx)} style={{ color: 'var(--danger)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="challan-total-row">
                        <td colSpan={4}></td>
                        <td style={{ fontWeight: 700 }}>{totalQty} units</td>
                        <td className="text-right" style={{ fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Summary panel */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 20 }}>
              <h2 className="card-title" style={{ marginBottom: 16 }}>Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Products</span>
                  <span>{items.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Quantity</span>
                  <span>{totalQty}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="alert alert-info" style={{ marginTop: 16, fontSize: 13 }}>
                Challan will be saved as <strong>DRAFT</strong>. Stock is NOT deducted until you confirm it.
              </div>

              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 16 }} disabled={isSaving}>
                {isSaving ? <><Spinner size={16} /> Saving…</> : 'Save as Draft'}
              </button>
              <button type="button" className="btn btn-secondary w-full" style={{ marginTop: 8 }} onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
