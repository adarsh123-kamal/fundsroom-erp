import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../services/dashboard.service';
import { DashboardStats } from '../../types';
import { PageSpinner } from '../../components/ui/Spinner';
import { ChallanStatusBadge } from '../../components/ui/Badge';
import { getApiErrorMessage } from '../../services/api';
import { format } from 'date-fns';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <PageSpinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: 'blue',
      link: '/customers',
    },
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
      color: 'purple',
      link: '/products',
    },
    {
      label: 'Total Stock Units',
      value: stats.totalStock.toLocaleString(),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
      color: 'teal',
      link: '/inventory',
    },
    {
      label: 'Low Stock Alerts',
      value: stats.lowStockCount,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      color: 'red',
      link: '/low-stock',
      meta: stats.lowStockCount > 0 ? 'Action required' : 'All good',
    },
    {
      label: 'Draft Challans',
      value: stats.draftChallans,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
        </svg>
      ),
      color: 'orange',
      link: '/challans?status=DRAFT',
    },
    {
      label: 'Confirmed Challans',
      value: stats.confirmedChallans,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      color: 'green',
      link: '/challans?status=CONFIRMED',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here's what's happening today.</p>
        </div>
        <Link to="/challans/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Challan
        </Link>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <Link to={card.link} key={card.label} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', transition: 'box-shadow 150ms' }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
            >
              <div className="stat-card-top">
                <span className="stat-label">{card.label}</span>
                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
              </div>
              <div className="stat-value">{card.value}</div>
              {card.meta && <div className="stat-meta">{card.meta}</div>}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Challans */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Challans</h2>
          <Link to="/challans" className="btn btn-ghost btn-sm">View all →</Link>
        </div>

        {stats.recentChallans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No challans yet</div>
            <div className="empty-state-sub">Create your first challan to get started.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentChallans.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/challans/${c.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td>{c.customer.name}</td>
                    <td><ChallanStatusBadge status={c.status} /></td>
                    <td>₹{Number(c.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="td-muted">{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
