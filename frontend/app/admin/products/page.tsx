'use client';

import Link from 'next/link';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import ProductManagement from '../components/products/product/Product';

export default function ProductsPage() {
    return (
        <div className="flex min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 md:px-8 md:py-10">
                <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Catalog</p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Products</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                            Manage inventory, pricing, media, and payment methods. Use the dashboard for low-stock
                            alerts and the reviews queue for moderation.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <Link
                                href="/admin/dashboard"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <i className="bi bi-speedometer2 text-slate-500" aria-hidden />
                                Dashboard
                            </Link>
                            <Link
                                href="/admin/categories"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <i className="bi bi-folder2-open text-slate-500" aria-hidden />
                                Categories
                            </Link>
                            <Link
                                href="/admin/reviews"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <i className="bi bi-chat-square-text text-slate-500" aria-hidden />
                                Reviews
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5 backdrop-blur-sm lg:min-w-[280px]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Quick tips</p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                Bulk actions: select rows, then export or adjust stock.
                            </li>
                            <li className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                Filters help find discounts ending soon or low inventory.
                            </li>
                        </ul>
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04] sm:p-4 md:p-6">
                    <ProductManagement />
                </section>
            </main>
        </div>
    );
}
