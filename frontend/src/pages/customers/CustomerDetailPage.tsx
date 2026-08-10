import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as CustomerService from '../../services/customer.service';
import { Customer, CustomerFollowUp } from '../../types';
import { PageSpinner, Spinner } from '../../components/ui/Spinner';
import { CustomerStatusBadge, ChallanStatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type CustomerWithFollowUps = Customer & { followUps: CustomerFollowUp[]; challans: { id: string; challanNumber: string; status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'; totalAmount: number; totalQuantity: number; createdAt: string }[] };

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerWithFollowUps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');

  useEffect(() => {
    if (!id) return;
    CustomerService.getCustomer(id)
      .then((data) => setCustomer(data as CustomerWithFollowUps))
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleAddFollowUp() {
    if (!followUpNote.trim()) { setFollowUpError('Note is required'); return; }
    setIsSavingFollowUp(true);
    setFollowUpError('');
    try {
      const newFollowUp = await CustomerService.addFollowUp(id!, followUpNote, followUpDate || undefined);
      setCustomer((prev) => prev ? { ...prev, followUps: [newFollowUp, ...prev.followUps], followUpDate: followUpDate || prev.followUpDate } : prev);
      toast.success('Follow-up added');
      setShowFollowUpModal(false);
      setFollowUpNote('');
      setFollowUpDate('');
    } catch (e) {
      setFollowUpError(getApiErrorMessage(e));
    } finally {
      setIsSavingFollowUp(false);
    }
  }

  if (isLoading) return <PageSpinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!customer) return <div className="alert alert-error">Customer not found</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')}>← Back</button>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-subtitle">{customer.businessName || customer.customerType}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasRole('ADMIN', 'SALES') && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowFollowUpModal(true)}>
                + Follow-up
              </button>
              <Link to={`/customers/${id}/edit`} className="btn btn-primary">Edit</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Main info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>Customer Information</h2>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">Full Name</span><span className="detail-value">{customer.name}</span></div>
              <div className="detail-item"><span className="detail-label">Mobile</span><span className="detail-value">{customer.mobile}</span></div>
              <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{customer.email || '—'}</span></div>
              <div className="detail-item"><span className="detail-label">Business</span><span className="detail-value">{customer.businessName || '—'}</span></div>
              <div className="detail-item"><span className="detail-label">GST Number</span><span className="detail-value" style={{ fontFamily: 'monospace' }}>{customer.gstNumber || '—'}</span></div>
              <div className="detail-item"><span className="detail-label">Type</span><span className="detail-value"><span className="badge badge-blue">{customer.customerType}</span></span></div>
              <div className="detail-item"><span className="detail-label">Status</span><span className="detail-value"><CustomerStatusBadge status={customer.status} /></span></div>
              <div className="detail-item"><span className="detail-label">Follow-up Date</span><span className="detail-value">{customer.followUpDate ? format(new Date(customer.followUpDate), 'dd MMM yyyy') : '—'}</span></div>
              {customer.address && (
                <div className="detail-item form-full"><span className="detail-label">Address</span><span className="detail-value">{customer.address}</span></div>
              )}
              {customer.notes && (
                <div className="detail-item form-full"><span className="detail-label">Notes</span><span className="detail-value">{customer.notes}</span></div>
              )}
            </div>
          </div>

          {/* Follow-up history */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Follow-up History</h2>
              <span className="badge badge-gray">{customer.followUps.length}</span>
            </div>
            {customer.followUps.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-text">No follow-ups yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {customer.followUps.map((fu) => (
                  <div key={fu.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{fu.createdBy.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(fu.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text)', margin: 0 }}>{fu.note}</p>
                    {fu.followUpDate && (
                      <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>
                        📅 Next follow-up: {format(new Date(fu.followUpDate), 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>Recent Challans</h2>
            {(!customer.challans || customer.challans.length === 0) ? (
              <div className="empty-state" style={{ padding: '16px 0' }}>
                <div className="empty-state-text" style={{ fontSize: 13 }}>No challans yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customer.challans.slice(0, 5).map((ch) => (
                  <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <Link to={`/challans/${ch.id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{ch.challanNumber}</Link>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(ch.createdAt), 'dd MMM yyyy')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <ChallanStatusBadge status={ch.status} />
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>₹{Number(ch.totalAmount).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
                <Link to={`/challans?customerId=${id}`} className="btn btn-ghost btn-sm" style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}>View all challans →</Link>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <div>👥 {customer._count?.followUps || 0} follow-ups total</div>
              <div>📋 {customer._count?.challans || 0} challans total</div>
              <div>📅 Added {format(new Date(customer.createdAt), 'dd MMM yyyy')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Follow-up Modal */}
      <Modal isOpen={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} title="Add Follow-up Note">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Note <span className="required">*</span></label>
            <textarea className="form-textarea" rows={4}
              value={followUpNote} onChange={(e) => { setFollowUpNote(e.target.value); setFollowUpError(''); }}
              placeholder="What was discussed? What's the next step?" />
            {followUpError && <span className="form-error">{followUpError}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Next Follow-up Date</label>
            <input type="date" className="form-input" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddFollowUp} disabled={isSavingFollowUp}>
            {isSavingFollowUp ? <><Spinner size={14} /> Saving…</> : 'Add Follow-up'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
