import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as ChallanService from '../../services/challan.service';
import { Challan } from '../../types';
import { PageSpinner, Spinner } from '../../components/ui/Spinner';
import { ChallanStatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    ChallanService.getChallan(id)
      .then(setChallan)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleConfirm() {
    if (!id) return;
    setIsConfirming(true);
    try {
      const updated = await ChallanService.confirmChallan(id);
      setChallan(updated);
      setShowConfirmDialog(false);
      toast.success('Challan confirmed and stock deducted');
    } catch (e) {
      const msg = getApiErrorMessage(e);
      toast.error(msg, { duration: 6000 });
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleCancel() {
    if (!id) return;
    setIsCancelling(true);
    try {
      const updated = await ChallanService.cancelChallan(id);
      setChallan(updated);
      setShowCancelDialog(false);
      toast.success('Challan cancelled');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) return <PageSpinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!challan) return <div className="alert alert-error">Challan not found</div>;

  const isDraft = challan.status === 'DRAFT';
  const isConfirmed = challan.status === 'CONFIRMED';

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/challans')}>← Back</button>
          <div>
            <h1 className="page-title" style={{ fontFamily: 'monospace' }}>{challan.challanNumber}</h1>
            <p className="page-subtitle">Created {format(new Date(challan.createdAt), 'dd MMM yyyy, hh:mm a')} by {challan.createdBy.name}</p>
          </div>
          <ChallanStatusBadge status={challan.status} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isDraft && hasRole('ADMIN', 'SALES', 'WAREHOUSE') && (
            <button className="btn btn-success" onClick={() => setShowConfirmDialog(true)}>
              ✓ Confirm Challan
            </button>
          )}
          {(isDraft || isConfirmed) && hasRole('ADMIN', 'SALES') && (
            <button className="btn btn-danger" onClick={() => setShowCancelDialog(true)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {isDraft && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          This challan is a <strong>DRAFT</strong> — stock has NOT been deducted. Confirm to finalize and deduct stock.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Items */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>Items</h2>
            <div className="table-wrap">
              <table className="challan-items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th className="text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {challan.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.productName}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{item.productSku}</td>
                      <td>₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                      <td className="text-right" style={{ fontWeight: 600 }}>₹{Number(item.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr className="challan-total-row">
                    <td colSpan={3}></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total</td>
                    <td style={{ fontWeight: 700 }}>{challan.totalQuantity} units</td>
                    <td className="text-right" style={{ fontWeight: 700, fontSize: 16 }}>₹{Number(challan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {challan.notes && (
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: 8 }}>Notes</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{challan.notes}</p>
            </div>
          )}
        </div>

        {/* Side details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14 }}>Customer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 1 }}>Name</div>
                <Link to={`/customers/${challan.customerId}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>{challan.customer.name}</Link>
              </div>
              {challan.customer.businessName && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 1 }}>Business</div>
                  <div>{challan.customer.businessName}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 1 }}>Mobile</div>
                <div>{challan.customer.mobile}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14 }}>Challan Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <div>
                <div className="detail-label">Status</div>
                <div style={{ marginTop: 4 }}><ChallanStatusBadge status={challan.status} /></div>
              </div>
              <div>
                <div className="detail-label">Created By</div>
                <div className="detail-value">{challan.createdBy.name} ({challan.createdBy.role})</div>
              </div>
              <div>
                <div className="detail-label">Created At</div>
                <div className="detail-value">{format(new Date(challan.createdAt), 'dd MMM yyyy, hh:mm a')}</div>
              </div>
              {challan.confirmedAt && (
                <div>
                  <div className="detail-label">Confirmed At</div>
                  <div className="detail-value">{format(new Date(challan.confirmedAt), 'dd MMM yyyy, hh:mm a')}</div>
                </div>
              )}
              {challan.cancelledAt && (
                <div>
                  <div className="detail-label">Cancelled At</div>
                  <div className="detail-value">{format(new Date(challan.cancelledAt), 'dd MMM yyyy, hh:mm a')}</div>
                </div>
              )}
            </div>
          </div>

          {isConfirmed && (
            <div className="alert alert-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Stock has been deducted from inventory for all items.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirm}
        title="Confirm Challan"
        message={`This will deduct stock for all ${challan.items.length} item(s) from inventory. If any product has insufficient stock, the entire operation will be rejected. Proceed?`}
        confirmLabel="Yes, Confirm Challan"
        variant="primary"
        isLoading={isConfirming}
      />

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        title="Cancel Challan"
        message={isConfirmed
          ? 'This challan is CONFIRMED. Cancelling it will restore stock for all items. Are you sure?'
          : 'Are you sure you want to cancel this draft challan?'}
        confirmLabel="Cancel Challan"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
}
