'use client';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import ProductManagement from '../components/products/product/Product';
import './products.scss';

export default function ProductsPage() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Product Management</h1>
        </div>
        <div className="admin-content">
          <ProductManagement />
        </div>
      </main>
    </div>
  );
}