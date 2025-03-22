'use client';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import CategoryManagement from '../components/products/category/category';

export default function CategoriesPage() {
    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
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
