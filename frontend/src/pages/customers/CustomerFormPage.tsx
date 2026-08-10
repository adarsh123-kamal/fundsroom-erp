import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as CustomerService from '../../services/customer.service';
import { Customer } from '../../types';
import { PageSpinner, Spinner } from '../../components/ui/Spinner';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', businessName: '',
    gstNumber: '', customerType: 'RETAIL', address: '',
    status: 'LEAD', followUpDate: '', notes: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    CustomerService.getCustomer(id!)
      .then((c: Customer) => {
        setForm({
          name: c.name,
          mobile: c.mobile,
          email: c.email || '',
          businessName: c.businessName || '',
          gstNumber: c.gstNumber || '',
          customerType: c.customerType,
          address: c.address || '',
          status: c.status,
          followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
          notes: c.notes || '',
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
    if (!form.name.trim()) errs.name = 'Customer name is required';
    if (!form.mobile.trim()) errs.mobile = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile)) errs.mobile = 'Must be a valid 10-digit Indian mobile';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.customerType) errs.customerType = 'Customer type is required';
    if (form.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber))
      errs.gstNumber = 'Invalid GST number format';
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
        mobile: form.mobile.trim(),
        email: form.email || undefined,
        businessName: form.businessName || undefined,
        gstNumber: form.gstNumber || undefined,
        customerType: form.customerType as Customer['customerType'],
        address: form.address || undefined,
        status: form.status as Customer['status'],
        followUpDate: form.followUpDate || undefined,
        notes: form.notes || undefined,
      };

      if (isEdit) {
        await CustomerService.updateCustomer(id!, payload);
        toast.success('Customer updated');
        navigate(`/customers/${id}`);
      } else {
        const c = await CustomerService.createCustomer(payload);
        toast.success('Customer created');
        navigate(`/customers/${c.id}`);
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
          <h1 className="page-title">{isEdit ? 'Edit Customer' : 'Add Customer'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update customer information' : 'Add a new customer to your CRM'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name <span className="required">*</span></label>
              <input id="name" type="text" className={`form-input${errors.name ? ' error' : ''}`}
                value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Rajesh Kumar" />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mobile">Mobile Number <span className="required">*</span></label>
              <input id="mobile" type="tel" className={`form-input${errors.mobile ? ' error' : ''}`}
                value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="9876543210" maxLength={10} />
              {errors.mobile && <span className="form-error">{errors.mobile}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input id="email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
                value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="businessName">Business Name</label>
              <input id="businessName" type="text" className="form-input"
                value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="e.g. Kumar Traders" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="customerType">Customer Type <span className="required">*</span></label>
              <select id="customerType" className="form-select" value={form.customerType} onChange={(e) => set('customerType', e.target.value)}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select id="status" className="form-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="gstNumber">GST Number</label>
              <input id="gstNumber" type="text" className={`form-input${errors.gstNumber ? ' error' : ''}`}
                value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5" maxLength={15} />
              {errors.gstNumber && <span className="form-error">{errors.gstNumber}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="followUpDate">Follow-up Date</label>
              <input id="followUpDate" type="date" className="form-input"
                value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
            </div>

            <div className="form-group form-full">
              <label className="form-label" htmlFor="address">Address</label>
              <input id="address" type="text" className="form-input"
                value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Full address" />
            </div>

            <div className="form-group form-full">
              <label className="form-label" htmlFor="notes">Notes</label>
              <textarea id="notes" className="form-textarea"
                value={form.notes} onChange={(e) => set('notes', e.target.value)}
                placeholder="Any additional notes about this customer" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <><Spinner size={16} /> Saving…</> : isEdit ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
