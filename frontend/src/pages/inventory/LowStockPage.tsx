import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLowStockProducts } from '../../services/product.service';
import { PageSpinner } from '../../components/ui/Spinner';
import { getApiErrorMessage } from '../../services/api';

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  current_stock: number;
  minimum_stock: number;
  unit_price: number;
  location: string | null;
}

export function LowStockPage() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLowStockProducts()
      .then((data) => setProducts(data as LowStockProduct[]))
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Low Stock Alerts</h1>
          <p className="page-subtitle">Products where current stock ≤ minimum stock level</p>
        </div>
        <Link to="/inventory" className="btn btn-primary">Record Stock IN</Link>
      </div>

      <div className="card">
        {isLoading ? <PageSpinner /> : error ? (
          <div className="alert alert-error">{error}</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text">All stock levels are healthy!</div>
            <div className="empty-state-sub">No products are below their minimum stock threshold.</div>
          </div>
        ) : (
          <>
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {products.length} product{products.length !== 1 ? 's' : ''} need restocking.
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Minimum Stock</th>
                    <th>Deficit</th>
                    <th>Location</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const deficit = p.minimum_stock - p.current_stock;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>
                        </td>
                        <td className="td-muted">{p.category || '—'}</td>
                        <td><span className="stock-low">{p.current_stock}</span></td>
                        <td className="td-muted">{p.minimum_stock}</td>
                        <td>
                          <span className="badge badge-red">-{deficit}</span>
                        </td>
                        <td className="td-muted">{p.location || '—'}</td>
                        <td>
                          <Link to="/inventory" className="btn btn-primary btn-sm">+ Restock</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
