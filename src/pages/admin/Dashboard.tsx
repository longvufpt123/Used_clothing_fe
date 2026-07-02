import React from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import './Dashboard.css';

interface ProductInventory {
  id: number;
  name: string;
  stock: number;
  price: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export const Dashboard: React.FC = () => {
  const inventoryData: ProductInventory[] = [
    { id: 1, name: 'Vintage Leather Jacket (1990s)', stock: 5, price: '$89.00', status: 'In Stock' },
    { id: 2, name: 'Retro Oversized Denim Shirt', stock: 12, price: '$34.00', status: 'In Stock' },
    { id: 3, name: 'Classic Wool Trench Coat', stock: 2, price: '$110.00', status: 'Low Stock' },
    { id: 4, name: 'Corduroy Cargo Pants (Beige)', stock: 0, price: '$45.00', status: 'Out of Stock' },
  ];

  const columns = [
    { header: 'ID', accessor: 'id' as const },
    { header: 'Product Name', accessor: 'name' as const },
    { header: 'Price', accessor: 'price' as const },
    { header: 'Stock Qty', accessor: 'stock' as const },
    {
      header: 'Status',
      accessor: (row: ProductInventory) => {
        const variant =
          row.status === 'In Stock'
            ? ('success' as const)
            : row.status === 'Low Stock'
            ? ('warning' as const)
            : ('danger' as const);
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <AdminLayout role="admin">
      <div className="admin-dashboard">
        <h2 className="dashboard-title">System Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-box glass">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">$4,250.00</span>
          </div>
          <div className="metric-box glass">
            <span className="metric-label">Active Orders</span>
            <span className="metric-value">18</span>
          </div>
          <div className="metric-box glass">
            <span className="metric-label">Sanitized Items</span>
            <span className="metric-value">148</span>
          </div>
        </div>

        <div className="inventory-section">
          <h3>Catalog Inventory Monitor</h3>
          <Table columns={columns} data={inventoryData} />
        </div>
      </div>
    </AdminLayout>
  );
};
export default Dashboard;
