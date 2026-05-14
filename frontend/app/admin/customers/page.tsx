'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import { apiClient } from '@/app/utils/apiClient';

type AdminMe = { name?: string; role?: string };

type CustomerRow = {
    id: number;
    name: string;
    lastname: string;
    email: string;
    phoneNumber: string | null;
    city: string | null;
    role: string;
    joinedAt: string;
    orderCount: number;
    lifetimeSpend: number;
};

type Summary = {
    totalCustomers: number;
    totalRevenue: number;
    totalOrders: number;
    repeatBuyers: number;
};

export default function AdminCustomersPage() {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<AdminMe | null>(null);
    const [ready, setReady] = useState(false);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [rows, setRows] = useState<CustomerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const limit = 15;
    const [search, setSearch] = useState('');
    const [searchDraft, setSearchDraft] = useState('');

    const loadSummary = useCallback(async () => {
        try {
            const res = (await apiClient('/admin/customers/summary')) as {
                success?: boolean;
                data?: Summary;
            };
            if (res?.success && res.data) setSummary(res.data);
        } catch {
            /* optional */
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (search.trim()) params.set('search', search.trim());
            const res = (await apiClient(`/admin/customers?${params}`)) as {
                success?: boolean;
                data?: CustomerRow[];
                meta?: { total: number; pages: number };
                message?: string;
            };
            if (res?.success && Array.isArray(res.data)) {
                setRows(res.data);
                setTotal(res.meta?.total ?? 0);
                setPages(res.meta?.pages ?? 1);
            } else {
                setRows([]);
                toast.error(res?.message || 'Could not load customers');
            }
        } catch {
            toast.error('Could not load customers');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        const user = localStorage.getItem('adminUser');
        const token = localStorage.getItem('adminToken');
        if (!user || !token) {
            router.replace('/admin/login');
            return;
        }
        const syncCookie = Cookies.get('adminTokenSync');
        if (token && !syncCookie) {
            Cookies.set('adminTokenSync', token, { expires: 1 / 6, path: '/', sameSite: 'Strict' });
        }
        try {
            setAdminUser(JSON.parse(user) as AdminMe);
        } catch {
            router.replace('/admin/login');
            return;
        }
        setReady(true);
    }, [router]);

    useEffect(() => {
        if (!ready || !adminUser) return;
        void loadSummary();
    }, [ready, adminUser, loadSummary]);

    useEffect(() => {
        if (!ready || !adminUser) return;
        void load();
    }, [ready, adminUser, load]);

    if (!ready || !adminUser) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
            </div>
        );
    }

    const stat = (label: string, value: string | number, icon: string, tone: string) => (
        <div
            className={`rounded border border-slate-200 bg-white p-4 shadow-sm ${tone}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
                <i className={`bi ${icon} text-lg text-brand-primary`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Shoppers with lifetime value, order counts, and repeat purchase signals. Export-friendly
                            table layout.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:border-brand-primary hover:text-brand-primary"
                        >
                            <i className="bi bi-receipt" /> Orders
                        </Link>
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center gap-2 rounded bg-brand-primary px-4 py-2 text-sm font-bold text-white no-underline hover:bg-brand-primary/90"
                        >
                            <i className="bi bi-people" /> User accounts
                        </Link>
                    </div>
                </div>

                {summary ? (
                    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {stat('Total customers', summary.totalCustomers, 'bi-person-lines-fill', '')}
                        {stat(
                            'Revenue (non-cancelled)',
                            `$${Number(summary.totalRevenue).toFixed(2)}`,
                            'bi-currency-dollar',
                            ''
                        )}
                        {stat('Orders placed', summary.totalOrders, 'bi-bag-check', '')}
                        {stat('Repeat buyers (2+ orders)', summary.repeatBuyers, 'bi-arrow-repeat', '')}
                    </div>
                ) : null}

                <div className="mb-4 flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Search customers
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                placeholder="Email or name"
                                className="w-full max-w-md rounded border border-slate-200 px-3 py-2 text-sm"
                            />
                            <button
                                type="button"
                                className="rounded bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary/90"
                                onClick={() => {
                                    setPage(1);
                                    setSearch(searchDraft);
                                }}
                            >
                                <i className="bi bi-search" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                                <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
                                    <tr>
                                        <th className="border-b border-slate-200 px-4 py-3">Customer</th>
                                        <th className="border-b border-slate-200 px-4 py-3">Location</th>
                                        <th className="border-b border-slate-200 px-4 py-3">Orders</th>
                                        <th className="border-b border-slate-200 px-4 py-3">Lifetime spend</th>
                                        <th className="border-b border-slate-200 px-4 py-3">Since</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50">
                                            <td className="border-b border-slate-100 px-4 py-3">
                                                <div className="font-semibold text-slate-800">
                                                    {c.name} {c.lastname}
                                                </div>
                                                <div className="text-xs text-slate-500">{c.email}</div>
                                                <div className="mt-1 text-[11px] uppercase text-slate-400">
                                                    {c.role}
                                                </div>
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3 text-xs text-slate-600">
                                                {c.city || '—'}
                                                {c.phoneNumber ? (
                                                    <div className="text-slate-500">{c.phoneNumber}</div>
                                                ) : null}
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">
                                                {c.orderCount}
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3 font-bold text-brand-primary">
                                                ${Number(c.lifetimeSpend).toFixed(2)}
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3 text-xs text-slate-600">
                                                {new Date(c.joinedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
                    <span>
                        Page {page} of {pages} · {total} customers
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={page >= pages}
                            onClick={() => setPage((p) => Math.min(pages, p + 1))}
                            className="rounded border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
