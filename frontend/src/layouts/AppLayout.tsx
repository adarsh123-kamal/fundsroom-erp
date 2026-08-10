import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Toaster } from 'react-hot-toast';

export function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: '14px', maxWidth: '380px' },
          success: { style: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' } },
          error: { style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } },
        }}
      />
    </div>
  );
}
