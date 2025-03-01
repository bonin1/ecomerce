'use client';
import { useState } from 'react';
import Sidebar from '@/app/components/admin/Sidebar/sidebar';
import CategoryManagement from '../components/products/category/category';
import ProductManagement from '../components/products/product/Product';
import './products.scss';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Product Management</h1>
          <div className="tab-navigation">
            <button 
              className={activeTab === 'products' ? 'active' : ''}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button 
              className={activeTab === 'categories' ? 'active' : ''}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
          </div>
        </div>
        <div className="admin-content">
          {activeTab === 'products' ? <ProductManagement /> : <CategoryManagement />}
        </div>
      </main>
    </div>
  );
}