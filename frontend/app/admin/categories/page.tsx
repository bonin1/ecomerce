'use client';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import CategoryManagement from '../components/products/category/category';

export default function CategoriesPage() {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                <div className="mb-6 border-b border-slate-200 pb-4">
                    <h1 className="text-2xl font-bold text-slate-800">Category management</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Organize catalog taxonomy. Product counts per category update from the server.
                    </p>
                </div>
                <CategoryManagement />
            </main>
        </div>
    );
}
