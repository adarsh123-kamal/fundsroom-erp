import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerFormPage } from './pages/customers/CustomerFormPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductFormPage } from './pages/products/ProductFormPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { LowStockPage } from './pages/inventory/LowStockPage';
import { ChallansPage } from './pages/challans/ChallansPage';
import { ChallanFormPage } from './pages/challans/ChallanFormPage';
import { ChallanDetailPage } from './pages/challans/ChallanDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Create/Edit customers — ADMIN, SALES only */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']} />}>
                <Route path="/customers/new" element={<CustomerFormPage />} />
                <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
              </Route>
              {/* View customers — ADMIN, SALES, ACCOUNTS */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']} />}>
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
              </Route>

              {/* Create/Edit products — ADMIN, WAREHOUSE */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']} />}>
                <Route path="/products/new" element={<ProductFormPage />} />
                <Route path="/products/:id/edit" element={<ProductFormPage />} />
              </Route>
              {/* Products — all roles */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/low-stock" element={<LowStockPage />} />

              {/* Inventory — ADMIN, WAREHOUSE, ACCOUNTS */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'ACCOUNTS']} />}>
                <Route path="/inventory" element={<InventoryPage />} />
              </Route>

              {/* Challans — Create first to avoid :id matching "new" */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']} />}>
                <Route path="/challans/new" element={<ChallanFormPage />} />
              </Route>
              {/* Challans — all roles */}
              <Route path="/challans" element={<ChallansPage />} />
              <Route path="/challans/:id" element={<ChallanDetailPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
