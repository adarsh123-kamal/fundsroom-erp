import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="sidebar-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'CRM',
    items: [
      {
        to: '/customers',
        label: 'Customers',
        icon: (
          <svg className="sidebar-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
      },
    ],
  },
  {
    label: 'Inventory',
    items: [
      {
        to: '/products',
        label: 'Products',
        icon: (
          <svg className="sidebar-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        ),
      },
      {
        to: '/inventory',
        label: 'Stock Movements',
        icon: (
          <svg className="sidebar-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16v16H4z" /><path d="M9 9h6v6H9z" />
          </svg>
        ),
        roles: ['ADMIN', 'WAREHOUSE', 'ACCOUNTS'],
      },
      {
        to: '/low-stock',
        label: 'Low Stock',
        icon: (
          <svg className="sidebar-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        to: '/challans',
        label: 'Challans',
        icon: (
          <svg className="sidebar-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
    ],
  },
] as const;

export function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">F</div>
        <div>
          <div className="sidebar-logo-text">FundsRoom</div>
          <div className="sidebar-logo-sub">ERP Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = (section.items as unknown as NavItem[]).filter(
            (item) => !item.roles || hasRole(...(item.roles as Parameters<typeof hasRole>))
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' active' : ''}`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user ? getInitials(user.name) : '??'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
