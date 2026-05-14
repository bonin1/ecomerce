'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/app/utils/apiClient';

interface Category {
    id: number;
    product_category: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = (await apiClient('/product/categories', {
                    method: 'GET',
                    skipAuth: true,
                })) as { success?: boolean; data?: Category[] };
                if (cancelled) return;
                if (res?.success && Array.isArray(res.data)) {
                    setCategories(res.data);
                } else {
                    setError('Could not load categories.');
                }
            } catch {
                if (!cancelled) setError('Could not load categories.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="min-h-[60vh] bg-slate-50 py-10">
            <div className="mx-auto max-w-4xl px-4">
                <h1 className="mb-2 text-3xl font-bold text-slate-900">Shop by category</h1>
                <p className="mb-8 text-slate-600">Browse products grouped by category.</p>

                {loading ? (
                    <p className="text-slate-600">Loading categories…</p>
                ) : error ? (
                    <p className="font-medium text-red-600">{error}</p>
                ) : categories.length === 0 ? (
                    <p className="text-slate-600">No categories are available yet.</p>
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {categories.map((c) => (
                            <li key={c.id}>
                                <Link
                                    href={`/categories/${c.product_category.toLowerCase()}`}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand-primary hover:text-brand-primary"
                                >
                                    <span className="capitalize">{c.product_category}</span>
                                    <span aria-hidden className="text-slate-400">→</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
