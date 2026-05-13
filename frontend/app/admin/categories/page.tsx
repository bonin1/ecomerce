'use client';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import CategoryManagement from '../components/products/category/category';

export default function CategoriesPage() {
    return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                <div className="admin-header">
                    <h1>Category Management</h1>
                </div>
                <div className="admin-content">
                    <CategoryManagement />
                </div>
            </main>
        </div>
    );
}
