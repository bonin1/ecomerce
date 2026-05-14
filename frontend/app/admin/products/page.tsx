'use client';
import Link from 'next/link';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import ProductManagement from '../components/products/product/Product';

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden p-6 md:p-8">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-800">Product Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add, edit, or remove products. For low stock and review queues, see the{' '}
            <Link href="/admin/dashboard" className="font-semibold text-indigo-600 hover:underline">
              dashboard overview
            </Link>
            .
          </p>
        </div>
        <div className="">
          <ProductManagement />
        </div>
      </main>
    </div>
  );
}
